'use strict';

const lib = require('../lib');
const react = require('../reactions');

module.exports = {

    async receive(context) {

        const { location = 'channel', reactionType } = context.messages.in.content;

        const missing = lib.missingMessageInput({ ...context.messages.in.content, location });
        if (missing) {
            throw new context.CancelError(missing);
        }
        if (!reactionType) {
            throw new context.CancelError('Reaction is required!');
        }

        return react(context, 'unsetReaction');
    }
};
