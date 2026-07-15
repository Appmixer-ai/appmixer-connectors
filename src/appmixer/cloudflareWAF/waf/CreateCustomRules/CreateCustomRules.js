const CloudflareAPI = require('../../CloudflareAPI');
const lib = require('../../lib');
const crypto = require('crypto');

const getLockConfiguration = (context) => {

    return {
        retryDelay: parseInt(context.config.uploadLockRetryDelay, 10) || 5000,
        ttl: parseInt(context.config.uploadLockTtl, 10) || 15 * 60 * 1000,
        maxRetryCount: parseInt(context.config.uploadLockMaxRetryCount, 10) || 60
    };
};

module.exports = {
    async receive(context) {

        const { apiToken } = context.auth;
        const { zoneId } = context.properties;
        const { ips, ttl } = context.messages.in.content;
        if (!ips) {
            throw new context.CancelError('IP address is required');
        }

        // TTL is optional. A positive TTL means a timed block that needs scheduled cleanup.
        // A missing/blank TTL or TTL=0 means a permanent block (no automatic removal).
        const hasTtl = ttl !== undefined && ttl !== null && ttl !== '' && Number(ttl) > 0;

        if (ips.length === 0) {
            return context.sendJson([], 'out');
        }

        const parsedIps = lib.parseIPs(ips);
        const client = new CloudflareAPI({ zoneId, token: apiToken });

        let lock;
        try {

            // https://docs.appmixer.com/6.0/v4.1/component-definition/behaviour#async-context.lock-lockname-options
            lock = await context.lock(context.componentId, getLockConfiguration(context));

            let ruleset = (await client.listZoneRulesets(context))
                .find(ruleset => ruleset.kind === 'zone' && ruleset.phase === 'http_request_firewall_custom');

            let resultRules = []; // all affected rules - created or updated
            if (!ruleset) {
                const data = await client.createRulesetAndBlockRule(
                    context,
                    [lib.initializeBlockRule(context, 1, parsedIps)]
                );
                ruleset = data?.result;
                resultRules = data?.result?.rules || [];
            } else {
                const { result: { rules = [] } } = await client.getRules(context, ruleset.id);
                resultRules = rules;

                const rulesToUpdate = lib.prepareRulesForCreateOrUpdate(context, parsedIps, rules);

                const promises = rulesToUpdate.map(rule => {
                    return rule.id ?
                        client.updateBlockRule(context, ruleset.id, rule) :
                        client.createBlockRule(context, { rulesetId: ruleset.id, rule });
                });

                (await Promise.allSettled(promises)).forEach(result => {
                    const updatedOrCreatedRules = result?.value?.result?.rules || [];
                    updatedOrCreatedRules.forEach(rule => {
                        const index = resultRules.findIndex(r => r.id === rule.id);
                        if (index !== -1) {
                            resultRules[index] = rule;
                        } else {
                            resultRules.push(rule);
                        }
                    });
                });
            }

            const updatedIps = lib.findIpsInRules(resultRules, parsedIps);
            const updatedIpsArray = Object.entries(updatedIps).map(([ip, { id }]) => ({ ip, ruleId: id }));

            // Only persist rules for scheduled cleanup when a positive TTL was provided.
            // Permanent blocks (no TTL or TTL=0) are not tracked in the DB.
            if (updatedIpsArray.length && hasTtl) {

                const removeAfter = new Date().getTime() + Number(ttl) * 1000;
                const dbItems = updatedIpsArray.map(item => {
                    const { ip, ruleId } = item;
                    return {
                        id: crypto.randomUUID(),
                        ip,
                        ruleId,
                        rulesetId: ruleset.id,
                        zoneId,
                        removeAfter,
                        auth: {
                            token: apiToken
                        }
                    };
                });

                await context.callAppmixer({
                    endPoint: '/plugins/appmixer/cloudflareWAF/block-ip-rules',
                    method: 'POST',
                    body: { items: dbItems }
                });
            }

            return context.sendJson(updatedIpsArray, 'out');
        } finally {
            if (lock) {
                await lock.unlock();
            }
        }

    }
};
