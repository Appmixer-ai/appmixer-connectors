'use strict';

const lib = require('../../lib');

const POLL_INTERVAL_MS = 5000;

function parseCsv(value) {
    if (!value) {
        return [];
    }
    return String(value)
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
}

module.exports = {
    async receive(context) {

        const {
            audioUrl,
            diarization,
            translation,
            translationTargetLanguages,
            summarization,
            subtitles,
            sentimentAnalysis,
            piiRedaction,
            languages,
            wait,
            pollingTimeout
        } = context.messages.in.content;

        if (!audioUrl) {
            throw new context.CancelError('Audio URL is required!');
        }

        const payload = { audio_url: audioUrl };

        if (diarization) {
            payload.diarization = true;
        }
        if (translation) {
            payload.translation = true;
            const targets = parseCsv(translationTargetLanguages);
            if (targets.length) {
                payload.translation_config = { target_languages: targets };
            }
        }
        if (summarization) {
            payload.summarization = true;
        }
        if (subtitles) {
            payload.subtitles = true;
        }
        if (sentimentAnalysis) {
            payload.sentiment_analysis = true;
        }
        if (piiRedaction) {
            payload.pii_redaction = true;
        }
        const langs = parseCsv(languages);
        if (langs.length) {
            payload.language_config = { languages: langs };
        }

        // Gladia returns 201 with the job id and a result_url to poll.
        const created = await lib.makeRequest({
            context,
            method: 'POST',
            path: '/v2/pre-recorded',
            data: payload
        });

        const jobId = created && created.id;
        if (!jobId) {
            throw new context.CancelError('Gladia did not return a transcription job id.');
        }

        // When the user opts out of waiting, return the created job reference and
        // let a separate Get Transcription / trigger fetch the result later.
        if (wait === false) {
            return context.sendJson(created, 'out');
        }

        const timeoutSeconds = Number(pollingTimeout) > 0 ? Number(pollingTimeout) : 300;
        const deadline = Date.now() + timeoutSeconds * 1000;

        let job = null;
        while (Date.now() < deadline) {
            await lib.sleep(POLL_INTERVAL_MS);
            job = await lib.makeRequest({
                context,
                method: 'GET',
                path: `/v2/pre-recorded/${jobId}`
            });
            if (job && (job.status === 'done' || job.status === 'error')) {
                break;
            }
        }

        if (job && job.status === 'error') {
            throw new context.CancelError(
                `Gladia transcription ${jobId} failed: ${JSON.stringify(job.error_code || job.error || 'unknown error')}`
            );
        }

        if (!job || job.status !== 'done') {
            const status = (job && job.status) || 'unknown';
            throw new context.CancelError(
                `Transcription ${jobId} did not complete within ${timeoutSeconds} seconds (status: ${status}). `
                + 'Use the Get Transcription component with this job id to fetch the result once it is done.'
            );
        }

        return context.sendJson(job, 'out');
    }
};
