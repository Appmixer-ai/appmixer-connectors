'use strict';

/**
 * Normalize a single answer item. If the `answer` field is an object keyed by
 * numeric strings (e.g. matrix fields: { "1": [...], "2": [...] }), convert it
 * to an ordered array so it can be iterated in a flow.
 */
function normalizeAnswerItem(item) {
    if (!item || typeof item !== 'object') return item;
    const answer = item.answer;
    if (answer && typeof answer === 'object' && !Array.isArray(answer)) {
        const keys = Object.keys(answer);
        if (keys.length > 0 && keys.every(k => /^\d+$/.test(k))) {
            return {
                ...item,
                answer: keys.sort((a, b) => parseInt(a) - parseInt(b)).map(k => answer[k])
            };
        }
    }
    return item;
}

module.exports = {

    receive: async function(context) {

        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Submission ID is required!');
        }

        const regionPrefix = context.auth.regionPrefix || 'api';

        // https://api.jotform.com/docs/#submission-id
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://${regionPrefix}.jotform.com/submission/${id}`,
            headers: {
                'APIKEY': context.auth.apiKey
            }
        });

        const response = {
            ...data,
            content: {
                ...data.content,
                answersList: Object.values(data.content.answers || {}).map(normalizeAnswerItem)
            }
        };

        return context.sendJson(response, 'out');
    }
};
