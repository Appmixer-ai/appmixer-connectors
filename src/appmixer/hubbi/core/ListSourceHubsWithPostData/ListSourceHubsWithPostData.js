'use strict';

const lib = require('../../lib');

const SCHEMA = {
    key: { type: 'string', title: 'Hub Key', example: '3f2504e0-4f89-11d3-9a0c-0305e82c3301' },
    name: { type: 'string', title: 'Name', example: 'Orders to CRM' }
};

module.exports = {

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Hubs', value: 'result' });
        }

        const url = lib.apiUrl(
            context,
            `/Flows/Home/ListSourceHubsWithPostData?clientKey=${encodeURIComponent(context.auth.clientKey)}`
        );

        // Inspector dropdown calls are served from cache: the designer fires them
        // in a concurrent burst whenever an inspector opens, while a flow run needs
        // the live list.
        if (context.properties.isSource) {
            try {
                const { data } = await lib.callEndpointCached(context, url);
                return lib.sendArrayOutput({ context, outputType, records: data || [] });
            } catch (err) {
                // A dropdown must not turn an upstream failure into an error popup
                // in the designer - the inspector opens before an account is even
                // picked, and a burst of popups is worse than an empty list. Log it
                // and answer with no options.
                await context.log({ step: 'Hub list unavailable for the inspector', error: err.message });
                return lib.sendArrayOutput({ context, outputType, records: [] });
            }
        }

        const { data } = await lib.apiGet(context, url);

        return lib.sendArrayOutput({ context, outputType, records: data || [] });
    },

    toSelectArray(msg) {
        const items = msg.result || (Array.isArray(msg) ? msg : []);
        return items.map(hub => ({ label: hub.name, value: hub.key }));
    }
};
