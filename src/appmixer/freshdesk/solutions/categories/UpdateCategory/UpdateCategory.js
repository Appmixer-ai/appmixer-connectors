'use strict';

const axios = require('axios');

module.exports = {

    async receive(context) {

        const { auth } = context;
        const { categoryId, name, description } = context.messages.in.content;

        const body = {};
        if (name) body.name = name;
        if (description) body.description = description;

        const { data } = await axios.put(
            `https://${auth.domain}.freshdesk.com/api/v2/solutions/categories/${categoryId}`,
            body,
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
