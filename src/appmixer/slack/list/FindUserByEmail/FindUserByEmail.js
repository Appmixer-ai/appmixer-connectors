'use strict';

const lib = require('../../lib');

// Same item as ListUsers: the users.lookupByEmail user object.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
        id: { type: 'string', title: 'ID', example: 'U0ABC12345' },
        team_id: { type: 'string', title: 'Team ID', example: 'T0ABC12345' },
        name: { type: 'string', title: 'Name', example: 'jane' },
        deleted: { type: 'boolean', title: 'Deleted', example: false },
        color: { type: 'string', title: 'Color', example: '9f69e7' },
        real_name: { type: 'string', title: 'Real Name', example: 'Jane Doe' },
        tz: { type: 'string', title: 'Timezone', example: 'Europe/Prague' },
        tz_label: { type: 'string', title: 'Timezone Label', example: 'Central European Summer Time' },
        tz_offset: { type: 'number', title: 'Timezone Offset', example: 7200 },
        profile: {
            type: 'object',
            title: 'Profile',
            properties: {
                avatar_hash: { type: 'string', title: 'Profile.Avatar Hash', example: 'g1a2b3c4d5e6' },
                status_text: { type: 'string', title: 'Profile.Status Text', example: 'In a meeting' },
                status_emoji: { type: 'string', title: 'Profile.Status Emoji', example: ':calendar:' },
                real_name: { type: 'string', title: 'Profile.Real Name', example: 'Jane Doe' },
                display_name: { type: 'string', title: 'Profile.Display Name', example: 'jane' },
                real_name_normalized: { type: 'string', title: 'Profile.Real Name Normalized', example: 'Jane Doe' },
                display_name_normalized: { type: 'string', title: 'Profile.Display Name Normalized', example: 'jane' },
                email: { type: 'string', title: 'Profile.Email', example: 'jane.doe@example.com' },
                image_24: { type: 'string', title: 'Profile.Image 24', example: 'https://avatars.slack-edge.com/u_24.jpg' },
                image_32: { type: 'string', title: 'Profile.Image 32', example: 'https://avatars.slack-edge.com/u_32.jpg' },
                image_48: { type: 'string', title: 'Profile.Image 48', example: 'https://avatars.slack-edge.com/u_48.jpg' },
                image_72: { type: 'string', title: 'Profile.Image 72', example: 'https://avatars.slack-edge.com/u_72.jpg' },
                image_192: { type: 'string', title: 'Profile.Image 192', example: 'https://avatars.slack-edge.com/u_192.jpg' },
                image_512: { type: 'string', title: 'Profile.Image 512', example: 'https://avatars.slack-edge.com/u_512.jpg' },
                team: { type: 'string', title: 'Profile.Team', example: 'T0ABC12345' }
            }
        },
        is_admin: { type: 'boolean', title: 'Is Admin', example: false },
        is_owner: { type: 'boolean', title: 'Is Owner', example: false },
        is_primary_owner: { type: 'boolean', title: 'Is Primary Owner', example: false },
        is_restricted: { type: 'boolean', title: 'Is Restricted', example: false },
        is_ultra_restricted: { type: 'boolean', title: 'Is Ultra Restricted', example: false },
        is_bot: { type: 'boolean', title: 'Is Bot', example: false },
        updated: { type: 'number', title: 'Updated', example: 1737024600 },
        is_app_user: { type: 'boolean', title: 'Is App User', example: false },
        has_2fa: { type: 'boolean', title: 'Has 2FA', example: false },
        locale: { type: 'string', title: 'Locale', example: 'en-US' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    /**
     * @link https://docs.slack.dev/reference/methods/users.lookupByEmail
     */
    async receive(context) {

        const { email, outputType = 'first' } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Users' });
        }

        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://slack.com/api/users.lookupByEmail',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: { email: email.trim() }
        });

        if (!data) {
            throw new Error('Empty response from Slack users.lookupByEmail');
        }
        if (!data.ok) {
            // No active user with this email (deactivated users are reported the same way).
            if (data.error === 'users_not_found') {
                return context.sendJson({ email }, 'notFound');
            }
            throw new Error(data.error);
        }

        return lib.sendArrayOutput({ context, outputType, records: [data.user] });
    }
};
