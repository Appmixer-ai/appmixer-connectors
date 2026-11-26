'use strict';

const lib = require('../lib');

const PATH = '/api/v2/rich-guest-profiles';
const LABEL = 'the list of guest profiles';

// The same profile fires again when it is modified again, so the modification time is part of the key.
const profileKey = (profile) => `${profile.revinate_rich_guest_profile_id}@${profile.revinate_last_modified_at}`;

module.exports = {

    // The CDP API has no webhooks, so the profiles are polled by their modification time.
    async tick(context) {

        // Skipped while the previous check is still running.
        return lib.runExclusive(context, async () => {

            const { emit, state, truncated } = await lib.pollModified(context, {
                path: PATH,
                label: LABEL,
                extract: lib.profilesOf,
                getKey: profileKey,
                properties: context.properties
            });

            for (const profile of emit) {
                await context.sendJson(profile, 'out');
            }

            if (truncated) {
                await context.log({
                    step: 'truncated',
                    message: 'More guest profiles were modified at once than one check reads. The rest was skipped.'
                });
            }

            if (state) {
                await context.saveState(state);
            }
        });
    },

    // Flow Test Mode: emit one existing guest profile. Read-only, no state writes.
    async test(context) {

        const { data } = await lib.fetchPage(context, {
            path: PATH, label: LABEL, accountId: (context.properties || {}).accountId
        });
        const profiles = lib.profilesOf(data);

        if (!profiles.length) {
            throw new context.CancelError('This Revinate account has no guest profile yet.');
        }

        return context.sendJson(profiles[0], 'out');
    }
};
