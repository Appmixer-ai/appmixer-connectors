'use strict';

const lib = require('../../lib');

module.exports = {

    async tick(context) {

        const { meetingType } = context.properties;
        const baseParams = {};
        if (meetingType) {
            baseParams.meetingType = meetingType;
        }

        // First run: establish a baseline watermark so we only emit meetings that appear
        // after the flow started, instead of replaying the whole history.
        if (context.state.since === undefined) {
            await context.saveState({ since: new Date().toISOString(), known: [] });
            return;
        }

        const from = context.state.since;
        const meetings = await lib.fetchAllMeetings(context, { ...baseParams, from });

        if (!meetings.length) {
            return;
        }

        // The sort order of GET /meetings is undocumented and there is no sort parameter,
        // so we order deterministically by happenedAt ourselves.
        meetings.sort((a, b) => new Date(a.happenedAt).getTime() - new Date(b.happenedAt).getTime());

        const known = new Set(Array.isArray(context.state.known) ? context.state.known : []);
        const fresh = meetings.filter((meeting) => meeting && meeting.id && !known.has(meeting.id));

        for (const meeting of fresh) {
            await context.sendJson(meeting, 'out');
        }

        // Advance the watermark to the newest happenedAt seen, and remember the ids sitting
        // exactly on that boundary so the inclusive `from` window doesn't re-emit them.
        const maxHappenedAt = meetings[meetings.length - 1].happenedAt;
        const boundaryIds = meetings
            .filter((meeting) => meeting.happenedAt === maxHappenedAt)
            .map((meeting) => meeting.id);

        await context.saveState({ since: maxHappenedAt || from, known: boundaryIds });
    },

    // Flow Test Mode: emit the most recent meeting without touching state.
    async test(context) {

        const data = await lib.fetchMeetingsPage(context, { limit: lib.MAX_PAGE_SIZE, page: 1 });
        const meetings = Array.isArray(data.results) ? data.results : [];

        if (!meetings.length) {
            throw new context.CancelError('No meetings available to build a test example.');
        }

        meetings.sort((a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime());

        return context.sendJson(meetings[0], 'out');
    }
};
