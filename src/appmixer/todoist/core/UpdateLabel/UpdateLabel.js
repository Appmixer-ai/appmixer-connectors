'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { labelId, name, order, color, isFavorite } = context.messages.in.content;

        if (!labelId) {
            throw new context.CancelError('Label ID is required.');
        }

        const body = {};

        if (name) body.name = name;
        if (order !== undefined) body.order = order;
        if (color) body.color = color;
        if (isFavorite !== undefined) body.is_favorite = isFavorite;

        const label = await lib.apiRequest(context, `/labels/${labelId}`, {
            method: 'POST',
            data: body
        });

        return context.sendJson(label, 'out');
    }
};
