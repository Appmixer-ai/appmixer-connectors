'use strict';

module.exports = {
    async receive(context) {
        const { ruleId } = context.messages.in.content;

        if (!ruleId) {
            throw new context.CancelError('Rule ID is required.');
        }

        // https://dev.frontapp.com/reference/get-rule
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/rules/${ruleId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
