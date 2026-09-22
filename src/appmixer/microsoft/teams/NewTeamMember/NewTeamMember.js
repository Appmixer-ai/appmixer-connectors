'use strict';

const subscriptions = require('../subscriptions');
const { makeRequest, statusOf } = require('../commons');
const { ITEM_SCHEMA } = require('../ListTeamMembers/ListTeamMembers');

// A notification names the membership as `teams('..')/members('<base64 id>')`.
const RESOURCE = /teams\('([^']+)'\)\/members\('([^']+)'\)/;

module.exports = {

    ITEM_SCHEMA,

    async start(context) {

        const { teamId } = context.properties;
        if (!teamId) {
            throw new context.CancelError('Team is required!');
        }

        return subscriptions.start(context, { resource: `/teams/${teamId}/members`, changeType: 'created' });
    },

    async stop(context) {

        return subscriptions.stop(context);
    },

    async receive(context) {

        if (context.messages.timeout) {
            return subscriptions.renew(context);
        }

        if (!context.messages.webhook) {
            return;
        }

        if (subscriptions.isValidation(context)) {
            return;
        }

        const notifications = context.messages.webhook.content.data?.value || [];

        for (const notification of notifications) {

            // A notification without our secret did not come from this subscription.
            if (!await subscriptions.isOurs(context, notification)) {
                continue;
            }
            if (await subscriptions.handleLifecycle(context, notification)) {
                continue;
            }

            const match = RESOURCE.exec(notification.resource || '');
            if (!match) {
                continue;
            }
            const [, teamId, membershipId] = match;

            let member;
            try {
                ({ data: member } = await makeRequest(context, {
                    method: 'GET',
                    path: `/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(membershipId)}`
                }));
            } catch (error) {
                // The member can be removed again before the notification is processed.
                if (statusOf(error) === 404) {
                    continue;
                }
                throw error;
            }

            await context.sendJson(member, 'out');
        }

        return context.response('', 200);
    },

    async test(context) {

        // Flow Test Mode: no notification fires, so emit a current member of the team.
        const { teamId } = context.properties;
        if (!teamId) {
            throw new context.CancelError('Team is required!');
        }

        const { data } = await makeRequest(context, {
            method: 'GET',
            path: `/teams/${encodeURIComponent(teamId)}/members`,
            params: { $top: 1 }
        });
        const member = (data.value || [])[0];
        if (!member) {
            throw new Error('The team has no members to use as test data.');
        }

        return context.sendJson(member, 'out');
    }
};
