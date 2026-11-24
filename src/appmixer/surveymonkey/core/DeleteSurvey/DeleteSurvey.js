'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { surveyId } = context.messages.in.content;

        if (!surveyId) {
            throw new context.CancelError('Survey is required!');
        }

        await lib.request(context, { method: 'DELETE', path: '/surveys/' + lib.encodeId(surveyId) });
        return context.sendJson({}, 'out');
    }
};
