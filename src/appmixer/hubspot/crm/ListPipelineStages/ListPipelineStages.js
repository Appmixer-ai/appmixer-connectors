'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {

    async receive(context) {

        const {
            pipelineId, isSource, objectType = 'deals'
        } = context.messages.in.content;

        if (isSource && !pipelineId) {
            // Return empty array as the API call would fail.
            return context.sendJson({ stages: [] }, 'out');
        }

        const { auth } = context;
        const hs = new Hubspot(auth.accessToken, context.config, context.httpRequest);

        try {
            const { data } = await hs.call('get', `crm/v3/pipelines/${encodeURIComponent(objectType || 'deals')}/${encodeURIComponent(pipelineId)}/stages`);

            return context.sendJson({ stages: data.results }, 'out');
        } catch (err) {
            if (isSource) {
                return context.sendJson({ stages: [] }, 'out');
            }
            throw err;
        }
    },

    toSelectArray({ stages }) {

        return stages.map(s => ({ label: s.label, value: s.id }));
    }
};
