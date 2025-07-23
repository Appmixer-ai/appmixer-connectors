/* eslint-disable camelcase */
'use strict';

module.exports = {
    async receive(context) {

        const { emails, idempotency_key } = context.messages.in.content;

        // Validate required fields
        if (!emails) {
            throw new context.CancelError('Emails array is required!');
        }

        if (!Array.isArray(emails)) {
            throw new context.CancelError('Emails must be an array!');
        }

        if (emails.length === 0) {
            throw new context.CancelError('Emails array cannot be empty!');
        }

        if (emails.length > 100) {
            throw new context.CancelError('Maximum 100 emails allowed per batch!');
        }

        // Validate each email object
        for (let i = 0; i < emails.length; i++) {
            const email = emails[i];

            if (!email.from) {
                throw new context.CancelError(`Email at index ${i}: From email is required!`);
            }
            if (!email.to) {
                throw new context.CancelError(`Email at index ${i}: To email is required!`);
            }
            if (!email.subject) {
                throw new context.CancelError(`Email at index ${i}: Subject is required!`);
            }
        }

        // Setup headers for the request
        const requestHeaders = {
            'Authorization': `Bearer ${context.auth.apiKey}`
        };

        // Add idempotency key if provided
        if (idempotency_key) {
            requestHeaders['Idempotency-Key'] = idempotency_key;
        }

        // Process emails array to ensure proper format
        const formatted_emails = emails.map(email => {
            const formatted_email = {
                from: email.from,
                to: email.to,
                subject: email.subject
            };

            // Add optional fields if provided
            if (email.html) formatted_email.html = email.html;
            if (email.text) formatted_email.text = email.text;
            if (email.cc) formatted_email.cc = email.cc;
            if (email.bcc) formatted_email.bcc = email.bcc;
            if (email.reply_to) formatted_email.reply_to = email.reply_to;
            if (email.headers) formatted_email.headers = email.headers;

            return formatted_email;
        });

        // https://resend.com/docs/api-reference/emails/send-batch-emails
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.resend.com/emails/batch',
            headers: requestHeaders,
            data: formatted_emails
        });

        return context.sendJson(data, 'out');
    }
};
