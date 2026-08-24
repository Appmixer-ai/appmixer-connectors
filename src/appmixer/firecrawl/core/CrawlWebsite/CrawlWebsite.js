'use strict';

const lib = require('../../lib');

// Appmixer will not schedule a continuation shorter than one minute, so that is
// both the default and the floor for the polling interval.
const MIN_POLL_INTERVAL_SECONDS = 60;

// Safety cap on the number of `next` pages followed when collecting crawl
// results (each page holds up to 10 MB of data).
const MAX_RESULT_PAGES = 20;

/**
 * Fetch a crawl job's status and, when it is completed, follow the `next`
 * pagination links to collect the full result set.
 * @param {object} context Appmixer component context
 * @param {string} jobId
 * @returns {Promise<object>} the job status payload with fully collected data
 */
async function getCrawlJob(context, jobId) {

    const job = await lib.makeRequest({
        context,
        method: 'GET',
        path: `/v2/crawl/${jobId}`
    });

    const data = (job && job.data) || [];
    let next = job && job.next;
    let pagesFollowed = 0;

    while (next && job.status === 'completed' && pagesFollowed < MAX_RESULT_PAGES) {
        // `next` is an absolute URL on the Firecrawl API host.
        const page = await lib.makeRequest({
            context,
            path: String(next).replace(lib.API_BASE_URL, '')
        });
        data.push(...((page && page.data) || []));
        next = page && page.next;
        pagesFollowed++;
    }

    return { ...job, data };
}

/**
 * Reduce a scraped page to the fields declared in the output port schema so
 * flows do not carry the full raw payload of every page.
 * @param {object} page
 * @returns {object}
 */
function toPageOutput(page) {

    const metadata = (page && page.metadata) || {};
    return {
        markdown: page && page.markdown,
        metadata: {
            title: metadata.title,
            sourceURL: metadata.sourceURL,
            statusCode: metadata.statusCode
        }
    };
}

module.exports = {

    async receive(context) {

        // Polling continuation scheduled by a previous invocation. Doing this
        // with context.setTimeout instead of sleeping in-process keeps the
        // worker free and survives the engine's cap on a single execution.
        if (context.messages.timeout) {

            const { jobId, deadline, pollIntervalMs } = context.messages.timeout.content;

            const job = await getCrawlJob(context, jobId);

            if (job && job.status === 'completed') {
                return context.sendJson({
                    jobId,
                    status: job.status,
                    total: job.total,
                    completed: job.completed,
                    creditsUsed: job.creditsUsed,
                    data: (job.data || []).map(toPageOutput)
                }, 'out');
            }

            if (job && job.status === 'failed') {
                throw new context.CancelError(`Firecrawl crawl ${jobId} failed.`);
            }

            if (Date.now() >= deadline) {
                const status = (job && job.status) || 'unknown';
                throw new context.CancelError(
                    `Crawl ${jobId} did not complete in time (status: ${status}). `
                    + 'Use the Get Crawl Status component with this job id to fetch the result once it is done.'
                );
            }

            return context.setTimeout({ jobId, deadline, pollIntervalMs }, pollIntervalMs);
        }

        const {
            url,
            maxPages,
            maxDiscoveryDepth,
            includePaths,
            excludePaths,
            crawlEntireDomain,
            allowSubdomains,
            onlyMainContent,
            wait,
            pollingTimeout
        } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('URL is required!');
        }

        const scrapeOptions = { formats: ['markdown'] };
        // The API defaults to true; only send the flag when the user turned it
        // off. Toggle values can reach the component as the string 'false'.
        if (onlyMainContent === false || onlyMainContent === 'false') {
            scrapeOptions.onlyMainContent = false;
        }

        const payload = {
            url,
            limit: Number(maxPages) > 0 ? Number(maxPages) : 100,
            scrapeOptions
        };

        if (Number(maxDiscoveryDepth) > 0) {
            payload.maxDiscoveryDepth = Number(maxDiscoveryDepth);
        }
        const include = lib.parseList(includePaths);
        if (include.length) {
            payload.includePaths = include;
        }
        const exclude = lib.parseList(excludePaths);
        if (exclude.length) {
            payload.excludePaths = exclude;
        }
        if (crawlEntireDomain === true || crawlEntireDomain === 'true') {
            payload.crawlEntireDomain = true;
        }
        if (allowSubdomains === true || allowSubdomains === 'true') {
            payload.allowSubdomains = true;
        }

        const created = await lib.makeRequest({
            context,
            method: 'POST',
            path: '/v2/crawl',
            data: payload
        });

        const jobId = created && created.id;
        if (!jobId) {
            throw new context.CancelError('Firecrawl did not return a crawl job id.');
        }

        // When the user opts out of waiting, return the created job reference
        // and let Get Crawl Status fetch the result later.
        if (wait === false || wait === 'false') {
            return context.sendJson({ jobId, status: 'scraping' }, 'out');
        }

        const timeoutSeconds = Number(pollingTimeout) > 0 ? Number(pollingTimeout) : 1800;
        const pollIntervalSeconds = Math.max(
            Number(context.config && context.config.pollIntervalSeconds) || MIN_POLL_INTERVAL_SECONDS,
            MIN_POLL_INTERVAL_SECONDS
        );

        return context.setTimeout({
            jobId,
            deadline: Date.now() + timeoutSeconds * 1000,
            pollIntervalMs: pollIntervalSeconds * 1000
        }, pollIntervalSeconds * 1000);
    }
};
