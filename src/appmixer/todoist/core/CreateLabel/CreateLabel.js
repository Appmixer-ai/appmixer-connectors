'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name, order, color, isFavorite } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const body = { name };

        if (order !== undefined) body.order = order;
        if (color) body.color = color;
        if (isFavorite !== undefined) body.is_favorite = isFavorite;

        const label = await lib.apiRequest(context, '/labels', {
            method: 'POST',
            data: body
        });

        return context.sendJson(label, 'out');
    }
};
