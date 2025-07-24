/* eslint-disable camelcase */
'use strict';

module.exports = {
    async receive(context) {

        const {
            from,
            to: rawTo,
            subject,
            html,
            text,
            cc: rawCc,
            bcc: rawBcc,
            reply_to: rawReplyTo,
            headers,
            idempotency_key
        } = context.messages.in.content;

        // Helper to normalize address fields
        function normalizeAddresses(val) {
            if (Array.isArray(val)) return val;
            if (typeof val === 'string') {
                // Split by comma, space, or newline, and trim each
                return val.split(/[,\s\n]+/).map(s => s.trim()).filter(Boolean);
            }
            return val;
        }

        const to = normalizeAddresses(rawTo);
        const cc = normalizeAddresses(rawCc);
        const bcc = normalizeAddresses(rawBcc);
        const reply_to = normalizeAddresses(rawReplyTo);

        // Validate required fields
        if (!from) {
            throw new context.CancelError('From email is required!');
        }
        if (!to || (Array.isArray(to) && to.length === 0)) {
            throw new context.CancelError('To email is required!');
        }
        if (!subject) {
            throw new context.CancelError('Subject is required!');
        }

        if (!html && !text) {
            throw new context.CancelError('Either HTML or text content is required!');
        }

        // Prepare request data
        const data = {
            from,
            to,
            subject
        };

        // Add optional fields if provided
        if (html) data.html = html;
        if (text) data.text = text;
        if (cc && cc.length > 0) data.cc = cc;
        if (bcc && bcc.length > 0) data.bcc = bcc;
        if (reply_to && reply_to.length > 0) data.reply_to = reply_to;
        if (headers) {
            try {
                data.headers = JSON.parse(headers);
            } catch (error) {
                throw new context.CancelError('Invalid headers format. Must be valid JSON.');
            }
        }

        const requestHeaders = { 'Authorization': `Bearer ${context.auth.apiKey}` };
        // Add idempotency key if provided
        if (idempotency_key) {
            requestHeaders['Idempotency-Key'] = idempotency_key;
        }

        // Send the email
        const { data: responseData } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.resend.com/emails',
            headers: requestHeaders,
            data
        });

        return context.sendJson(responseData, 'out');
    }
};
