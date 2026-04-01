'use strict';
const ClickUpClient = require('../../ClickUpClient');

module.exports = {

    async receive(context) {

        const { taskId, fieldId, value } = context.messages.in.content;
        if (!taskId) {
            throw new context.CancelError('Task ID is required!');
        }
        if (!fieldId) {
            throw new context.CancelError('Field ID is required!');
        }
        if (!value) {
            throw new context.CancelError('Value is required!');
        }

        let parsedValue;
        try {
            parsedValue = JSON.parse(value);
        } catch (e) {
            parsedValue = value;
        }

        const clickUpClient = new ClickUpClient(context);

        await clickUpClient.request('POST', `/task/${taskId}/field/${fieldId}`, { data: { value: parsedValue } });

        return context.sendJson({}, 'out');
    }
};
