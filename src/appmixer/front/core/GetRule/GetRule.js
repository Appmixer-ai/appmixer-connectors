module.exports = {

    async receive(context) {

        const { ruleId } = context.messages.in.content;

        if (!ruleId) {
            throw new context.CancelError('Rule ID is required!');
        }

        try {
            const url = `https://api2.frontapp.com/rules/${ruleId}`;

            const response = await context.httpRequest({
                method: 'GET',
                url,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Accept': 'application/json'
                }
            });

            return context.sendJson(response.data, 'out');

        } catch (error) {
            if (error.response?.status === 404) {
                throw new context.CancelError('Rule not found!');
            }
            throw error;
        }
    }
};
