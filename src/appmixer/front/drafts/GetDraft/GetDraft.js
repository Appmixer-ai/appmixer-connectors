module.exports = {

    async receive(context) {

        const { draftId } = context.messages.in.content;

        if (!draftId) {
            throw new context.CancelError('Draft ID is required!');
        }

        try {
            const response = await context.httpRequest({
                method: 'GET',
                url: `https://api2.frontapp.com/messages/${draftId}`,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Accept': 'application/json'
                }
            });

            const message = response.data;

            // Verify that this is actually a draft
            if (!message.is_draft) {
                throw new context.CancelError('The specified message is not a draft!');
            }

            return context.sendJson(message, 'out');

        } catch (error) {
            if (error.response?.status === 404) {
                throw new context.CancelError('Draft not found!');
            }
            throw error;
        }
    }
};
