'use strict';

const lib = require('../../lib');

function kvToObj(arr) {
    if (!Array.isArray(arr)) return {};
    const out = {};
    for (const row of arr) {
        if (!row || typeof row !== 'object') continue;
        const key = row.key;
        if (typeof key !== 'string' || key.length === 0) continue;
        out[key] = row.value;
    }
    return out;
}

module.exports = {

    async receive(context) {

        const input = context.messages.in.content;
        const {
            audioUrl, fileId, model, language, detectLanguage, smartFormat,
            punctuate, diarize, summarize, sentiment, topics, intents,
            callback, callbackMethod, extraParams
        } = input;

        if (!audioUrl && !fileId) {
            throw new context.CancelError('Provide either an Audio URL or a File to transcribe.');
        }

        if (!callback) {
            throw new context.CancelError('A Callback URL is required. Deepgram POSTs the finished transcript to this URL. Only ports 80, 443, 8080 and 8443 are permitted.');
        }

        const params = lib.cleanParams({
            model: model || 'nova-3',
            language,
            detect_language: detectLanguage ? 'true' : undefined,
            smart_format: smartFormat ? 'true' : undefined,
            punctuate: punctuate ? 'true' : undefined,
            diarize: diarize ? 'true' : undefined,
            summarize: summarize ? 'true' : undefined,
            sentiment: sentiment ? 'true' : undefined,
            topics: topics ? 'true' : undefined,
            intents: intents ? 'true' : undefined,
            callback,
            callback_method: callbackMethod,
            ...kvToObj(extraParams)
        });

        let data;
        const headers = {};

        if (audioUrl) {
            headers['Content-Type'] = 'application/json';
            data = { url: audioUrl };
        } else {
            const fileInfo = await context.getFileInfo(fileId);
            headers['Content-Type'] = lib.guessAudioContentType(fileInfo && fileInfo.filename);
            data = await context.getFileReadStream(fileId);
        }

        const response = await lib.apiRequest(context, {
            method: 'POST',
            path: '/v1/listen',
            params,
            headers,
            data
        });

        // With a callback set, Deepgram responds immediately with { request_id }.
        return context.sendJson({ request_id: (response.data || {}).request_id }, 'out');
    }
};
