'use strict';

module.exports = {

    async receive(context) {

        const { name, description, query, operator, threshold } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Monitor name is required!');
        }

        if (!query) {
            throw new context.CancelError('Query is required!');
        }

        if (!operator) {
            throw new context.CancelError('Operator is required!');
        }

        if (threshold === undefined || threshold === null) {
            throw new context.CancelError('Threshold is required!');
        }

        const requestBody = {
            name,
            query,
            operator,
            threshold
        };

        if (description) {
            requestBody.description = description;
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.axiom.co/v1/monitors',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
