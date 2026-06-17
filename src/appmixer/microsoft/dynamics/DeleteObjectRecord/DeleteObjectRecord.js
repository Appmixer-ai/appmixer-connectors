const {  DEFAULT_ENTITIES } = require('../dynamics-commons');

module.exports = {

    async receive(context) {

        // Source for the Object Name typeahead - just the curated default entities, no API call.
        if (context.properties.listDefaultEntities) {
            return context.sendJson(DEFAULT_ENTITIES, 'out');
        }

        const { id, objectName } = context.messages.in.content;

        if (!objectName) {
            throw new context.CancelError('Object Name is required!');
        }
        if (!id) {
            throw new context.CancelError('ID is required!');
        }

        const options = {
            // TODO: Make the url construction more robust.
            url: `${context.resource || context.auth.resource}/api/data/v9.2/${objectName}s(${id})`,
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${context.auth?.accessToken || context.accessToken}`,
                accept: 'application/json',
                'content-type': 'application/json'
            }
        };

        // Delete returns an empty object on success (consistent with the other Delete
        // components and the platform convention). A failed request throws.
        await context.httpRequest(options);

        return context.sendJson({}, 'out');
    }
};
