'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { sectionId, name } = context.messages.in.content;

        if (!sectionId) {
            throw new context.CancelError('Section ID is required!');
        }

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const section = await lib.apiRequest(context, `/sections/${sectionId}`, {
            method: 'POST',
            data: { name }
        });

        return context.sendJson(section, 'out');
    }
};
