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
            punctuate, paragraphs, utterances, diarize, summarize, sentiment,
            topics, intents, extraParams
        } = input;

        if (!audioUrl && !fileId) {
            throw new context.CancelError('Provide either an Audio URL or a File to transcribe.');
        }

        const params = lib.cleanParams({
            model: model || 'nova-3',
            language,
            detect_language: detectLanguage ? 'true' : undefined,
            smart_format: smartFormat ? 'true' : undefined,
            punctuate: punctuate ? 'true' : undefined,
            paragraphs: paragraphs ? 'true' : undefined,
            utterances: utterances ? 'true' : undefined,
            diarize: diarize ? 'true' : undefined,
            summarize: summarize ? 'true' : undefined,
            sentiment: sentiment ? 'true' : undefined,
            topics: topics ? 'true' : undefined,
            intents: intents ? 'true' : undefined,
            ...kvToObj(extraParams)
        });

        let data;
        const headers = {};

        if (audioUrl) {
            headers['Content-Type'] = 'application/json';
            data = { url: audioUrl };
        } else {
            // Stream the file directly to Deepgram (recordings can be large, up to 2 GB).
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

        const result = response.data || {};
        const transcript = result.results
            && result.results.channels
            && result.results.channels[0]
            && result.results.channels[0].alternatives
            && result.results.channels[0].alternatives[0]
            ? result.results.channels[0].alternatives[0].transcript
            : '';

        return context.sendJson({
            transcript,
            metadata: result.metadata || {},
            results: result.results || {}
        }, 'out');
    }
};
