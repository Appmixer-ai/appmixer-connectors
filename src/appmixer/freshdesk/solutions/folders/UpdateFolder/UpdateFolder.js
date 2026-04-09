'use strict';

const axios = require('axios');

module.exports = {

    async receive(context) {

        const { auth } = context;
        const { folderId, name, description, visibility } = context.messages.in.content;

        const body = {};
        if (name) body.name = name;
        if (description !== undefined) body.description = description;
        if (visibility !== undefined) body.visibility = visibility;

        const { data } = await axios.put(
            `https://${auth.domain}.freshdesk.com/api/v2/solutions/folders/${folderId}`,
            body,
            { auth: { username: auth.apiKey, password: 'X' } }
        );

        return context.sendJson({
            id: data.id,
            name: data.name,
            description: data.description,
            categoryId: data.category_id,
            visibility: data.visibility,
            companyIds: data.company_ids,
            position: data.position,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        }, 'folder');
    }
};
