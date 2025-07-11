'use strict';

const lib = require('../../lib.generated');

module.exports = {
    async receive(context) {

        const { ips, ttl } = context.messages.in.content;

        const ipsList = lib.parseIPs(ips);

        const expiration = ttl && ttl > 0 ? new Date(Date.now() + ttl * 1000).valueOf() : null;

        const keyName = context?.config.kvmBlockedIPsKeyName || 'blocked-ips';

        const entry = await getOrCreateList(context, keyName);

        const parsedList = removeExpiredIPs(entryToList(entry));

        ipsList.forEach(ip => {
            parsedList[ip] = {
                ip,
                expiration
            };
        });

        await setList(context, keyName, listToEntry(parsedList));
        return context.sendJson({}, 'out');
    }
};

const setList = (context, name, value) => {

    const mapName = getKVMName(context);

    const { org, env } = context.properties;
    // https://cloud.google.com/apigee/docs/reference/apis/apigee/rest/v1/organizations.environments.keyvaluemaps.entries/create
    return context.httpRequest({
        method: 'PUT',
        url: `https://apigee.googleapis.com/v1/organizations/${org}/environments/${env}/keyvaluemaps/${mapName}/entries/${name}`,
        headers: {
            'Authorization': `Bearer ${context.auth.accessToken}`
        },
        data: { name, value }
    });
};

const getOrCreateList = async (context, name) => {

    const mapName = getKVMName(context);
    const { org, env } = context.properties;
    // https://cloud.google.com/apigee/docs/reference/apis/apigee/rest/v1/organizations.environments.keyvaluemaps.entries/get
    try {
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://apigee.googleapis.com/v1/organizations/${org}/environments/${env}/keyvaluemaps/${mapName}/entries/${name}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });
        return data.value || '';
    } catch (error) {

        if (error?.response?.status === 404) {
            await createEntry(context, name);
            return '';
        }

        context.log({ step: 'Error getting entry', error: error?.response?.data, message: error?.message });
        throw error;
    }
};

const createEntry = async (context, name, value = '', attempt = 0) => {

    const mapName = getKVMName(context);
    const { org, env } = context.properties;

    context.log({ step: 'creating-entry', name });
    try {
        // https://cloud.google.com/apigee/docs/reference/apis/apigee/rest/v1/organizations.environments.keyvaluemaps.entries/create
        await context.httpRequest({
            method: 'POST',
            url: `https://apigee.googleapis.com/v1/organizations/${org}/environments/${env}/keyvaluemaps/${mapName}/entries`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: { name, value }
        });

    } catch (error) {

        if (error?.response?.status === 404 && attempt < 1) {
            try {
                await createKVM(context);
            } catch (e) {
                if (e?.response?.status === 409) { // conflict, KVM already exists
                    context.log({ step: 'KVM exists', error: e?.response?.data, message: e?.message });
                } else {
                    throw error;
                }
            }

            return await createEntry(context, name, value, attempt + 1);
        }

        context.log({ step: 'Error creating entry', error: error?.response?.data, message: error?.message });
        throw error;
    }
};

const getKVMName = (context) => {
    return context.config?.kvmBlockedIPsName || 'apigee-blocked-ips';
};

const createKVM = (context) => {

    const name = getKVMName(context);

    const { org, env } = context.properties;

    // https://cloud.google.com/apigee/docs/reference/apis/apigee/rest/v1/organizations.environments.keyvaluemaps.entries/create
    return context.httpRequest({
        method: 'POST',
        url: `https://apigee.googleapis.com/v1/organizations/${org}/environments/${env}/keyvaluemaps`,
        headers: {
            'Authorization': `Bearer ${context.auth.accessToken}`
        },
        data: { name }
    });

};

const removeExpiredIPs = (list) => {
    const currentTimestamp = new Date().valueOf();
    return Object.keys(list).reduce((res, ip) => {

        const value = list[ip];
        const expired = value.expiration && value.expiration < currentTimestamp;
        if (!expired) {
            res[ip] = value;
        }
        return res;
    }, {});
};

const entryToList = (entry) => {

    if (!entry) {
        return {};
    }
    return entry.split('|').reduce((res, item) => {
        const [ip, expiration] = item.split(';');

        if (ip) {

            res[ip] = {
                ip,
                expiration: expiration ? parseInt(expiration, 10) : null
            };
        }
        return res;
    }, {});
};

const listToEntry = (list) => {

    return Object.values(list).map(item => {
        return `${item.ip};${item.expiration || ''}`;
    }).join('|');
};
