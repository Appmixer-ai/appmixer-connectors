const { generateInspector, DEFAULT_ENTITIES } = require('../dynamics-commons');

module.exports = {

    async receive(context) {

        // Source for the Object Name typeahead - just the curated default entities, no API call.
        if (context.properties.listDefaultEntities) {
            return context.sendJson(DEFAULT_ENTITIES, 'out');
        }

        if (context.properties.generateInspector) {
            const inPort = await generateInspector(context, 'IsValidForDelete');
            return context.sendJson(inPort, 'out');
        }

        const { id, objectName } = context.messages.in.content;

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

        await context.log({ step: 'Making request', options });
        const { data, status, statusText } = await context.httpRequest(options);

        return context.sendJson({ objectName, data, id, status, statusText }, 'out');
    }
};
