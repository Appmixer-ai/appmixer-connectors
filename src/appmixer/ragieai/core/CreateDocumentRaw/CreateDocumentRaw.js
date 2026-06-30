'use strict';

module.exports = {
    async receive(context) {
        const { data, name, externalId, partition, metadata } = context.messages.in.content;

        if (!data) {
            throw new context.CancelError('Data is required!');
        }

        const requestData = {
            data
        };

        if (name) {
            requestData.name = name;
        }

        if (externalId) {
            requestData.external_id = externalId;
        }

        if (partition) {
            requestData.partition = partition;
        }

        if (metadata) {
            if (typeof metadata === 'string') {
                try {
                    requestData.metadata = JSON.parse(metadata);
                } catch (err) {
                    throw new context.CancelError('Invalid metadata JSON. Please provide a valid JSON string in the "metadata" field.');
                }
            } else {
                requestData.metadata = metadata;
            }
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.ragie.ai/documents/raw',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(response.data, 'out');
    }
};
