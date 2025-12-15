'use strict';

module.exports = (context, options) => {

    const RulesIPsModel = require('./EachItems')(context);

    context.http.router.register({
        method: 'POST',
        path: '/store-delayed-each-items',
        options: {
            handler: async req => {

                const {items, id} = req.payload.items;
                return await (context.db.collection(RulesIPsModel.collection)).bulkWrite(operations);
            }
        }
    });

    context.http.router.register({
        method: 'GET',
        path: '/delayed-each-items/{id}',
        options: {
            handler: async req => {

                // get delayed itesm by id
                return await (context.db.collection(RulesIPsModel.collection)).bulkWrite(operations);
            }
        }
    });

    context.http.router.register({
        method: 'DELETE',
        path: '/delayed-each-items/{id}',
        options: {
            handler: async req => {

                // delete list when the is consumed
                return await (context.db.collection(RulesIPsModel.collection)).bulkWrite(operations);
            }
        }
    });

    context.http.router.register({
        method: 'GET',
        path: '/test',
        options: {
            handler: async req => {
                return { XXX: 1 }
            }
        }
    });
};
