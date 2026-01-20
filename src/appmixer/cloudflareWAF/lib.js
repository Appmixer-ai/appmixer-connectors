const CloudflareAPI = require('./CloudflareAPI');
const { Address4, Address6 } = require('ip-address');
const config = require('./config');

const getModel = (context) => require('./RulesIPsModel')(context);

const deleteExpireIps = async function(context) {

    const expired = await getExpiredItems(context);

    if (expired.length) {
        await context.log('info', { step: '[Cloudflare WAF] expired.', data: sanitizeItems(expired) });
    }

    const rulesToUpdate = await retrieveRulesForUpdate(context, expired);
    if (rulesToUpdate.length) {
        await context.log('info', { step: '[Cloudflare WAF] rules to update.', data: sanitizeItems(rulesToUpdate) });
    }

    const dbItemsToDelete = await updateRules(context, rulesToUpdate);
    await deleteDBItems(context, dbItemsToDelete);
};

const retrieveRulesForUpdate = async function(context, expired = []) {

    const rulesToUpdate = [];
    const getRulePromises = expired.map(item => {
        const { auth, zoneId, rulesetId } = item;
        const client = new CloudflareAPI({ token: auth.token, zoneId });
        return client.getRules(context, rulesetId);
    });

    (await Promise.allSettled(getRulePromises)).forEach((result, i) => {

        const item = expired[i];

        if (result.status === 'fulfilled') {

            const { result: { rules = [] } } = result.value;
            const rule = rules.find(r => r.id === item.ruleId);
            if (rule) {
                rulesToUpdate.push({
                    ...item,
                    rule: removeIpsFromRule(rule, item?.ips?.map(i => i.ip))
                });
            }
        } else {
            context.log('info', {
                step: '[Cloudflare WAF] Unable to retrieve rule for expired item',
                data: sanitizeItems([item])
            });
        }
    });

    return rulesToUpdate;
};

const updateRules = async function(context, rulesToUpdate) {

    let dbItemsToDelete = [];
    const updatePromises = rulesToUpdate.map(ruleToUpdate => {

        const { zoneId, rulesetId, auth, rule } = ruleToUpdate;

        const client = new CloudflareAPI({ token: auth.token, zoneId });

        return client.updateBlockRule(context, rulesetId, rule);
    });

    (await Promise.allSettled(updatePromises)).forEach(async (result, i) => {

        const item = rulesToUpdate[i];
        const dbItems = item?.ips?.map(i => i.id) || [];

        if (result.status === 'fulfilled') {
            dbItemsToDelete = dbItemsToDelete.concat(dbItems);
        } else {
            context.log('info', {
                step: '[Cloudflare WAF] Unable to delete IPs from rule.',
                data: sanitizeItems([item])
            });
        }
    });

    return dbItemsToDelete;
};

const deleteDBItems = async function(context, ids = []) {

    if (ids.length) {
        await context.db.collection(getModel(context).collection)
            .deleteMany({ id: { $in: ids } });
    }
};

const getExpiredItems = async function(context) {

    const expired = await context.db.collection(getModel(context).collection)
        .find({ removeAfter: { $lt: Date.now() } })
        .toArray();

    if (expired.length === 0) return [];

    const groupedByRules = expired.reduce((res, item) => {
        const key = item.ruleId;
        res[key] = res[key] || { ips: [] };
        res[key].ips.push({ ip: item.ip, id: item.id });
        res[key].auth = item.auth;
        res[key].id = item.id;
        res[key].zoneId = item.zoneId;
        res[key].ruleId = item.ruleId;
        res[key].rulesetId = item.rulesetId;
        return res;
    }, {});

    return Object.values(groupedByRules);
};

function removeIpsFromRule(rule, ipsToRemove = []) {
    const data = extractIPs(rule.expression);
    const ips = [];
    data.forEach(ip => {
        if (!ipsToRemove.includes(ip)) {
            ips.push(ip);
        }
    });

    const expression = getBlockExpression(ips);

    return { ...rule, expression };
}

function extractIPs(expression) {

    // Regular expression to match IP addresses within the curly braces
    // const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
    // Extracting the section of the expression that contains the IPs

    const match = expression.match(/{([^}]+)}/);
    if (!match) {
        // If no match for IP address block found, return empty array
        return [];
    }

    const ipsBlock = match[1]; // This contains "192.0.2.0 192.0.2.2 192.0.2.3"
    return ipsBlock.split(' ');
}

