'use strict';

// Each declares `webhook: true` because ContinueEach wakes a sequential loop through the webhook URL of
// Each (see EachSequential.js). The engine stores a continuity scope for EVERY message that enters a
// component with an input port and `webhook: true`, whatever the mode - but only a sequential loop
// ever gets the webhook delivery that reads it. A continuity scope lives 100 days by default
// (GARBAGE_COLLECTOR_CONTINUITY_SCOPES_TTL) and, while it lives, keeps every message scope it refers to
// from being garbage collected. For a parallel or delayed Each that is pure storage.
//
// So Each sets the lifetime of the continuity scope of every `in` message with context.setMaxWait():
//   - a loop that does not wait for ContinueEach (parallel, delayed, empty or invalid list): now, so
//     the continuity-scope GC deletes it on its next run;
//   - a sequential loop: until the loop is over at the latest - every item takes at most the item
//     timeout plus the delay before it - plus a margin.
//
// Engines that can only extend the lifetime ignore an earlier date, so this is safe on them: they keep
// the default TTL until they get the engine change that lets setMaxWait() shorten it.

// Margin on top of the computed end of a sequential loop: the engine delivers timeouts and webhooks
// with some lag, and the loop must never lose its scope while it still runs.
const MAX_WAIT_MARGIN = 60 * 60 * 1000;

/**
 * Set when the continuity scope of the message being processed may be deleted. Best effort: a failure
 * only leaves the engine's default lifetime in place, it must not fail or retry the loop.
 * @param {Object} context - Appmixer context
 * @param {Date} expiresAt
 */
async function setExpiry(context, expiresAt) {

    if (typeof context.setMaxWait !== 'function') {
        return;
    }
    try {
        // Always a Date: setMaxWait() takes a plain number as milliseconds FROM NOW, not as a timestamp.
        await context.setMaxWait(expiresAt);
    } catch (err) {
        if (typeof context.log === 'function') {
            await context.log({
                step: 'continuity-scope',
                message: `Each: could not set the lifetime of the continuity scope: ${err.message}`
            });
        }
    }
}

/**
 * The loop does not wait for ContinueEach: its continuity scope is never read, let it go now.
 * @param {Object} context - Appmixer context
 */
function release(context) {

    return setExpiry(context, new Date());
}

/**
 * Keep the continuity scope of a sequential loop for as long as the loop can run.
 * @param {Object} context - Appmixer context
 * @param {Object} loop
 * @param {number} loop.count - Number of items
 * @param {number} loop.itemTimeout - Item timeout in seconds
 * @param {number} loop.delay - Extra delay before each next item in milliseconds
 */
function keepForLoop(context, { count, itemTimeout, delay }) {

    const loopDuration = count * (itemTimeout * 1000 + (delay || 0));
    return setExpiry(context, new Date(Date.now() + loopDuration + MAX_WAIT_MARGIN));
}

module.exports = {
    MAX_WAIT_MARGIN,
    release,
    keepForLoop
};
