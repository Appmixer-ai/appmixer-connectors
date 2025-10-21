'use strict';

module.exports = {
    async receive(context) {
        const { name, description, highlight, isVisibleInConversationLists } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Tag name is required.');
        }

        const requestData = { name };

        if (highlight) requestData.highlight = highlight;
        if (description) requestData.description = description;
        if (typeof isVisibleInConversationLists === 'boolean') requestData.is_visible_in_conversation_lists = isVisibleInConversationLists;

        // https://dev.frontapp.com/reference/create-tag
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api2.frontapp.com/tags',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
