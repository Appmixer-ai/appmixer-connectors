'use strict';

const lib = require('../../lib');

/**
 * The newest documents of the workspace, newest created first (one page, at most 100).
 * @param {object} context
 * @param {number} [count]
 * @returns {Promise<object[]>}
 */
const fetchNewest = (context, count) => lib.listDocuments(context, {
    order_by: '-date_created',
    ...(count ? { count } : {})
});

/**
 * Compare the newest page with the previous tick. The first tick only records what exists.
 * @param {object} state { known: string[], floor: string|null } or empty on the first tick
 * @param {object[]} documents newest created first
 * @returns {{ newItems: object[], state: object|null }} state null: keep the saved state
 */
const diff = (state, documents) => {

    const known = Array.isArray(state && state.known) ? new Set(state.known) : null;

    // A degraded (empty) answer must not become the state: the next tick would re-fire the page.
    if (known && known.size && !documents.length) {
        return { newItems: [], state: null };
    }

    const floor = state && state.floor;
    const newItems = known
        ? documents.filter(doc => !known.has(doc.id) && (!floor || doc.date_created > floor))
        : [];

    // More documents than one page: older ones can slide onto the page when newer ones are
    // deleted, so only documents newer than the oldest one read count as new.
    const oldest = documents[documents.length - 1];
    const truncated = documents.length >= lib.PAGE_SIZE;
    return {
        newItems,
        state: {
            known: documents.map(doc => doc.id),
            floor: oldest && truncated ? oldest.date_created : null
        }
    };
};

module.exports = {

    diff,

    async tick(context) {

        const documents = await fetchNewest(context);
        const { newItems, state } = diff(context.state, documents);

        // Oldest first, so the flow sees them in creation order.
        for (const doc of newItems.reverse()) {
            await context.sendJson(doc, 'out');
        }
        if (state) {
            await context.saveState(state);
        }
    },

    // Flow Test Mode: the most recently created document. Read-only.
    async test(context) {

        const [latest] = await fetchNewest(context, 1);
        if (!latest) {
            throw new context.CancelError('No documents in this PandaDoc workspace yet. Create a document and test again.');
        }
        return context.sendJson(latest, 'out');
    }
};
