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

        const { businessAccountId } = context.messages.in.content;

        if (!businessAccountId) {
            throw new context.CancelError('Business Account ID is required!');
        }

        const { data } = await lib.apiRequest(context, {
            method: 'GET',
            path: `/${businessAccountId}/phone_numbers`,
            params: { fields: FIELDS, limit: 100 }
        });

        const phoneNumbers = (data.data || []).map(item => ({
            id: item.id,
            displayPhoneNumber: item.display_phone_number,
            verifiedName: item.verified_name,
            qualityRating: item.quality_rating,
            codeVerificationStatus: item.code_verification_status,
            platformType: item.platform_type,
            throughputLevel: item.throughput && item.throughput.level
        }));

        return context.sendJson({
            phoneNumbers,
            count: phoneNumbers.length
        }, 'out');
    }
};
