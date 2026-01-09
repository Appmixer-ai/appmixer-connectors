'use strict';

module.exports = {

    async receive(context) {

        const { spaceId, folderId } = context.messages.in.content;

        if (!spaceId) {
            throw new context.CancelError('Space ID is required');
        }

        let url;
        if (folderId) {
            url = `https://api.clickup.com/api/v2/folder/${folderId}/list`;
        } else {
            url = `https://api.clickup.com/api/v2/space/${spaceId}/list`;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson({ lists: data.lists }, 'out');
    },
    toSelectArray(out) {

        return (out.lists || []).map(list => {
            return {
                label: list.name,
                value: list.id
            };
        });
    }
};
