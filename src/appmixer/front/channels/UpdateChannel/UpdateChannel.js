module.exports = {
    async receive(context) {
        const { channelId, settings } = context.messages.in.content;

        if (!channelId) {
            throw new context.CancelError('Channel ID is required.');
        }

        // Parse settings if it's a string
        let parsedSettings = settings;
        if (typeof settings === 'string') {
            try {
                parsedSettings = JSON.parse(settings);
            } catch (error) {
                throw new context.CancelError('Settings must be valid JSON format.');
            }
        }

        const requestData = {};
        if (parsedSettings) {
            requestData.settings = parsedSettings;
        }

        const response = await context.httpRequest({
            method: 'PATCH',
            url: `https://api2.frontapp.com/channels/${channelId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(response.data, 'out');
    }
};
