'use strict';

module.exports = {

    usersToSelectArray(users) {

        if (!Array.isArray(users)) {
            return [];
        }

        return users.map(user => ({
            label: user.display_name || user.email || `User ${user.id}`,
            value: user.id
        }));
    },

    async receive(context) {

        // https://developers.freshsales.io/api/#list_all_users
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://${context.auth.domain}/api/selector/owners`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const users = data.users || [];

        return context.sendJson(users, 'out');
    }
};
