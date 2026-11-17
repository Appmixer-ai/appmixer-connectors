'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { email, name, language, resend } = context.messages.in.content;
        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        const invitee = { email, resend: Boolean(resend) };
        if (name) {
            invitee.name = name;
        }
        if (language) {
            invitee.language = language;
        }
        // 207 Multi-Status: one result per invitee, either { status: ok | exists, userId, ... }
        // or { status: error, code, title, ... }.
        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: '/api/v1/users/actions/invite',
            data: { invitees: [invitee] }
        });
        const result = ((data && data.data) || [])[0];
        if (!result) {
            throw new Error('Qlik Cloud returned no result for the invitation.');
        }
        if (result.status === 'error') {
            const detail = [result.code, result.title, result.detail].filter(Boolean).join(': ');
            throw new context.CancelError('The invitation of ' + email + ' failed: ' + (detail || 'unknown error'));
        }
        return context.sendJson({
            userId: result.userId,
            email: result.email || email,
            status: result.status,
            subject: result.subject
        }, 'out');
    }
};
