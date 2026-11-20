'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const isSource = context.properties.isSource === true;
        const request = { path: '/order_states', params: { display: '[id,name]', sort: '[id_ASC]' } };

        try {
            const data = isSource
                ? await lib.psRequestCached(context, request)
                : await lib.psRequest(context, request);

            const result = (data.order_states || []).map(state => ({
                id: String(state.id),
                name: lib.firstValue(state.name)
            }));

            return context.sendJson({ result }, 'out');
        } catch (err) {
            if (isSource) {
                // A failing dropdown must not block the inspector; the ID can still be typed in.
                return context.sendJson({ result: [] }, 'out');
            }
            throw err;
        }
    },

    toSelectArray({ result }) {

        return (result || []).map(state => ({
            label: state.name ? `${state.name} (${state.id})` : state.id,
            value: state.id
        }));
    }
};
