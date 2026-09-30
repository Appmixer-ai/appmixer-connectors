'use strict';

const lib = require('../lib');

const MIN_LEVELS = 2;
const MAX_LEVELS = 10;

module.exports = {

    async receive(context) {

        const { state, instructions, levels, model } = context.messages.in.content;

        const content = lib.getState(context, state);
        if (!instructions) {
            throw new context.CancelError('What to score is required!');
        }

        const criteria = lib.getRows(context, levels, 'Levels').map(row => {
            // A plain array mapped from a variable arrives as `{ value }` rows.
            const description = row.description !== undefined ? row.description : row.value;
            if (description === undefined || description === null || String(description).trim() === '') {
                throw new context.CancelError('Every level needs a description.');
            }
            return description;
        });

        if (criteria.length < MIN_LEVELS || criteria.length > MAX_LEVELS) {
            throw new context.CancelError(
                `Levels must contain ${MIN_LEVELS} to ${MAX_LEVELS} rows, got ${criteria.length}.`
            );
        }

        // https://docs.typesafe.ai/primitives - score
        const { answer, model: resolvedModel, usage } = await lib.askQuestion({
            context,
            model,
            state: content,
            question: { type: 'score', instructions, criteria }
        });

        const probabilities = lib.toIndexedMap(answer.probabilities);
        const legend = lib.toIndexedMap(answer.legend);

        // The most probable level; `score` itself is the probability-weighted average.
        let level = null;
        Object.keys(probabilities).forEach(key => {
            if (level === null || probabilities[key] > probabilities[String(level)]) {
                level = Number(key);
            }
        });

        let levelDescription = null;
        if (level !== null) {
            levelDescription = legend[String(level)] !== undefined ? legend[String(level)] : (criteria[level] ?? null);
        }

        return context.sendJson({
            score: answer.score,
            level,
            levelDescription,
            confidence: answer.confidence,
            probabilities,
            model: resolvedModel,
            usage: { inputTokens: usage.input_tokens }
        }, 'out');
    }
};
