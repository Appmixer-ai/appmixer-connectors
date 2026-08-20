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

// Namespaced so a pending job can never collide with other component state.
const jobKey = (requestId) => `job-${requestId}`;

module.exports = {

    async receive(context) {

        // Deepgram delivering a finished transcript to this component's own webhook URL
        // (the default callback). The submit branch below returns only the request ID, so
        // this is where the actual transcript reaches the flow.
        if (context.messages.webhook) {

            const body = (context.messages.webhook.content || {}).data || {};
            const alternative = body.results
                && body.results.channels
                && body.results.channels[0]
                && body.results.channels[0].alternatives
                && body.results.channels[0].alternatives[0];

            // One component instance has ONE callback URL, so ten parallel jobs all report
            // back here and finish in whatever order Deepgram completes them. The submit
            // branch stashed each job's input under its request ID; replaying it here is
            // what lets a downstream component tell the transcripts apart.
            const requestId = (body.metadata || {}).request_id;
            const submitted = (requestId && await context.stateGet(jobKey(requestId))) || {};

            await context.sendJson({
                ...submitted,
                request_id: requestId,
                transcript: alternative ? alternative.transcript : '',
                metadata: body.metadata || {},
                results: body.results || {}
            }, 'done');

            if (requestId) {
                await context.stateUnset(jobKey(requestId));
            }

            // Acknowledge, otherwise Deepgram retries the callback.
            return context.response();
        }

        const input = context.messages.in.content;
        const {
            audioUrl, fileId, model, language, detectLanguage, smartFormat,
            punctuate, diarize, summarize, sentiment, topics, intents, extraParams,
            correlationId
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
            diarize: diarize ? 'true' : undefined,
            summarize: summarize ? 'true' : undefined,
            sentiment: sentiment ? 'true' : undefined,
            topics: topics ? 'true' : undefined,
            intents: intents ? 'true' : undefined,
            // Deepgram always calls this component back, so the transcript arrives on the
            // `done` port instead of being polled out of the request log (which lags by
            // minutes). Delivering it anywhere else is a downstream component's job.
            callback: context.getWebhookUrl(),
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

        // Deepgram answers the submit immediately with just { request_id }; the transcript
        // follows on the `done` port once the callback arrives.
        const requestId = (response.data || {}).request_id;
        const echo = { audioUrl, fileId, correlationId };

        if (requestId) {
            await context.stateSet(jobKey(requestId), echo);
        }

        return context.sendJson({ ...echo, request_id: requestId }, 'out');
    }
};
