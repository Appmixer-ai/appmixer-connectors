'use strict';

const lib = require('../../lib');

const DEFAULT_QUERY = [
    'SELECT',
    '  user_list.resource_name,',
    '  user_list.id,',
    '  user_list.name,',
    '  user_list.description,',
    '  user_list.membership_status,',
    '  user_list.size_for_display,',
    '  user_list.size_for_search,',
    '  user_list.type',
    'FROM user_list',
    'ORDER BY user_list.id DESC',
    'LIMIT 200'
].join(' ');

const USER_LIST_SCHEMA = {
    'resourceName': { 'type': 'string', 'title': 'Resource Name' },
    'id': { 'type': 'string', 'title': 'ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'description': { 'type': 'string', 'title': 'Description' },
    'membershipStatus': { 'type': 'string', 'title': 'Membership Status' },
    'sizeForDisplay': { 'type': 'integer', 'title': 'Size For Display' },
    'sizeForSearch': { 'type': 'integer', 'title': 'Size For Search' },
    'type': { 'type': 'string', 'title': 'Type' }
};

module.exports = {

    async receive(context) {

        const {
            customerId,
            searchQuery,
            outputType = 'array'
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, USER_LIST_SCHEMA, {
                label: 'User Lists',
                value: 'result'
            });
        }

        lib.ensureRequired(customerId, 'Customer ID is required!', context);
        lib.getGoogleAdsConfig(context);

        const rows = await lib.searchStream(context, {
            customerId,
            query: searchQuery || DEFAULT_QUERY
        });

        const userLists = rows
            .map(row => row.userList)
            .filter(Boolean);

        if (userLists.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: userLists });
    }
};
