module.exports = {

    async receive(context) {

        const {
            conversationId,
            channelId,
            body,
            text,
            subject,
            to,
            cc,
            bcc
        } = context.messages.in.content;

        if (!body) {
            throw new context.CancelError('Message body is required!');
        }

        try {
            let url;
            if (conversationId) {
                // Create draft in existing conversation
                url = `https://api2.frontapp.com/conversations/${conversationId}/drafts`;
            } else if (channelId) {
                // Create draft in new conversation via channel
                url = `https://api2.frontapp.com/channels/${channelId}/drafts`;
            } else {
                throw new context.CancelError('Either Conversation ID or Channel ID is required!');
            }

            const requestData = {
                body: body
            };

            if (text) {
                requestData.text = text;
            }

            if (subject) {
                requestData.subject = subject;
            }

            // Handle recipients
            if (to) {
                requestData.to = Array.isArray(to) ? to : to.split(',').map(email => email.trim());
            }

            if (cc) {
                requestData.cc = Array.isArray(cc) ? cc : cc.split(',').map(email => email.trim());
            }

            if (bcc) {
                requestData.bcc = Array.isArray(bcc) ? bcc : bcc.split(',').map(email => email.trim());
            }

            const response = await context.httpRequest({
                method: 'POST',
                url,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                data: requestData
            });

            return context.sendJson(response.data, 'out');

        } catch (error) {
            if (error.response?.status === 404) {
                throw new context.CancelError('Conversation or Channel not found!');
            }
            if (error.response?.status === 422) {
                throw new context.CancelError('Invalid draft data provided!');
            }
            throw error;
        }
    }
};
