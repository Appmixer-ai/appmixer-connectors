'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const {
            publicationId, email, reactivate_existing, send_welcome_email,
            utm_source, utm_medium, utm_campaign, referring_site,
            referral_code, tier, double_opt_override
        } = context.messages.in.content;

        const result = await api.Create3.execute(context, {
            publicationId,
            email,
            reactivate_existing,
            send_welcome_email,
            utm_source,
            utm_medium,
            utm_campaign,
            referring_site,
            referral_code,
            tier,
            double_opt_override
        });

        return context.sendJson(result, 'out');
    }
};