function getBlockExpression(ips) {
    const ipv4 = ips.filter(ip => Address4.isValid(ip));
    const ipv6 = ips.filter(ip => Address6.isValid(ip));
    const formattedIpv6 = ipv6.length > 0 ? ipv6.map(ip => removeInterfaceIdentifierAndAddCidr(ip)) : ipv6;
    const allIps = [...ipv4, ...formattedIpv6].sort();

    return `(ip.src in {${allIps.join(' ')}})`;
}

function removeInterfaceIdentifierAndAddCidr(ip) {
    const networkPrefix = ip
        .split(':')
        .slice(0, 4)
        .join(':');
    return `${networkPrefix}::/64`;
}

function initializeBlockRule(context, index, ips) {

    const { generatedRuleRefPrefix, generatedRuleNamePrefix } = config(context);

    return {
        action: 'block',
        description: `${generatedRuleNamePrefix}#${index}`,
        enabled: true,
        expression: getBlockExpression(ips),
        ref: `${generatedRuleRefPrefix}#${index}`
    };
}

/**
 * remove sensitive info from objects
 * @param items
 * @returns {Omit<*, 'auth'>[]}
 */
function sanitizeItems(items = []) {

    return items.map(item => {
        // eslint-disable-next-line no-unused-vars
        const { auth, ...info } = item;
        return info;
    });
}

const RULE_MAX_CAPACITY = 4096;

const parseIPs = (input) => {

    let ips = [];

    if (typeof input === 'string') {
        // Check if the string is a JSON array
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) {
                ips = parsed;
            } else {
                ips = input.split(/\s+|,/)
                    .filter(item => item)
                    .map(ip => ip.trim());
            }
        } catch (e) {
            ips = input.split(/\s+|,/)
                .filter(item => item)
                .map(ip => ip.trim());
        }
    } else if (Array.isArray(input)) {
        ips = input;
    }

    return ips;
};

function getIpsFromRules(rules) {

    const ips = {};
    rules.forEach(rule => {

        const data = extractIPs(rule.expression);
        data.forEach(ip => {
            ips[ip] = { id: rule.id };
        });
    });

    return ips;
}

function findIpsInRules(rules, refIps = []) {

    const ips = {};
    rules.forEach(rule => {

        const ipsFromRule = extractIPs(rule.expression);
        ipsFromRule.forEach(ip => {
            if (refIps.includes(ip)) {
                ips[ip] = { id: rule.id };
            }
        });
    });

    return ips;
}

function prepareRulesForCreateOrUpdate(context, ips, rules, ruleCapacity) {
    const ipsList = assignIpsToRules(ips, rules, ruleCapacity);

    const ipsGroupedByRules = Object.keys(ipsList).reduce((acc, ip) => {
        const ruleId = ipsList[ip].id;
        if (!acc[ruleId]) acc[ruleId] = [];
        acc[ruleId].push(ip);
        return acc;
    }, {});

    const res = [];
    const groups = Object.entries(ipsGroupedByRules);
    groups.forEach(entry => {
        const ruleId = entry[0];
        const existingRule = rules.find(rule => rule.id === ruleId);
        const expression = getBlockExpression(entry[1]);

        if (existingRule) {
            if (existingRule.expression !== expression) {
                res.push({ ...existingRule, expression });
            }
        } else {
            res.push(initializeBlockRule(context, groups.length, entry[1]));
        }
    });
    return res;
}

function assignIpsToRules(ips, rules, ruleCapacity) {
    const ipsList = getIpsFromRules(rules);
    const rulesMetadata = rules.map(rule => {
        return {
            id: rule.id,
            usedCapacity: rule.expression.length
        };
    });

    ips.forEach(ip => {

        const availableRule = getAvailableRule(rulesMetadata, ip.length + 1, ruleCapacity);

        if (availableRule) {
            availableRule.usedCapacity += ip.length + 1;
            ipsList[ip] = { id: availableRule.id };
        } else {
            ipsList[ip] = { id: 'NULL', expression: '' };
        }
    });

    return ipsList;
}

function getAvailableRule(rules, requiredCapacity, ruleCapacity = RULE_MAX_CAPACITY) {

    return rules.find(rule => rule.usedCapacity + requiredCapacity < ruleCapacity);
}

module.exports = {
    prepareRulesForCreateOrUpdate,
    findIpsInRules,
    parseIPs,
    deleteExpireIps,
    extractIPs,
    removeIpsFromRule,
    initializeBlockRule,
    getIpsFromRules
};
