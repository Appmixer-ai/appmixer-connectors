'use strict';

const { FacebookClient } = require('../../lib');

module.exports = {

    async receive(context) {

        const client = new FacebookClient(context);
        const pages = await client.fetchAll('/me/accounts', { fields: 'id,name,access_token' });
        return context.sendJson(pages, 'pages');
    },

    toSelectArray(pages) {

        if (!Array.isArray(pages)) return [];

        return pages.map(page => ({
            label: page.name,
            value: page.id
        }));
    }
};
