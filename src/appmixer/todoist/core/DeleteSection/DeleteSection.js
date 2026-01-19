'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { sectionId } = context.messages.in.content;

        if (!sectionId) {
            throw new context.CancelError('Section ID is required.');
        }

        await lib.apiRequest(context, `/sections/${sectionId}`, {
            method: 'DELETE'
        });

        return context.sendJson({}, 'out');
    }
};
