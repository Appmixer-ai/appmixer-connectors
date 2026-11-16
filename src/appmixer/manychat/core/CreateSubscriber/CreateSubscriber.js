'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const content = context.messages.in.content;
        const { email, phone, whatsappPhone } = content;

        if (!email && !phone && !whatsappPhone) {
            throw new context.CancelError('Email, Phone or WhatsApp Phone is required!');
        }

        const body = lib.contactBody(content);
        if (whatsappPhone) {
            body.whatsapp_phone = whatsappPhone;
        }

        const subscriber = await lib.request(context, {
            method: 'POST',
            path: '/fb/subscriber/createSubscriber',
            data: body
        });

        return context.sendJson(subscriber, 'out');
    }
};
