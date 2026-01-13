'use strict';

module.exports = context => {

    const EachItemsModel = require('./EachItems')(context);

    // POST - Store delayed items for later processing
    context.http.router.register({
        method: 'POST',
        path: '/{id}',
        options: {
            handler: async req => {
                if (!req.params?.id) {
                    throw new Error('[utils.controls.each] id is not defined.');
                }
                const id = decodeURIComponent(req.params.id);
                const { items, delay, correlationId, count } = req.payload;

                const eachItems = new EachItemsModel(id).populate({
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
                if (!req.params?.id) {
                    throw new Error('[utils.controls.each] id is not defined.');
                }
                // Decode URI component and replace colons (MongoDB doesn't allow colons in _id)
                const id = decodeURIComponent(req.params.id);

                const eachItems = await EachItemsModel.findById(id);

                if (!eachItems) {
                    return null;
                }

                return eachItems;
            }
        }
    });

    // DELETE - Remove delayed items when fully consumed
    context.http.router.register({
        method: 'DELETE',
        path: '/{id}',
        options: {
            handler: async req => {
                if (!req.params?.id) {
                    throw new Error('[utils.controls.each] id is not defined.');
                }
                // Decode URI component and replace colons (MongoDB doesn't allow colons in _id)
                const id = decodeURIComponent(req.params.id);

                const eachItems = await EachItemsModel.deleteById(id);
                if (!eachItems) {
                    return { success: false, error: 'Not found' };
                }

                return { success: true, id };
            }
        }
    });
};
