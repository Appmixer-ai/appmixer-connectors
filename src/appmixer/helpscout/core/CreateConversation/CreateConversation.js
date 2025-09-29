
'use strict';

module.exports = {
    async receive(context) {

        const {
            type,
            mailboxId,
            subject,
            customerId,
            customerEmail,
            customerFirstName,
            customerLastName,
            threadType,
            threadText,
            tags
        } = context.messages.in.content;

        if (!mailboxId) {
            throw new context.CancelError('Mailbox ID is required!');
        }

        if (!subject) {
            throw new context.CancelError('Subject is required!');
        }

        if (!threadText) {
            throw new context.CancelError('Thread text is required!');
        }

        const customerData = customerId
            ? { id: parseInt(customerId) }
            : {
                email: customerEmail || 'test@example.com',
                firstName: customerFirstName || 'Unknown',
                lastName: customerLastName || 'Customer'
            };

        const requestBody = {
            type: type || 'email',
            mailboxId: parseInt(mailboxId),
            subject,
            status: 'active',
            customer: customerData,
            threads: [{
                type: threadType || 'customer',
                text: threadText,
                customer: customerData
            }]
        };

        // Add tags if provided
        if (tags && Array.isArray(tags)) {
            requestBody.tags = tags;
        }

        // https://developer.helpscout.com/mailbox-api/endpoints/conversations/create/
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.helpscout.net/v2/conversations',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
