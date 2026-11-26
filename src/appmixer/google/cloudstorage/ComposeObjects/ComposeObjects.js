'use strict';

const lib = require('../lib');

// Cloud Storage composes at most 32 source objects in one request.
const MAX_SOURCES = 32;

module.exports = {

    async receive(context) {

        const { bucket, sourceObjects, destinationObject, contentType } = context.messages.in.content;

        if (!bucket) {
            throw new context.CancelError('Bucket is required!');
        }
        if (!sourceObjects || (Array.isArray(sourceObjects) && !sourceObjects.length)) {
            throw new context.CancelError('Source Object Names is required!');
        }
        if (!destinationObject) {
            throw new context.CancelError('Destination Object Name is required!');
        }

        const names = lib.normalizeMultiselectInput(sourceObjects, context, 'Source Object Names');
        if (!names.length) {
            throw new context.CancelError('Source Object Names is required!');
        }
        if (names.length > MAX_SOURCES) {
            throw new context.CancelError(`Cloud Storage composes at most ${MAX_SOURCES} source objects, got ${names.length}.`);
        }

        const body = { sourceObjects: names.map(name => ({ name })) };
        if (contentType) {
            body.destination = { contentType };
        }

        const data = await lib.request(context, {
            method: 'POST',
            path: `${lib.objectPath(context, bucket, destinationObject, 'Destination Object Name')}/compose`,
            data: body
        });

        return context.sendJson(data, 'out');
    }
};
