/* eslint-disable camelcase */
'use strict';

module.exports = {
    async receive(context) {

        const { emails: emailsExpression, idempotency_key } = context.messages.in.content;
        const emailsExpressionArray = emailsExpression?.ADD || [];
        // Always expect emails as array (expression field)
        if (!Array.isArray(emailsExpressionArray)) {
            throw new context.CancelError('Emails must be an array (expression field).');
        }
        if (emailsExpressionArray.length === 0) {
            throw new context.CancelError('At least one email is required!');
        }
        if (emailsExpressionArray.length > 100) {
            // It is very unlikely that someone will be able to create 100 emails in the UI.
            throw new context.CancelError('Maximum 100 emails allowed per batch!');
        }
        const emailsArr = emailsExpressionArray;

        // Helper function to normalize address fields (same as SendEmail)
        function normalizeAddresses(val) {
            if (Array.isArray(val)) return val;
            if (typeof val === 'string') {
                // Split by comma, space, or newline, and trim each
                const arr = val.split(/[,,\s\n]+/).map(s => s.trim()).filter(Boolean);
                if (arr.length > 50) {
                    throw new context.CancelError('Maximum 50 addresses allowed per field (to/cc/bcc/reply_to).');
                }
                return arr;
            }
            return val;
        }

        // Process each email from the expression
        const processedEmails = [];
        for (let i = 0; i < emailsArr.length; i++) {
            const email = emailsArr[i];

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
            'Authorization': `Bearer ${context.auth.apiKey}`
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
            count: data?.length ?? 0
        }, 'out');
    }
};
