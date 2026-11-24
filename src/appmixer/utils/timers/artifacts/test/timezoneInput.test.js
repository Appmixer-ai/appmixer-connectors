const assert = require('assert');
const moment = require('moment-timezone');

// Issue #1485: the Timezone field must allow exactly one timezone. A `text` input with a dynamic
// source let the user pick several (the value became a comma-separated list the trigger rejects as
// 'Invalid timezone'), so the field is a single-choice `select` with a static list of options.
['Scheduler', 'SchedulerTrigger'].forEach(componentName => {

    describe(`utils.timers.${componentName} timezone input`, () => {

        const component = require(`../../${componentName}/component.json`);
        const input = component.properties.inspector.inputs.timezone;

        it('is a single-choice select with static options', () => {
            assert.strictEqual(input.type, 'select');
            assert.strictEqual(input.source, undefined);
            assert.ok(Array.isArray(input.options) && input.options.length > 0);
        });

        it('offers only timezones the trigger accepts', () => {
            const invalid = input.options.filter(option => !moment.tz.zone(option.value));
            assert.deepStrictEqual(invalid, []);
        });

        it('offers each timezone once', () => {
            const values = input.options.map(option => option.value);
            assert.strictEqual(new Set(values).size, values.length);
        });
    });
});
