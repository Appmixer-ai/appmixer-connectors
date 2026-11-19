'use strict';

const crypto = require('crypto');
const lib = require('../lib');

module.exports = {

    receive: async function(context) {

        try {
            const models = context.properties.isSource
                ? await this.listModelsCached(context)
                : await this.listModels(context);
            return context.sendJson({ models }, 'out');
        } catch (err) {
            // The Deployment field stays a free-text field: an endpoint that does not list
            // models must not block typing the deployment name.
            if (context.properties.isSource) {
                return context.sendJson({ models: [] }, 'out');
            }
            throw err;
        }
    },

    listModels: async function(context) {

        const { data } = await lib.request(context, 'get', '/models');
        return data.data || [];
    },

    listModelsCached: async function(context) {

        const key = 'foundry-models-' + crypto.createHash('sha256')
            .update(JSON.stringify({ endpoint: lib.endpointOrigin(context), apiKey: lib.apiKey(context) }))
            .digest('hex');
        let lock;
        try {
            lock = await context.lock(key);
            const cached = await context.staticCache.get(key);
            if (cached) {
                return cached;
            }
            const models = await this.listModels(context);
            await context.staticCache.set(key, models, context.config.listCacheTTL || (2 * 60 * 1000));
            return models;
        } finally {
            await lock?.unlock();
        }
    },

    toSelectOptions(out) {
        return out.models.map(model => {
            return { label: model.id, value: model.id };
        });
    }
};
