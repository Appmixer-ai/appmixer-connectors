'use strict';

module.exports = {
    async receive(context) {

        const { id } = context.messages.in.content;
        if (!id) throw new context.CancelError('Task ID is required!');

        await context.httpRequest({
            method: 'DELETE',
            url: `https://${context.auth.domain}/api/tasks/${id}`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        return context.sendJson({}, 'out');
    }
};
