const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { conversationId, limit, outputType = 'array' } = context.messages.in.content;

        if (!conversationId) {
            throw new context.CancelError('Conversation ID is required!');
        }

        try {
            const url = `https://api2.frontapp.com/conversations/${conversationId}/messages`;

            const params = {};
            if (limit) {
                params.limit = limit;
            }

            const response = await context.httpRequest({
                method: 'GET',
                url,
                params,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Accept': 'application/json'
                }
            });

            const messages = response.data._results || [];

            return lib.sendArrayOutput({
                context,
                outputPortName: 'out',
                result: messages,
                outputType
            });

        } catch (error) {
            if (error.response?.status === 404) {
                throw new context.CancelError('Conversation not found!');
            }
            throw error;
        }
    }
};
