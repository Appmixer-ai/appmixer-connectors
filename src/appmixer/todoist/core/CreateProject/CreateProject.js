'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name, parentId, color, isFavorite, viewStyle } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const body = { name };

        if (parentId) body.parent_id = parentId;
        if (color) body.color = color;
        if (isFavorite !== undefined) body.is_favorite = isFavorite;
        if (viewStyle) body.view_style = viewStyle;

        const project = await lib.apiRequest(context, '/projects', {
            method: 'POST',
            data: body
        });

        return context.sendJson(project, 'out');
    }
};
