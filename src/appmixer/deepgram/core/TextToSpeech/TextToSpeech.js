'use strict';

const pathModule = require('path');
const lib = require('../../lib');

const EXTENSION_BY_ENCODING = {
    mp3: 'mp3',
    opus: 'opus',
    flac: 'flac',
    aac: 'aac',
    linear16: 'wav',
    mulaw: 'wav',
    alaw: 'wav'
};

module.exports = {

    async receive(context) {

        const { text, model, encoding, container, sampleRate, bitRate, fileName } = context.messages.in.content;

        if (!text) {
            throw new context.CancelError('Text is required!');
        }

        if (text.length > 2000) {
            throw new context.CancelError(`Text is ${text.length} characters. Deepgram Text to Speech accepts at most 2000 characters per request.`);
        }

        const params = lib.cleanParams({
            model: model || 'aura-2-thalia-en',
            encoding: encoding || 'mp3',
            container,
            sample_rate: sampleRate,
            bit_rate: bitRate
        });

        const response = await lib.apiRequest(context, {
            method: 'POST',
            path: '/v1/speak',
            params,
            headers: { 'Content-Type': 'application/json' },
            data: { text },
            responseType: 'arraybuffer'
        });

        const buffer = Buffer.isBuffer(response.data) ? response.data : Buffer.from(response.data);
        const contentType = (response.headers && (response.headers['content-type'] || response.headers['Content-Type'])) || 'audio/mpeg';

        const ext = EXTENSION_BY_ENCODING[(encoding || 'mp3').toLowerCase()] || 'mp3';
        const name = fileName || `deepgram-speech-${context.componentId}.${ext}`;

        const savedFile = await context.saveFileStream(pathModule.normalize(name), buffer);

        return context.sendJson({
            fileId: savedFile.fileId,
            fileName: name,
            contentType,
            characterCount: text.length
        }, 'out');
    }
};
