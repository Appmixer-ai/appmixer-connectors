module.exports = {

    async receive(context) {

        const { draftId } = context.messages.in.content;

        if (!draftId) {
            throw new context.CancelError('Draft ID is required!');
        }

        try {
            const url = `https://api2.frontapp.com/drafts/${draftId}`;

            await context.httpRequest({
                method: 'DELETE',
                url,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Accept': 'application/json'
                }
            });

            return context.sendJson({}, 'out');

        } catch (error) {
            if (error.response?.status === 404) {
                throw new context.CancelError('Draft not found!');
            }
            throw error;
        }
    }
};
