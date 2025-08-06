'use strict';

const lib = require('../../lib');

// Schema for a single audience item
const schema = {
    id: { type: 'string', title: 'ID' },
    name: { type: 'string', title: 'Name' },
    created_at: { type: 'string', title: 'Created At' }
};

module.exports = {

    async receive(context) {

        const { outputType = 'array', isSource } = context.messages.in.content || {};

        // Generate output port options dynamically if requested
        if (context.properties && context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(
                context,
                outputType,
                schema,
                { label: 'Audiences', value: 'result' }
            );
        }

        const cacheKey = 'resend_audiences_' + context.auth.apiKey;
        let lock;

        try {
            lock = await context.lock(context.auth.apiKey);

            // Check cache only if this is a call from another component (source)
            if (isSource) {
                const audiencesCached = await context.staticCache.get(cacheKey);
                if (audiencesCached) {
                    return context.sendJson({ result: audiencesCached }, 'out');
                }
            }

            // Make the API request
            const { data } = await context.httpRequest({
                method: 'GET',
                url: 'https://api.resend.com/audiences',
                headers: {
                    'Authorization': `Bearer ${context.auth.apiKey}`
                }
            });

            const items = Array.isArray(data?.data) ? data.data : [];

            // Cache the audiences for 60 seconds unless specified otherwise in the config
            // Note that we only need name and id for selectors, so we can save space in the cache
            // Caching only if this is a call from another component
            if (isSource) {
                await context.staticCache.set(
                    cacheKey,
                    items.map(item => ({ id: item.id, name: item.name })),
                    context.config.listAudiencesCacheTTL || (60 * 1000)
                );

                // Return values into another component
                return context.sendJson({ result: items }, 'out');
            }

            // No searching supported yet, so we return all items
            // if (items.length === 0) {
            //     return context.sendJson({}, 'notFound');
            // }

            // Return values to the flow
            return lib.sendArrayOutput({
                context,
                records: items,
                outputType
            });

        } finally {
            lock?.unlock();
        }
    },

    toSelectArray(data) {

        // Handle both array response and paginated response with data property
        const audiences = Array.isArray(data) ? data : (data.result || data.data || []);

        return audiences.map(audience => ({
            label: audience.name,
            value: audience.id
        }));
    }

};
