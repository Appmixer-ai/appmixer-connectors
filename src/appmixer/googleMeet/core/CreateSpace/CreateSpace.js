
'use strict';
module.exports = {
    async receive(context) {

        const content = context.messages.in?.content || {};

        // Inputs can come flattened as "space|spaceType" and "space|config" from inspector.
        const spaceType = content['space|spaceType'] || content.spaceType;
        let config = content['space|config'] || content.config;

        if (typeof config === 'string') {
            try { config = JSON.parse(config); } catch (e) { /* keep as string if not JSON */ }
        }

        const token = (context.auth && (context.auth.accessToken || context.auth.apiToken)) || context.accessToken;
        if (!token) {
            throw new context.CancelError('Missing access token.');
        }

        // Build request body per API spec: https://developers.google.com/workspace/meet/api/reference/rest/v2/spaces/create
        const body = {};
        if (spaceType) body.spaceType = spaceType;
        if (config) body.config = config;

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://meet.googleapis.com/v2/spaces',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            data: body
        });

        return context.sendJson(data, 'out');
    }
};
