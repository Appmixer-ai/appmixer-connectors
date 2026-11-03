'use strict';

const Parser = require('rss-parser');

// Fields rss-parser fills with the full article body. Feeds that publish whole articles
// (newsletters, podcasts) easily exceed the engine's message size limit with them.
const FULL_CONTENT_FIELDS = ['content', 'content:encoded', 'content:encodedSnippet', 'summary'];
const SNIPPET_MAX_LENGTH = 500;

const parsePositiveNumber = (context, value, label) => {

    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) {
        throw new context.CancelError(`${label} must be a positive number.`);
    }
    return number;
};

const itemTime = (item) => Date.parse(item.isoDate || item.pubDate || '');

module.exports = {

    async receive(context) {

        const { url, maxAgeHours, maxItems, includeContent } = context.messages.in.content;

        const maxAge = parsePositiveNumber(context, maxAgeHours, 'Max Age (hours)');
        const limit = parsePositiveNumber(context, maxItems, 'Max Items');

        const parser = new Parser();
        const feed = await parser.parseURL(url);
        let items = feed.items || [];

        if (maxAge !== undefined) {
            const since = Date.now() - maxAge * 3600 * 1000;
            // An item without a parseable date cannot be shown to be recent, so it is left out.
            items = items.filter(item => itemTime(item) >= since);
        }

        if (limit !== undefined) {
            items = items.slice(0, Math.floor(limit));
        }

        if (includeContent === false) {
            items = items.map(item => {
                const trimmed = { ...item };
                // Atom entries may carry their description only in `summary`.
                if (!trimmed.contentSnippet && typeof trimmed.summary === 'string') {
                    trimmed.contentSnippet = trimmed.summary.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                }
                FULL_CONTENT_FIELDS.forEach(field => delete trimmed[field]);
                if (typeof trimmed.contentSnippet === 'string'
                    && trimmed.contentSnippet.length > SNIPPET_MAX_LENGTH) {
                    trimmed.contentSnippet = trimmed.contentSnippet.slice(0, SNIPPET_MAX_LENGTH) + '…';
                }
                return trimmed;
            });
        }

        return await context.sendJson({ feed: { ...feed, items } }, 'out');
    }
};
