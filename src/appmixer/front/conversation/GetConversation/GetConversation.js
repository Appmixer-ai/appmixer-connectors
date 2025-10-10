'use strict';

module.exports = {
    async receive(context) {

        const { id } = context.messages.in.content;

        // https://dev.frontapp.com/reference/get-conversation-by-id
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/conversations/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        context.log({ step: 'getConversation response', data });

        return context.sendJson(data, 'out');
    }
};
