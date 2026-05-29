'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { phoneNumberId, pin, dataLocalizationRegion } = context.messages.in.content;

        if (!phoneNumberId) {
            throw new context.CancelError('Phone Number ID is required!');
        }
        if (!pin) {
            throw new context.CancelError('Two-step verification PIN is required!');
        }

        const body = {
            messaging_product: 'whatsapp',
            pin: String(pin)
        };

        if (dataLocalizationRegion) {
            body.data_localization_region = dataLocalizationRegion;
        }

        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: `/${phoneNumberId}/register`,
            data: body
        });

        return context.sendJson({ success: !!data.success }, 'out');
    }
};
