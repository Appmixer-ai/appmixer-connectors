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

module.exports = {

    async receive(context) {

        const {
            customerId,
            developerToken,
            loginCustomerId,
            searchQuery
        } = context.messages.in.content;

        lib.ensureRequired(customerId, 'Customer ID is required!', context);
        lib.ensureRequired(developerToken, 'Developer Token is required!', context);

        const rows = await lib.searchStream(context, {
            customerId,
            developerToken,
            loginCustomerId,
            query: searchQuery || DEFAULT_QUERY
        });

        const userLists = rows
            .map(row => row.userList)
            .filter(Boolean);

        if (userLists.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return context.sendJson({
            result: userLists,
            count: userLists.length
        }, 'out');
    }
};
