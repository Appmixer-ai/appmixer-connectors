'use strict';

const FormData = require('form-data');
const lib = require('../lib');

module.exports = {

    async receive(context) {

        const {
            model,
            file,
            language,
            prompt,
            temperature
        } = context.messages.in.content;

        // Validate required inputs
        if (!model) {
            throw new context.CancelError('Model is required!');
        }
        if (!file) {
            throw new context.CancelError('File is required!');
        }

        const fileStream = await context.getFileReadStream(file);
        const fileInfo = await context.getFileInfo(file);

        const form = new FormData();
        form.append('model', model);
        form.append('file', fileStream, {
            filename: fileInfo.filename,
            contentType: fileInfo.contentType,
            knownLength: fileInfo.length
        });

        if (language) form.append('language', language);
        if (prompt) form.append('prompt', prompt);
        if (temperature !== undefined) form.append('temperature', temperature.toString());

        const { data } = await lib.request({
            context,
            method: 'POST',
            path: '/audio/transcriptions',
            headers: form.getHeaders(),
            data: form
        });

        return context.sendJson(data, 'out');
    }
};
