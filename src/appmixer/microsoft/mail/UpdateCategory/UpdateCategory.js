'use strict';

const { makeRequest } = require('../commons');
const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { emailId, categories } = context.messages.in.content;

        if (!emailId) {
            throw new context.CancelError('Email ID is required');
        }

        // Normalize categories to array format for multiselect field
        const normalizedCategories = categories ?
            lib.normalizeMultiselectInput(categories, context, 'Categories') : [];

        const { data } = await makeRequest(context, {
            path: `/me/messages/${emailId}`,
            method: 'PATCH',
            data: {
                categories: normalizedCategories
            }
        });
        return context.sendJson({ result: data }, 'out');
    }
};

