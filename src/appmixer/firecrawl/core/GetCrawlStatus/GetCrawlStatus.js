'use strict';

const lib = require('../../lib');

// Safety cap on the number of `next` pages followed when collecting crawl
// results (each page holds up to 10 MB of data).
const MAX_RESULT_PAGES = 20;

module.exports = {

    async receive(context) {

        const { jobId } = context.messages.in.content;

        if (!jobId) {
            throw new context.CancelError('Job ID is required!');
        }

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

        return context.sendJson({
            jobId,
            status: job && job.status,
            total: job && job.total,
            completed: job && job.completed,
            creditsUsed: job && job.creditsUsed,
            data: data.map(page => {
                const metadata = (page && page.metadata) || {};
                return {
                    markdown: page && page.markdown,
                    metadata: {
                        title: metadata.title,
                        sourceURL: metadata.sourceURL,
                        statusCode: metadata.statusCode
                    }
                };
            })
        }, 'out');
    }
};
