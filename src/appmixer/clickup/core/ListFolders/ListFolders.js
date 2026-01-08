'use strict';

module.exports = {

    async receive(context) {

        const { spaceId, archived = false } = context.messages.in.content;

        if (!spaceId) {
            throw new context.CancelError('Space Id is required!');
        }

        let url = `https://api.clickup.com/api/v2/space/${spaceId}/folder`;
        const params = {};

        if (archived !== undefined && archived !== null) {
            params.archived = archived;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params
        });

        const folders = data.folders || [];

        return context.sendJson({ folders }, 'out');
    },

    toSelectArray(out) {

        return (out.folders || []).map(space => {
            return {
                label: space.name,
                value: space.id
            };
        });
    }
};
