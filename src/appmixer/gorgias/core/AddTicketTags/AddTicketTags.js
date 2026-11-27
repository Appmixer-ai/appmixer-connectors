'use strict';

const lib = require('../../lib');

// The answer of POST /api/tickets/{id}/tags when a name is not an existing tag of the account.
const isTagNotFound = (err) => {

    const response = err && err.response;
    if (!response || response.status !== 400) {
        return false;
    }
    const error = response.data && response.data.error;
    const msg = (error && (error.msg || error.message)) || '';
    return /tag\(s\) not found/i.test(String(msg));
};

// POST /api/tickets/{ticket_id}/tags - https://developers.gorgias.com/reference/create-ticket-tags
// Adds tags by name; tags already on the ticket stay. The endpoint accepts only existing tags
// (400 "Tag(s) not found"), so on that answer the missing tags are created with
// POST /api/tags (https://developers.gorgias.com/reference/create-tag) and the call is repeated.
module.exports = {

    async receive(context) {

        const { ticketId, tags } = context.messages.in.content;

        if (!ticketId) {
            throw new context.CancelError('Ticket ID is required!');
        }
        if (!tags || (Array.isArray(tags) && !tags.length)) {
            throw new context.CancelError('Tags is required!');
        }
        const id = lib.requireId(context, ticketId, 'Ticket ID');
        const names = lib.normalizeMultiselectInput(tags, context, 'Tags');
        if (!names.length) {
            throw new context.CancelError('Tags is required!');
        }

        const addTags = () => lib.request(context, { method: 'POST', path: `/tickets/${id}/tags`, data: { names } });

        try {
            await addTags();
        } catch (err) {
            if (!isTagNotFound(err)) {
                throw err;
            }
            await context.log({ step: 'create-missing-tags', names });
            for (const name of names) {
                try {
                    await lib.request(context, { method: 'POST', path: '/tags', data: { name } });
                } catch (createErr) {
                    // A tag that already exists is refused with a 4xx; the retry below needs it to exist only.
                    const status = createErr.response && createErr.response.status;
                    if (!(status >= 400 && status < 500 && status !== 401 && status !== 403 && status !== 429)) {
                        throw createErr;
                    }
                }
            }
            await addTags();
        }

        return context.sendJson({ ticketId: id, tags: names }, 'out');
    }
};
