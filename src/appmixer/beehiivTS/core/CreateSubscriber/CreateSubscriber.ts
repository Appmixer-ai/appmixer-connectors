import type { AppmixerContext } from '../../types';

const api = require('../../api.ts');

interface CreateSubscriberInput {
    publicationId: string;
    email: string;
    reactivate_existing?: boolean;
    send_welcome_email?: boolean;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    referring_site?: string;
    referral_code?: string;
    tier?: string;
    double_opt_override?: string;
}

module.exports = {
    async receive(context: AppmixerContext): Promise<void> {
        const {
            publicationId, email,
            reactivate_existing: reactivateExisting,
            send_welcome_email: sendWelcomeEmail,
            utm_source: utmSource, utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            referring_site: referringSite,
            referral_code: referralCode, tier,
            double_opt_override: doubleOptOverride
        } = context.messages.in.content as CreateSubscriberInput;

        if (!publicationId) {
            throw new context.CancelError('Publication ID is required!');
        }
        if (!email) {
            throw new context.CancelError('Email is required!');
        }

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
