'use strict';

const lib = require('../../lib');

/**
 * Build the Manychat contact body from the inputs. Opt-ins are sent only together
 * with the email or phone they belong to (Manychat requires them in that case).
 * @param {object} content input message content
 * @returns {object}
 */
const contactBody = function(content) {

    const { firstName, lastName, email, hasOptInEmail, phone, hasOptInSms, consentPhrase, gender } = content;
    const body = {};
    if (firstName) body.first_name = firstName;
    if (lastName) body.last_name = lastName;
    if (gender) body.gender = gender;
    if (email) {
        body.email = email;
        body.has_opt_in_email = hasOptInEmail === true || hasOptInEmail === 'true';
    }
    if (phone) {
        body.phone = phone;
        body.has_opt_in_sms = hasOptInSms === true || hasOptInSms === 'true';
    }
    if (consentPhrase) body.consent_phrase = consentPhrase;
    return body;
};

module.exports = {

    contactBody,

    async receive(context) {

        const content = context.messages.in.content;
        const { email, phone, whatsappPhone } = content;

        if (!email && !phone && !whatsappPhone) {
            throw new context.CancelError('Email, Phone or WhatsApp Phone is required!');
        }

        const body = contactBody(content);
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
