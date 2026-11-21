'use strict';

const lib = require('../../lib');

const FINISHED = ['Success', 'Failed', 'Cancelled'];
const LOOKBACK_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 1000;

/**
 * One page of the jobs created in the lookback window, newest first, mapped, plus whether more
 * jobs matched than were read. Shared by tick() and test().
 */
async function requestJobs(context, pageSize) {

    const { jobType } = context.properties;
    const since = new Date(Date.now() - LOOKBACK_MS).toISOString();
    const params = {
        pageSize,
        sort: 'createdAt:desc',
        filter: lib.buildFilter(context, [
            ['createdAt', 'gte', since, 'Created At'],
            ['jobType', 'eq', jobType, 'Job Type']
        ])
    };
    const { data } = await lib.apiRequest(context, { path: '/jobs', params });
    const jobs = lib.toList(data.backgroundJobs, 'backgroundJob').map(lib.mapBackgroundJob);
    const total = lib.toInt((data.pagination || {}).totalAvailable);
    return { jobs, truncated: total !== undefined && total > jobs.length };
}

function matchesStatus(context, job) {

    const { status } = context.properties;
    return status ? job.status === status : FINISHED.includes(job.status);
}

module.exports = {

    async tick(context) {

        const { jobs, truncated } = await requestJobs(context, PAGE_SIZE);
        const finished = jobs.filter(job => FINISHED.includes(job.status));

        const known = Array.isArray(context.state.known) ? new Set(context.state.known) : null;
        // A degraded answer must not become the state: the next tick would fire the whole page again.
        if (known && known.size && !jobs.length) {
            return;
        }

        if (known) {
            const { floor } = context.state;
            const newJobs = finished.filter(job => !known.has(job.id)
                && (!floor || job.createdAt > floor)
                && matchesStatus(context, job));
            for (const job of newJobs) {
                await context.sendJson(job, 'out');
            }
        }

        const oldest = jobs[jobs.length - 1];
        await context.saveState({
            // The first tick only records the jobs that are already finished.
            known: finished.map(job => job.id),
            floor: oldest && truncated ? oldest.createdAt : null
        });
    },

    async test(context) {

        const { jobs } = await requestJobs(context, 100);
        const job = jobs.find(item => matchesStatus(context, item));
        if (!job) {
            throw new context.CancelError('No job matching the trigger settings finished in the last 24 hours. '
                + 'Refresh an extract in Tableau to see a real job.');
        }
        return context.sendJson(job, 'out');
    }
};
