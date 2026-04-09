'use strict';

const axios = require('axios');

module.exports = {

    async receive(context) {

        const { auth } = context;
        const { categoryId } = context.messages.in.content;

        const { data } = await axios.get(
            `https://${auth.domain}.freshdesk.com/api/v2/solutions/categories/${categoryId}`,
            { auth: { username: auth.apiKey, password: 'X' } }
        );

        return context.sendJson({
            id: data.id,
            name: data.name,
            description: data.description,
            position: data.position,
            portalId: data.portal_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        }, 'category');
    }
};
