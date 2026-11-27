'use strict';

const lib = require('../../lib');

// The output contract of one device. Exported because the output port is dynamic.
const ITEM_SCHEMA = require('../../schema-smartlock.json');

const fetchSmartlocks = async (context, type) => {

    const data = await lib.request(context, { path: '/smartlock', params: lib.clean({ type }) });
    if (!Array.isArray(data)) {
        throw new Error('Nuki returned an unexpected answer for the list of devices.');
    }
    return data;
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { type, name, outputType } = (context.messages.in && context.messages.in.content) || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Smartlocks' });
        }

        // Source call: this component backs the Smartlock dropdown of the other components. The
        // designer fires those calls in bursts, so the answer is cached, and an error shows an empty
        // dropdown (the ID can still be typed) instead of an error popup.
        if (context.properties.isSource) {
            try {
                const result = await lib.callCached(context, { source: 'smartlocks' }, async () => {
                    const smartlocks = await fetchSmartlocks(context);
                    return smartlocks.map(smartlock => ({ smartlockId: smartlock.smartlockId, name: smartlock.name }));
                });
                return context.sendJson({ result }, 'out');
            } catch (err) {
                return context.sendJson({ result: [] }, 'out');
            }
        }

        const deviceType = lib.optionalInteger(context, type, 'Device Type');
        let records = await fetchSmartlocks(context, deviceType);

        // The API filters by device type only. The name is matched here, which is complete because
        // the API returns every device of the account in one answer.
        const needle = typeof name === 'string' ? name.trim().toLowerCase() : '';
        if (needle) {
            records = records.filter(smartlock => String(smartlock.name || '').toLowerCase().includes(needle));
        }

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    },

    toSelectArray({ result }) {

        return (result || []).map(smartlock => ({
            label: smartlock.name ? `${smartlock.name} (${smartlock.smartlockId})` : String(smartlock.smartlockId),
            value: String(smartlock.smartlockId)
        }));
    }
};
