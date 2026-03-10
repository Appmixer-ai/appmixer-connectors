'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const {
            publicationId, email,
            reactivate_existing: reactivateExisting,
            send_welcome_email: sendWelcomeEmail,
            utm_source: utmSource, utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            referring_site: referringSite,
            referral_code: referralCode, tier,
            double_opt_override: doubleOptOverride
        } = context.messages.in.content;

        const result = await api.Create3.execute(context, {
            publicationId,
            email,
            reactivate_existing: reactivateExisting,
            send_welcome_email: sendWelcomeEmail,
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            referring_site: referringSite,
            referral_code: referralCode,
            tier,
            double_opt_override: doubleOptOverride
        });

        return context.sendJson(result, 'out');
    }
};
