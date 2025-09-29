'use strict';

const lib = require('../lib');

/**
 * OnStart component reacts on the 'start' message only. It triggers when the flow starts.
 * @extends {Component}
 */
module.exports = {

    /**
     * @param {Context} context
     */
    receive(context) {

        const { in6 } = context.messages.in.content;
        const { p1 } = context.properties;

        // Normalize multiselect inputs to array format
        const normalizedIn6 = in6 ?
            lib.normalizeMultiselectInput(in6, context, 'Multiselect') : [];
        const normalizedP1 = p1 ?
            lib.normalizeMultiselectInput(p1, context, 'Multiselect properties') : [];

        return context.sendJson({
            out1value: new Date(),
            normalizedIn6,
            normalizedP1
        }, 'out');
    }
};
