module.exports = {
    async receive(context) {
        const { channelId } = context.messages.in.content;

        if (!channelId) {
            throw new context.CancelError('Channel ID is required.');
        }

        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/channels/${channelId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson(response.data, 'out');
    }
};
