'use strict';

const lib = require('../../lib');

const FIELDS = [
    'id',
    'display_phone_number',
    'verified_name',
    'quality_rating',
    'code_verification_status',
    'platform_type',
    'throughput'
].join(',');

module.exports = {

    async receive(context) {

        const { phoneNumberId } = context.messages.in.content;

        if (!phoneNumberId) {
            throw new context.CancelError('Phone Number ID is required!');
        }

        const { data } = await lib.apiRequest(context, {
            method: 'GET',
            path: `/${phoneNumberId}`,
            params: { fields: FIELDS }
        });

        return context.sendJson({
            id: data.id,
            displayPhoneNumber: data.display_phone_number,
            verifiedName: data.verified_name,
            qualityRating: data.quality_rating,
            codeVerificationStatus: data.code_verification_status,
            platformType: data.platform_type,
            throughputLevel: data.throughput && data.throughput.level
        }, 'out');
    }
};
