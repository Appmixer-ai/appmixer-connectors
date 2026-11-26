'use strict';

const lib = require('../lib');

// The output contract of one guest profile. Exported because the output port is dynamic.
const ITEM_SCHEMA = require('../schema-guest-profile.json');

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
            emailAddress, modifiedFrom, modifiedTo, accountId, outputType
        } = (context.messages.in && context.messages.in.content) || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Guest Profiles' });
        }

        // One request: GET /api/v2/rich-guest-profiles, the first page.
        const { data } = await lib.fetchPage(context, {
            path: '/api/v2/rich-guest-profiles',
            accountId,
            params: {
                emailAddress: lib.isEmpty(emailAddress) ? undefined : String(emailAddress).trim(),
                ...lib.modifiedRange(context, modifiedFrom, modifiedTo)
            },
            label: 'the list of guest profiles'
        });
        const records = lib.profilesOf(data);

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
