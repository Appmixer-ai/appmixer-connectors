'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { spaceId, name, description } = context.messages.in.content;
        if (!spaceId) {
            throw new context.CancelError('Space is required!');
        }

        const operations = [];
        if (name) {
            operations.push({ op: 'replace', path: '/name', value: name });
        }
        if (description !== undefined && description !== null) {
            operations.push({ op: 'replace', path: '/description', value: description });
        }
        if (!operations.length) {
            throw new context.CancelError('Enter a Name or a Description to update.');
        }
        await lib.apiRequest(context, {
            method: 'PATCH',
            path: '/api/v1/spaces/' + encodeURIComponent(spaceId),
            data: operations
        });
        return context.sendJson({}, 'out');
    }
};
