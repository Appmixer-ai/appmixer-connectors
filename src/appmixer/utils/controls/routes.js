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
                const {
                    items, delay, correlationId, count,
                    sequential, itemTimeout, flowId, componentId, webhookQuery
                } = req.payload;

                const eachItems = new EachItemsModel(id).populate({
                    items,
                    delay,
                    correlationId,
                    count,
                    sequential,
                    itemTimeout,
                    flowId,
                    componentId,
                    webhookQuery
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

                // A sequential Each reads one item per acknowledgement. Returning the whole list
                // every time would make the loop quadratic in the list size, so `?index=N` returns
                // just that item (plus the loop metadata) instead of `items`.
                if (req.query?.index !== undefined) {
                    const index = parseInt(req.query.index, 10);
                    const { items, ...meta } = eachItems.toJson();
                    return { ...meta, item: (items || [])[index] };
                }

                return eachItems;
            }
        }
    });

    // POST - Acknowledge an item of a sequential Each (sent by the ContinueEach component), which
    // wakes the Each component up to emit the next item.
    context.http.router.register({
        method: 'POST',
        path: '/{id}/next',
        options: {
            handler: async req => {
                if (!req.params?.id) {
                    throw new Error('[utils.controls.each] id is not defined.');
                }
                const id = decodeURIComponent(req.params.id);
                const index = parseInt(req.payload?.index, 10);
                if (!Number.isInteger(index) || index < 0) {
                    throw new Error('[utils.controls.each] index must be a non-negative integer.');
                }

                const eachItems = await EachItemsModel.findById(id);
                const record = eachItems ? eachItems.toJson() : null;
                if (!record || !record.sequential) {
                    // Not a sequential loop, or the loop already finished (or timed out past this
                    // item) and its record is gone. Nothing to wake up - not an error. Deliberately no
                    // `error` key: context.callAppmixer treats any JSON body with one as a failure
                    // and throws, which would fail ContinueEach instead of letting the flow go on.
                    return { success: false, reason: 'not-found' };
                }

                // `webhookQuery` holds the correlationId/correlationInPort/messageId of the message
                // that started the loop. The engine needs all three to restore that message's scope,
                // so the next item continues the original branch (upstream variables stay resolvable).
                await context.triggerComponent(
                    record.flowId,
                    record.componentId,
                    { id, index },
                    { ...(record.webhookQuery || {}), enqueueOnly: 'true' }
                );

                return { success: true, id, index };
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
