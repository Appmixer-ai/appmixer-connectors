
'use strict';
module.exports = {
    async receive(context) {

        const content = context.messages.in?.content || {};
        const name = content.name;
        let updateMask = content.updateMask;
        const spaceType = content['space|spaceType'] || content.spaceType;
        let config = content['space|config'] || content.config;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }
        if (!updateMask) {
            throw new context.CancelError('Update mask is required!');
        }
        if (typeof config === 'string') {
            try { config = JSON.parse(config); } catch (e) { /* ignore */ }
        }

        const token = (context.auth && (context.auth.accessToken || context.auth.apiToken)) || context.accessToken;
        if (!token) {
            throw new context.CancelError('Missing access token.');
        }

        const body = {};
        if (spaceType) body.spaceType = spaceType;
        if (config) body.config = config;

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/spaces/patch
        await context.httpRequest({
            method: 'PATCH',
            url: `https://meet.googleapis.com/v2/spaces/${encodeURIComponent(name)}`,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: { updateMask },
            data: body
        });

        // Update must return empty object per standards
        return context.sendJson({}, 'out');
    }
};
