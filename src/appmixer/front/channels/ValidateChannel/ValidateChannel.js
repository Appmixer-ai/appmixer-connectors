module.exports = {
    async receive(context) {
        const { channelId } = context.messages.in.content;

        if (!channelId) {
            throw new context.CancelError('Channel ID is required.');
        }

        try {
            const response = await context.httpRequest({
                method: 'POST',
                url: `https://api2.frontapp.com/channels/${channelId}/validate`,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            // Since this is an asynchronous operation, Front typically returns 202 Accepted
            return context.sendJson({
                success: true,
                message: 'Channel validation initiated successfully',
                channel_id: channelId,
                status: response.status
            }, 'out');

        } catch (error) {
            // Handle different types of errors
            if (error.response && error.response.status === 400) {
                return context.sendJson({
                    success: false,
                    message: 'Channel validation failed - invalid channel or not SMTP type',
                    channel_id: channelId,
                    error: error.response.data?.message || 'Bad request'
                }, 'out');
            } else if (error.response && error.response.status === 404) {
                return context.sendJson({
                    success: false,
                    message: 'Channel not found',
                    channel_id: channelId,
                    error: 'Channel does not exist'
                }, 'out');
            } else {
                throw error; // Re-throw unexpected errors
            }
        }
    }
};
