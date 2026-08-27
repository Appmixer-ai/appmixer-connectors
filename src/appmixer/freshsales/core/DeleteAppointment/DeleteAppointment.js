'use strict';

module.exports = {

    async receive(context) {

        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Appointment ID is required!');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `https://${context.auth.domain}/api/appointments/${id}`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson({}, 'out');
    }
};
