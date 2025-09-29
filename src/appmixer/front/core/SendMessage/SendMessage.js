module.exports = {

    async receive(context) {

        const {
            conversationId,
            body,
            text,
            subject,
            to,
            cc,
            bcc,
            tag_ids,
            archiveAfterSend
        } = context.messages.in.content;

        if (!conversationId) {
            throw new context.CancelError('Conversation ID is required!');
        }

        if (!body) {
            throw new context.CancelError('Message body is required!');
        }

        try {
            const url = `https://api2.frontapp.com/conversations/${conversationId}/messages`;

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

            // Handle tag IDs
            if (tag_ids) {
                requestData.tag_ids = Array.isArray(tag_ids) ? tag_ids : tag_ids.split(',').map(id => id.trim());
            }

            // Handle archive after send
            if (typeof archiveAfterSend === 'boolean') {
                requestData.archive = archiveAfterSend;
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
                throw new context.CancelError('Conversation not found!');
            }
            if (error.response?.status === 422) {
                throw new context.CancelError('Invalid message data provided!');
            }
            throw error;
        }
    }
};
