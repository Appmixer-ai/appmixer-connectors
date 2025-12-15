'use strict';

module.exports = context => {

    const EachItemsModel = require('./EachItems')(context);

    // POST - Store delayed items for later processing
    context.http.router.register({
        method: 'POST',
        path: '/{id}',
        options: {
            handler: async req => {
                const { id } = req.params;
                const { items, delay, correlationId, count } = req.payload;

                const eachItems = new EachItemsModel({
                    id,
                    items,
                    delay,
                    correlationId,
                    count
                });

                await eachItems.save();
                return { success: true, id };
            }
        }
    });

    // GET - Fetch delayed items by id
    context.http.router.register({
        method: 'GET',
        path: '/{id}',
        options: {
            handler: async req => {
                const { id } = req.params;

                const eachItems = await EachItemsModel.findById(id);
                if (!eachItems) {
                    return null;
                }

                return eachItems.toObject();
            }
        }
    });

    // DELETE - Remove delayed items when fully consumed
    context.http.router.register({
        method: 'DELETE',
        path: '/{id}',
        options: {
            handler: async req => {
                const { id } = req.params;

                const eachItems = await EachItemsModel.findById(id);
                if (!eachItems) {
                    return { success: false, error: 'Not found' };
                }

                await eachItems.remove();
                return { success: true, id };
            }
        }
    });
};
