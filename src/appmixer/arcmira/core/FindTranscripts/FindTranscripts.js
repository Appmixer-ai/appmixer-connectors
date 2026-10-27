'use strict';

const lib = require('../../lib');

const ENTITY_REF = (parent) => ({
    type: 'object',
    properties: {
        id: { type: 'string', title: `${parent}.ID`, example: 'ent_10234' },
        name: { type: 'string', title: `${parent}.Name`, example: 'OpenAI' },
        type: { type: 'string', title: `${parent}.Type`, example: 'organization' }
    }
});

// One passage (TranscriptSearchChunk in https://api.arcmira.com/v1/openapi.json).
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'videoId', 'text', 'watchUrl', 'score'],
    properties: {
        id: { type: 'string', title: 'Passage ID', example: 'chk_8f2a1c' },
        videoId: { type: 'string', title: 'Video ID', example: 'dQw4w9WgXcQ' },
        videoTitle: { type: 'string', title: 'Video Title', example: 'The Future of AI Agents' },
        channelId: { type: 'string', title: 'Channel ID', example: 'UCcefcZRL2oaA_uBNeo5UOWg' },
        channelName: { type: 'string', title: 'Channel Name', example: 'Y Combinator' },
        channelPage: { type: 'string', title: 'Channel Page', example: 'https://arcmira.com/channel/y-combinator' },
        text: { type: 'string', title: 'Text', example: 'We started using OpenAI models for every support ticket last year...' },
        startSeconds: { type: 'integer', title: 'Start Seconds', example: 4787 },
        watchUrl: { type: 'string', title: 'Watch URL', example: 'https://arcmira.com/watch?v=dQw4w9WgXcQ&t=4787' },
        citeLine: { type: 'string', title: 'Citation', example: 'The Future of AI Agents, 1:19:47, Y Combinator, 2026-09-14' },
        publishedAt: { type: 'string', title: 'Published At', example: '2026-09-14T16:00:00Z' },
        source: { type: 'string', title: 'Transcript Source', example: 'creator_captions' },
        sourceLabel: { type: 'string', title: 'Transcript Source Label', example: 'Creator captions' },
        score: { type: 'number', title: 'Score', example: 12.84 },
        speakers: { type: 'array', title: 'Speakers', items: { type: 'string' }, example: ['Garry Tan'] },
        about: { type: 'array', title: 'About Entities', items: ENTITY_REF('About Entities'), example: [{ id: 'ent_10234', name: 'OpenAI', type: 'organization' }] },
        speakersBy: { type: 'array', title: 'Speaker Entities', items: ENTITY_REF('Speaker Entities'), example: [{ id: 'ent_124463', name: 'Sam Altman', type: 'person' }] }
    }
};

function toItem(chunk) {
    return {
        id: chunk.id,
        videoId: chunk.video_id,
        videoTitle: chunk.video_title,
        channelId: chunk.channel_id,
        channelName: chunk.channel_name,
        channelPage: chunk.channel_page,
        text: chunk.text,
        startSeconds: chunk.start_seconds,
        watchUrl: chunk.watch_url,
        citeLine: chunk.cite_line,
        publishedAt: chunk.published_at,
        source: chunk.source,
        sourceLabel: chunk.source_label,
        score: chunk.score,
        speakers: chunk.speakers || [],
        about: chunk.about || [],
        speakersBy: chunk.speakers_by || []
    };
}

// Multiselect sends an array; a mapped variable may be a comma-separated string.
function csv(value) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const list = Array.isArray(value) ? value : String(value).split(',');
    const items = list.map(item => String(item).trim()).filter(Boolean);
    return items.length ? items.join(',') : undefined;
}

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
            query,
            about,
            by,
            entityIds,
            channelIds,
            kind,
            after,
            before,
            source,
            maxResults,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Passages', value: 'result' });
        }

        if (!query) {
            throw new context.CancelError('Query is required!');
        }

        const params = { q: query };
        const optional = {
            about: csv(about),
            by: csv(by),
            entity_ids: csv(entityIds),
            channel_ids: csv(channelIds),
            kind: csv(kind),
            after: after || undefined,
            before: before || undefined,
            source: source || undefined,
            limit: maxResults ? Number(maxResults) : undefined
        };
        Object.entries(optional).forEach(([key, value]) => {
            if (value !== undefined) params[key] = value;
        });

        const { data } = await lib.apiRequest(context, {
            method: 'GET',
            url: `${lib.API_BASE_URL}/search`,
            params
        });

        // A plan's freshness gate or a catching-up index narrows the window; log the note so the
        // user can see why results stop where they do.
        if (data && (data.freshness || data.note)) {
            await context.log({ step: 'Search window', freshness: data.freshness, note: data.note, searchIndex: data.search_index });
        }

        const records = ((data && data.chunks) || []).map(toItem);

        if (records.length === 0) {
            return context.sendJson({ query }, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
