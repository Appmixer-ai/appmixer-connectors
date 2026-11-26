'use strict';

const lib = require('../../lib');

const WATCHABLE = ['lockState', 'doorState', 'batteryCritical', 'serverState'];

/**
 * The devices the trigger watches and the fields it compares. Shared by tick() and test().
 * @param {object} context
 * @returns {Promise<{ smartlocks: Array, watched: string[] }>}
 */
const readDevices = async (context) => {

    const { smartlockId, watch } = context.properties || {};

    const isEmpty = watch === undefined || watch === null || watch === '' || (Array.isArray(watch) && !watch.length);
    const watched = isEmpty ? WATCHABLE : lib.normalizeMultiselectInput(watch, context, 'Watch');
    const unknown = watched.filter(field => !WATCHABLE.includes(field));
    if (unknown.length) {
        throw new context.CancelError(`Watch contains an unknown value: "${unknown[0]}".`);
    }

    const hasSmartlock = smartlockId !== undefined && smartlockId !== null && String(smartlockId).trim() !== '';
    let smartlocks;
    if (hasSmartlock) {
        const smartlock = await lib.getSmartlock(context, lib.requireNumericId(context, smartlockId, 'Smartlock'));
        smartlocks = smartlock && typeof smartlock === 'object' ? [smartlock] : [];
    } else {
        smartlocks = await lib.request(context, { path: '/smartlock' });
        if (!Array.isArray(smartlocks)) {
            throw new Error('Nuki returned an unexpected answer for the list of devices.');
        }
    }

    return { smartlocks: smartlocks.filter(smartlock => smartlock && smartlock.smartlockId !== undefined), watched };
};

module.exports = {

    // Webhooks need Nuki's Advanced API, which an API token does not have, so the devices are polled.
    // One request per check reads every device. A state that comes and goes between two checks
    // (for example "unlocking") is not seen.
    async tick(context) {

        const { initialized, devices = {} } = context.state || {};
        const { smartlocks, watched } = await readDevices(context);

        // A degraded answer (no devices, while devices are known) must not become the state.
        if (!smartlocks.length && Object.keys(devices).length) {
            return;
        }

        const next = { ...devices };

        for (const smartlock of smartlocks) {
            const key = String(smartlock.smartlockId);
            const snapshot = lib.stateSnapshot(smartlock);
            const previous = devices[key];

            // A value the device did not report this time is not a change: the last known value is kept.
            for (const field of WATCHABLE) {
                if (snapshot[field] === null && previous && previous[field] !== undefined) {
                    snapshot[field] = previous[field];
                }
            }
            next[key] = snapshot;

            // The first check, and a device seen for the first time, only record the state.
            if (!initialized || !previous) {
                continue;
            }

            // A value reported for the first time is recorded, not fired.
            const changedFields = watched.filter(field => previous[field] !== null && previous[field] !== undefined
                && previous[field] !== snapshot[field]);
            if (changedFields.length) {
                await context.sendJson({ ...smartlock, changedFields, previous }, 'out');
            }
        }

        await context.saveState({ initialized: true, devices: next });
    },

    // Flow Test Mode: emit the current state of one watched device. Read-only, no state writes.
    async test(context) {

        const { smartlocks } = await readDevices(context);

        if (!smartlocks.length) {
            throw new context.CancelError('No device found for the trigger settings. Add a device to Nuki Web and try again.');
        }

        const smartlock = smartlocks[0];

        // Nothing has changed in a test, so "previous" is the state the device reports now.
        return context.sendJson({ ...smartlock, changedFields: [], previous: lib.stateSnapshot(smartlock) }, 'out');
    }
};
