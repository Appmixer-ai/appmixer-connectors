'use strict';

module.exports = (context, options) => {

    const RulesIPsModel = require('./RulesIPsModel')(context);

    context.http.router.register({
        method: 'POST', path: '/block-ip-rules', options: {
            handler: async req => {

                const items = req.payload.items;
                const operations = items.map(item => ({
                    updateOne: {
                        filter: { ip: item.ip, zoneId: item.zoneId }, update: { $set: item }, upsert: true
                    }
                }));
                return await (context.db.collection(RulesIPsModel.collection)).bulkWrite(operations);
            }
        }
    });

    context.http.router.register({
        method: 'GET', path: '/block-ip-rules', options: {
            handler: async req => {
                return RulesIPsModel.find({});
            }
        }
    });

    context.http.router.register({
        method: 'POST',
        // path: '/test',
        path: '/test/{flowId}/{componentId}',
        options: {
            // auth: false, // public,  when auth is false otherwise it requires Appmixer access token
            payload: {
                // allow: ['application/json'], // allowed content types, allow any if not provided
            },
            handler: async req => {
                const flowId = req.params.flowId;
                const componentId = req.params.componentId;

                return await context.triggerComponent(
                    flowId,
                    componentId,
                    req.payload,
                    {
                        enqueueOnly: 'true' // 'true' => do not wait fot the response
                    });
            }
        }
    });
};
