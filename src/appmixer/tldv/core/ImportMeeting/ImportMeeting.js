'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name, url, happenedAt, participants, dryRun } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }
        if (!url) {
            throw new context.CancelError('URL is required!');
        }

        const body = { name, url };

        if (happenedAt) {
            body.happenedAt = happenedAt;
        }

        // Accept a comma/newline separated list of participant emails.
        if (participants) {
            const emails = String(participants)
                .split(/[\n,]/)
                .map((email) => email.trim())
                .filter(Boolean);
            if (emails.length) {
                body.participants = emails;
            }
        }

        if (dryRun === true) {
            body.dryRun = true;
        }

        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: `/${lib.API_VERSION}/meetings/import`,
            data: body
        });

        return context.sendJson(data, 'out');
    }
};
