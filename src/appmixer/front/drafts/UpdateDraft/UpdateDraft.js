module.exports = {

    async receive(context) {

        const {
            draftId,
            body,
            text,
            subject,
            to,
            cc,
            bcc,
            version
        } = context.messages.in.content;

        if (!draftId) {
            throw new context.CancelError('Draft ID is required!');
        }

        try {
            const url = `https://api2.frontapp.com/drafts/${draftId}`;

            const requestData = {};

            if (body) {
                requestData.body = body;
            }

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

            // Include version for conflict detection if provided
            if (version) {
                requestData.version = version;
            }

            // Only send request if there's something to update
            if (Object.keys(requestData).length === 0) {
                throw new context.CancelError('At least one field must be provided to update!');
            }

            const response = await context.httpRequest({
                method: 'PATCH',
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
                throw new context.CancelError('Draft not found!');
            }
            if (error.response?.status === 409) {
                throw new context.CancelError('Draft has been modified by another user. Please get the latest version and try again!');
            }
            if (error.response?.status === 422) {
                throw new context.CancelError('Invalid draft data provided!');
            }
            throw error;
        }
    }
};
