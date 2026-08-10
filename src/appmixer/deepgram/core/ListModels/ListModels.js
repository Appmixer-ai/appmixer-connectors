'use strict';

const lib = require('../../lib');

// Schema for a single model item (flattened across stt + tts).
const schema = {
    category: { type: 'string', title: 'Category' },
    name: { type: 'string', title: 'Name' },
    canonical_name: { type: 'string', title: 'Canonical Name' },
    architecture: { type: 'string', title: 'Architecture' },
    languages: { type: 'array', title: 'Languages', items: { type: 'string' } },
    version: { type: 'string', title: 'Version' },
    uuid: { type: 'string', title: 'UUID' }
};

function flatten(data) {
    if (Array.isArray(data)) {
        return data;
    }
    const stt = (data.stt || []).map(m => ({ category: 'stt', ...m }));
    const tts = (data.tts || []).map(m => ({ category: 'tts', ...m }));
    return [...stt, ...tts];
}

module.exports = {

    async receive(context) {

        const { outputType = 'array' } = context.messages.in.content || {};

        if (context.properties && context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Models' });
        }

        const { data } = await lib.apiRequest(context, {
            method: 'GET',
            path: '/v1/models'
        });

        const records = flatten(data || {});

        return lib.sendArrayOutput({ context, records, outputType });
    },

    // All models (used by the STT model dropdown on Transcribe Audio).
    toSelectArray({ result }) {
        return (result || []).map(model => ({
            label: `${model.name} (${model.canonical_name})`,
            value: model.canonical_name
        }));
    },

    // TTS voices only (used by the voice dropdown on Text to Speech).
    toTtsSelectArray({ result }) {
        return (result || [])
            .filter(model => model.category === 'tts')
            .map(model => ({
                label: `${model.name} (${model.canonical_name})`,
                value: model.canonical_name
            }));
    }
};
