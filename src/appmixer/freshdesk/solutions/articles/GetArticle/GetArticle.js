'use strict';

const axios = require('axios');

module.exports = {

    async receive(context) {

        const { auth } = context;
        const { articleId } = context.messages.in.content;

        const { data } = await axios.get(
            `https://${auth.domain}.freshdesk.com/api/v2/solutions/articles/${articleId}`,
            { auth: { username: auth.apiKey, password: 'X' } }
        );

        return context.sendJson({
            id: data.id,
            title: data.title,
            description: data.description,
            articleType: data.article_type,
            folderId: data.folder_id,
            categoryId: data.category_id,
            status: data.status,
            agentId: data.agent_id,
            tags: data.tags,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        }, 'article');
    }
};
