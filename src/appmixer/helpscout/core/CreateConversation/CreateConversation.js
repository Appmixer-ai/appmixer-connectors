
'use strict';

module.exports = {
    async receive(context) {

        const {
            type,
            mailboxId,
            subject,
            customerId,
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

        // Customer ID is required
        if (!customerId) {
            throw new context.CancelError('Customer ID is required!');
        }

        const customerIdNumber = parseInt(customerId, 10);

        // Build customer object using customer ID
        const customerData = {
            id: customerIdNumber
        };

        // Use threadsType directly from inspector, default to "customer"
        const hsThreadType = (threadsType && threadsType.trim()) || 'customer';

        // Build thread object based on thread type
        const thread = {
            type: hsThreadType,
            text: threadsText
        };

        // For customer, reply, phone and chat threads, include customer reference
        if (['customer', 'reply', 'phone', 'chat'].includes(hsThreadType)) {
            thread.customer = { id: customerIdNumber };
        }

        const requestBody = {
            type: type || 'email',                 // email, chat, phone
            mailboxId: parseInt(mailboxId, 10),
            subject,
            status,
            customer: customerData,                // top level customer
            threads: [thread]
        };

        // Normalize tags to array of strings as expected by API
        if (tags) {
            let normalizedTags = [];

            if (Array.isArray(tags)) {
                normalizedTags = tags
                    .map(tag => {
                        if (typeof tag === 'object' && tag.value !== undefined) {
                            return String(tag.value);
                        }
                        return String(tag);
                    })
                    .filter(tag => tag && tag !== '');
            } else {
                const tagValue =
                    typeof tags === 'object' && tags.value !== undefined
                        ? tags.value
                        : tags;

                if (tagValue && String(tagValue) !== '') {
                    normalizedTags = [String(tagValue)];
                }
            }

            if (normalizedTags.length > 0) {
                requestBody.tags = normalizedTags;
            }
        }

        // https://developer.helpscout.com/mailbox-api/endpoints/conversations/create/
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.helpscout.net/v2/conversations',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: requestBody
        });

        const result = {
            'Resource-ID': response.headers['resource-id'] || response.headers['Resource-ID'],
            'Location': response.headers['location'] || response.headers['Location']
        };

        return context.sendJson(result, 'out');
    }
};
