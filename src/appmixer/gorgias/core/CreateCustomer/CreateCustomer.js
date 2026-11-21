'use strict';

const lib = require('../../lib');

// POST /api/customers - https://developers.gorgias.com/reference/create-customer
// The API requires the list of contact channels; the email and the phone become an email and a
// phone channel (the email one preferred).
module.exports = {

    async receive(context) {

        const { email, name, phone, externalId, language, timezone } = context.messages.in.content;

        if (!email && !name && !phone) {
            throw new context.CancelError('Fill in at least an Email, a Phone or a Name.');
        }

        const channels = [];
        if (email) {
            channels.push({ type: 'email', address: email, preferred: true });
        }
        if (phone) {
            channels.push({ type: 'phone', address: phone, preferred: !email });
        }

        const body = lib.compact({ email, name, external_id: externalId, language, timezone });
        body.channels = channels;

        const { data } = await lib.request(context, { method: 'POST', path: '/customers', data: body });
        return context.sendJson(data, 'out');
    }
};
