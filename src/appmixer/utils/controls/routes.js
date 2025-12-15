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
                const { items, delay, correlationId, count, currentIndex } = req.payload;

                const eachItems = new EachItemsModel({
                    id,
                    items,
                    delay,
                    correlationId,
                    count,
                    currentIndex
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

    // PUT - Update delayed items (e.g., update currentIndex)
    context.http.router.register({
        method: 'PUT',
        path: '/{id}',
        options: {
            handler: async req => {
                const { id } = req.params;
                const { items, delay, correlationId, count, currentIndex } = req.payload;

                const eachItems = await EachItemsModel.findById(id);
                if (!eachItems) {
                    return { success: false, error: 'Not found' };
                }

                // Update fields
                if (items !== undefined) eachItems.items = items;
                if (delay !== undefined) eachItems.delay = delay;
                if (correlationId !== undefined) eachItems.correlationId = correlationId;
                if (count !== undefined) eachItems.count = count;
                if (currentIndex !== undefined) eachItems.currentIndex = currentIndex;

                await eachItems.save();
                return { success: true, id };
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
