'use strict';

module.exports = {

    async receive(context) {

        const { id } = context.messages.in.content;

        if (!id) throw new context.CancelError('Task ID is required!');

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://${context.auth.domain}/api/tasks/${id}`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        return context.sendJson(data.task, 'out');
    }
};
