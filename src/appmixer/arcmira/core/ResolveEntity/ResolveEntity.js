'use strict';

const lib = require('../../lib');

function toEntity(entity) {
    if (!entity) {
        return null;
    }
    const result = {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        slug: entity.slug,
        appearanceCount: entity.appearance_count,
        youtubeChannelId: entity.youtube_channel_id,
        description: entity.description,
        page: entity.page,
        match: entity.match
    };
    if (entity.reason !== undefined) result.reason = entity.reason;
    if (entity.evidence !== undefined) result.evidence = entity.evidence;
    return result;
}

module.exports = {

    async receive(context) {

        const { query, type, context: nameContext, maxCandidates } = context.messages.in.content;

        if (!query) {
            throw new context.CancelError('Name is required!');
        }

        const params = { q: query };
        if (type) params.type = type;
        if (nameContext) params.context = nameContext;
        if (maxCandidates) params.limit = Number(maxCandidates);

        const { data } = await lib.apiRequest(context, {
            method: 'GET',
            url: `${lib.API_BASE_URL}/entities/resolve`,
            params
        });

        const candidates = data.candidates || [];
        if (data.confidence === 'none' && !data.best && !data.suggested && !data.ask && candidates.length === 0) {
            return context.sendJson({ query }, 'notFound');
        }

        // best is set only when the name is certain (exact / single_fuzzy); suggested is an
        // assumption the API asks callers to state. Neither is chosen on "ask" (ambiguous).
        const chosen = data.best || data.suggested || null;
        const ask = data.ask || {};

        return context.sendJson({
            query: data.query,
            confidence: data.confidence,
            entityId: chosen ? chosen.id : null,
            entityName: chosen ? chosen.name : null,
            assumed: !data.best && !!data.suggested,
            best: toEntity(data.best),
            suggested: toEntity(data.suggested),
            askQuestion: ask.question || null,
            askOptions: ask.options || [],
            candidates,
            note: data.note
        }, 'out');
    }
};
