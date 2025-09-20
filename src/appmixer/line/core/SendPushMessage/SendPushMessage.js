module.exports = {
    async receive(context) {

        const { to, messages, notificationDisabled } = context.messages.in.content;

        if (!to) {
            throw new context.CancelError('To is required.');
        }

        if (!messages) {
            throw new context.CancelError('Messages is required.');
        }

        const messagesArr = messages.ADD.map((message) => {
            return {
                type: message.type,
                text: message.text,
                packageId: message.packageId,
                stickerId: message.stickerId
            };
        });

        // const validateResponse = await context.httpRequest({
        //     method: 'POST',
        //     url: 'https://api.line.me/v2/bot/message/validate/push',
        //     headers: {
        //         'Authorization': `Bearer ${context.auth.channelAccessToken}`
        //     },
        //     data: {
        //         messages: messagesArr
        //     }
        // });

        // context.log({ step: 'validate', response: validateResponse });

        // if (!validateResponse.ok) {
        //     throw new context.CancelError('Message validation failed.');
        // }

        // https://developers.line.biz/en/reference/messaging-api/#send-push-message
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.line.me/v2/bot/message/push',
            headers: {
                'Authorization': `Bearer ${context.auth.channelAccessToken}`
            },
            data: {
                to,
                notificationDisabled,
                messages: messagesArr
            }
        });

        return context.sendJson(data, 'out');
    }
};
