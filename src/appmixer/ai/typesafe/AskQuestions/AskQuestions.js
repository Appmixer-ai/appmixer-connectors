'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { state, questions, model } = context.messages.in.content;

        const content = lib.getState(context, state);

        let parsed = questions;
        if (typeof parsed === 'string') {
            if (!parsed.trim()) {
                throw new context.CancelError('Questions is required!');
            }
            try {
                parsed = JSON.parse(parsed);
            } catch (error) {
                throw new context.CancelError('Questions must be valid JSON.');
            }
        }
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Object.keys(parsed).length) {
            throw new context.CancelError(
                'Questions must be a JSON object mapping each question id to a question, for example '
                + '{"is_urgent": {"type": "noul", "instructions": "The message is urgent"}}.'
            );
        }

        // https://docs.typesafe.ai/api - questions are evaluated independently and in parallel.
        const { data } = await lib.request({
            context,
            method: 'POST',
            path: '/v1/systemone',
            data: {
                state: content,
                model: model || lib.DEFAULT_MODEL,
                questions: parsed
            }
        });

        const usage = data.usage || {};

        return context.sendJson({
            answers: data.answers || {},
            model: data.model,
            usage: {
                inputTokens: usage.input_tokens,
                outputTokens: usage.output_tokens
            }
        }, 'out');
    }
};
