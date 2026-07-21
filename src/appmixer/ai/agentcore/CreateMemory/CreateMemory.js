'use strict';

const { CreateMemoryCommand } = require('@aws-sdk/client-bedrock-agentcore-control');
const lib = require('../lib');

module.exports = {

    async receive(context) {

        const {
            name,
            eventExpiryDuration,
            description,
            memoryExecutionRoleArn,
            encryptionKeyArn
        } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }
        if (eventExpiryDuration === undefined || eventExpiryDuration === null || eventExpiryDuration === '') {
            throw new context.CancelError('Event Expiry Duration is required!');
        }

        const { controlClient } = lib.init(context);

        const params = {
            name,
            eventExpiryDuration: parseInt(eventExpiryDuration, 10)
        };
        if (description) {
            params.description = description;
        }
        if (memoryExecutionRoleArn) {
            params.memoryExecutionRoleArn = memoryExecutionRoleArn;
        }
        if (encryptionKeyArn) {
            params.encryptionKeyArn = encryptionKeyArn;
        }

        const response = await controlClient.send(new CreateMemoryCommand(params));

        return context.sendJson(response.memory || {}, 'out');
    }
};
