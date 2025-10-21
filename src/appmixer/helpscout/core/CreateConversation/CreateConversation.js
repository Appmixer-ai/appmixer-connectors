
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
            threadsType,
            threadsText,
            status,
            tags
        } = context.messages.in.content;

        if (!mailboxId) {
            throw new context.CancelError('Mailbox ID is required!');
        }

        if (!subject) {
            throw new context.CancelError('Subject is required!');
        }

        if (!threadsText) {
            throw new context.CancelError('Threads text is required!');
        }

        if (!type) {
            throw new context.CancelError('Conversation type is required!');
        }

        if (!status) {
            throw new context.CancelError('Conversation status is required!');
        }

        // Either customerId OR customerEmail is required
        if (!customerId && !customerEmail) {
            throw new context.CancelError('Either Customer ID or Customer Email is required!');
        }

        const customerData = customerId
            ? { id: parseInt(customerId) }
            : {
                email: customerEmail,
                firstName: customerFirstName,
                lastName: customerLastName
            };

        const requestBody = {
            type: type || 'email',
            mailboxId: parseInt(mailboxId),
            subject,
            status: 'active',
            customer: customerData,
            threads: [{
                type: threadsType || 'customer',
                text: threadsText,
                customer: customerData
            }]
        };

        // Normalize and add tags if provided
        if (tags) {
            // Handle multiselect normalization - tags can be array of strings or array of objects with value property
            const normalizedTags = Array.isArray(tags)
                ? tags.map(tag => typeof tag === 'object' && tag.value !== undefined ? tag.value : tag)
                : [typeof tags === 'object' && tags.value !== undefined ? tags.value : tags];

            if (normalizedTags.length > 0 && normalizedTags[0] !== '') {
                requestBody.tags = normalizedTags;
            }
        }

        // https://developer.helpscout.com/mailbox-api/endpoints/conversations/create/
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.helpscout.net/v2/conversations',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
