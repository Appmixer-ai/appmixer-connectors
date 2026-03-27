'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            customerId,
            userListId
        } = context.messages.in.content;

        lib.ensureRequired(customerId, 'Customer ID is required!', context);
        lib.ensureRequired(userListId, 'User List ID is required!', context);
        lib.getGoogleAdsConfig(context);

        const query = [
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
            `WHERE user_list.id = ${String(userListId).replace(/[^0-9]/g, '')}`,
            'LIMIT 1'
        ].join(' ');

        const rows = await lib.searchStream(context, {
            customerId,
            query
        });

        const userList = rows[0]?.userList;

        if (!userList) {
            throw new context.CancelError('User list not found!');
        }

        return context.sendJson(userList, 'out');
    }
};
