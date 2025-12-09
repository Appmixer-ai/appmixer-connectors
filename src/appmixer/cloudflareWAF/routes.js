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
        path: '/test',
        options: {
            auth: false, // public when auth is false otherwise it requires Appmixer access token
            payload: {
                // allow: ['application/json'], // allowed content types, allow any if not provided
            },
            handler: async req => {

                await context.triggerListeners({
                    eventName: 'message',
                    payload: req.payload,
                    filter: listener => {
                        // custom filtering logic here
                        return true;
                    }
                });
                return {};
            }
        }
    });
};
