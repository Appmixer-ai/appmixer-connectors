'use strict';

module.exports = {
    async receive(context) {
        const {
            id, description, name, highlight, parentTagId, isVisibleInConversationLists
        } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Tag ID is required.');
        }

        const requestData = {};

        if (name) requestData.name = name;
        if (description) requestData.description = description;
        if (highlight) requestData.highlight = highlight;
        if (parentTagId) requestData.parent_tag_id = parentTagId;
        if (typeof isVisibleInConversationLists === 'boolean') requestData.is_visible_in_conversation_lists = isVisibleInConversationLists;

        // https://dev.frontapp.com/reference/update-a-tag
        await context.httpRequest({
            method: 'PATCH',
            url: `https://api2.frontapp.com/tags/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson({}, 'out');
    }
};
