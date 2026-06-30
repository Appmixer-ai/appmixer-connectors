'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { projectId, name, color, isFavorite, viewStyle } = context.messages.in.content;

        if (!projectId) {
            throw new context.CancelError('Project ID is required.');
        }

        const body = {};

        if (name) body.name = name;
        if (color) body.color = color;
        if (isFavorite !== undefined) body.is_favorite = isFavorite;
        if (viewStyle) body.view_style = viewStyle;

        const project = await lib.apiRequest(context, `/projects/${projectId}`, {
            method: 'POST',
            data: body
        });

        return context.sendJson(project, 'out');
    }
};
