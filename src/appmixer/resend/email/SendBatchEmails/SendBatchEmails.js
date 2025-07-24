/* eslint-disable camelcase */
'use strict';

module.exports = {
    async receive(context) {

        const { emails: rawEmails, idempotency_key } = context.messages.in.content;

        // Validate required fields
        if (!rawEmails || !Array.isArray(rawEmails)) {
            throw new context.CancelError('Emails array is required!');
        }

        if (rawEmails.length === 0) {
            throw new context.CancelError('At least one email is required!');
        }

        if (rawEmails.length > 100) {
            throw new context.CancelError('Maximum 100 emails allowed per batch!');
        }

        // Helper function to normalize address fields (same as SendEmail)
        function normalizeAddresses(val) {
            if (Array.isArray(val)) return val;
            if (typeof val === 'string') {
                // Split by comma, space, or newline, and trim each
                return val.split(/[,\s\n]+/).map(s => s.trim()).filter(Boolean);
            }
            return val;
        }

        // Process each email from the expression
        const processedEmails = [];
        for (let i = 0; i < rawEmails.length; i++) {
            const email = rawEmails[i];

            // Validate required fields
            if (!email.from) {
                throw new context.CancelError(`Email ${i + 1}: From email is required!`);
            }
            if (!email.to) {
                throw new context.CancelError(`Email ${i + 1}: To email is required!`);
            }
            if (!email.subject) {
                throw new context.CancelError(`Email ${i + 1}: Subject is required!`);
            }

            // Check that at least HTML or text content is provided
            if (!email.html && !email.text) {
                throw new context.CancelError(`Email ${i + 1}: Either HTML or text content is required!`);
            }

            // Normalize address fields (same logic as SendEmail)
            const to = normalizeAddresses(email.to);
            const cc = normalizeAddresses(email.cc);
            const bcc = normalizeAddresses(email.bcc);
            const reply_to = normalizeAddresses(email.reply_to);

            // Build the email object for the batch request
            const processedEmail = {
                from: email.from,
                to: to,
                subject: email.subject
            };

            // Add optional fields if provided
            if (email.html) processedEmail.html = email.html;
            if (email.text) processedEmail.text = email.text;
            if (cc && cc.length > 0) processedEmail.cc = cc;
            if (bcc && bcc.length > 0) processedEmail.bcc = bcc;
            if (reply_to && reply_to.length > 0) processedEmail.reply_to = reply_to;

            // Handle headers (same logic as SendEmail)
            if (email.headers) {
                try {
                    processedEmail.headers = JSON.parse(email.headers);
                } catch (error) {
                    throw new context.CancelError(`Email ${i + 1}: Invalid headers format. Must be valid JSON.`);
                }
            }

            processedEmails.push(processedEmail);
        }

        // Setup headers for the request
        const requestHeaders = {
            'Authorization': `Bearer ${context.auth.apiKey}`,
            'Content-Type': 'application/json'
        };

        // Add idempotency key if provided
        if (idempotency_key) {
            requestHeaders['Idempotency-Key'] = idempotency_key;
        }

        // Send the batch emails
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.resend.com/emails/batch',
            headers: requestHeaders,
            data: processedEmails
        });

        // Return the result with count for better usability
        return context.sendJson({
            data: data,
            count: data ? data.length : 0
        }, 'out');
    }
};
