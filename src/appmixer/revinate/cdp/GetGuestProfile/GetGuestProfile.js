'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { profileId, sourceSystemId, accountId } = context.messages.in.content;

        if (!profileId) {
            throw new context.CancelError('Profile ID is required!');
        }

        const id = lib.requireProfileId(context, profileId);

        // The path is singular: /api/v2/rich-guest-profile/{profileId}. sourceSystemId is a header.
        const profile = await lib.request(context, {
            path: `/api/v2/rich-guest-profile/${encodeURIComponent(id)}`,
            accountId,
            headers: lib.isEmpty(sourceSystemId) ? {} : { sourceSystemId: String(sourceSystemId).trim() }
        });

        if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
            throw new Error('Revinate returned an unexpected answer for the guest profile.');
        }

        return context.sendJson(lib.mapProfile(profile), 'out');
    }
};
