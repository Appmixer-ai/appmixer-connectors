'use strict';

module.exports = {

    async receive(context) {

        const { spaceId, archived = false } = context.messages.in.content;

        if (!spaceId) {
            // When used as dynamic source, return empty response instead of error
            if (context.properties.variableFetch) {
                return context.sendJson({ folders: [] }, 'out');
            }
            throw new context.CancelError('Space Id is required!');
        }

        try {
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
        } catch (err) {
            // When used as dynamic source, return empty response instead of error
            if (context.properties.variableFetch) {
                return context.sendJson({ folders: [] }, 'out');
            }
            throw err;
        }
    },

    toSelectArray(out) {

        return (out.folders || []).map(folder => {
            return {
                label: folder.name,
                value: folder.id
            };
        });
    }
};
