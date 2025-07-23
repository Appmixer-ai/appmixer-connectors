'use strict';

module.exports = {
    async receive(context) {

        const from = context.messages.in.from;
        const to = context.messages.in.to;
        const subject = context.messages.in.subject;
        const html = context.messages.in.html;
        const text = context.messages.in.text;
        const cc = context.messages.in.cc;
        const bcc = context.messages.in.bcc;
        const replyTo = context.messages.in.reply_to;
        const scheduledAt = context.messages.in.scheduled_at;
        const headers = context.messages.in.headers;
        const attachments = context.messages.in.attachments;
        const tags = context.messages.in.tags;
        const idempotencyKey = context.messages.in.idempotency_key;
        
        // Validate required fields
        if (!from) {
            throw new context.CancelError('From email is required!');
        }
        if (!to) {
            throw new context.CancelError('To email is required!');
        }
        if (!subject) {
            throw new context.CancelError('Subject is required!');
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
        if (cc) data.cc = cc;
        if (bcc) data.bcc = bcc;
        if (replyTo) data.reply_to = replyTo;
        if (scheduledAt) data.scheduled_at = scheduledAt;
        if (headers) data.headers = headers;
        if (attachments) data.attachments = attachments;
        if (tags) data.tags = tags;
        
        // Setup headers for the request
        const requestHeaders = {
            'Authorization': `Bearer ${context.auth.apiKey}`
        };
        
        // Add idempotency key if provided
        if (idempotencyKey) {
            requestHeaders['Idempotency-Key'] = idempotencyKey;
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
