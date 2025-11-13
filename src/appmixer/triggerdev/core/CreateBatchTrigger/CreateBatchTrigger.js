'use strict';

module.exports = {

    async receive(context) {

        const { taskIdentifier, items } = context.messages.in.content;

        if (!taskIdentifier) {
            throw new context.CancelError('Task Identifier is required!');
        }

        if (!items) {
            throw new context.CancelError('Items is required!');
        }

        let itemsArray;
        try {
            itemsArray = JSON.parse(items);
            if (!Array.isArray(itemsArray)) {
                throw new Error('Items must be a JSON array');
            }
        } catch (error) {
            throw new context.CancelError(`Invalid JSON array for items: ${error.message}`);
        }

        const baseUrl = context.auth.baseUrl || 'https://cloud.trigger.dev';

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `${baseUrl}/api/v1/tasks/${taskIdentifier}/batch`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: {
                items: itemsArray
            }
        });

        return context.sendJson(data, 'out');
    }
};
