'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { createMockContext } = require('../../../../../../test/utils');

const Digest = require('../../Digest/Digest');

const MAX_TIMEOUT = 24 * 60 * 60 * 1000;
// Engine default for INPUT_QUEUE_MAX_MESSAGE_DELAY.
const ENGINE_MAX_DELAY = 31 * 24 * 60 * 60 * 1000;

function createContext({ now, properties = {}, messages = {}, entries = [] }) {

    const context = createMockContext({ properties, messages });
    // createMockContext() calls sinon.restore(), so fake the clock afterwards.
    const clock = sinon.useFakeTimers({ now: new Date(now), toFake: ['Date'] });
    entries.forEach((data, i) => context.stateAddToSet('entries', { id: `id-${i}`, data }));
    return { context, clock };
}

function timeoutMessage(content) {
    return { timeout: { content } };
}

function lastTimeout(context) {
    assert.strictEqual(context.setTimeout.callCount, 1, 'setTimeout should be called once');
    const [content, delay] = context.setTimeout.firstCall.args;
    return { content, delay };
}

describe('utils.controls.Digest scheduling', () => {

    afterEach(() => {
        sinon.restore();
    });

    it('monthly schedule across the DST fall-back: drains and schedules an intermediate timeout <= max', async () => {

        // 18 October 2026, 22:00:30 Europe/Prague (CEST). The next run, 18 November 22:00 CET,
        // is 31 days + 1 hour away because the clock goes back on 25 October.
        const { context } = createContext({
            now: '2026-10-18T20:00:30.000Z',
            properties: { dayMonth: '18', hour: '22', minute: '0', timezone: 'Europe/Prague' },
            messages: timeoutMessage({ previousDate: '2026-09-18T20:00:00.000Z' }),
            entries: [{ a: 1 }, { a: 2 }]
        });

        await Digest.receive(context);

        assert.strictEqual(context.sendJson.callCount, 1);
        assert.deepStrictEqual(context.sendJson.firstCall.args[0], { entries: [{ a: 1 }, { a: 2 }], count: 2 });
        assert.strictEqual(context.stateUnset.calledWith('entries'), true);

        const { content, delay } = lastTimeout(context);
        assert.ok(delay <= MAX_TIMEOUT, `delay ${delay} should be <= ${MAX_TIMEOUT}`);
        assert.strictEqual(content.intermediate, true);
        assert.strictEqual(content.nextDate, '2026-11-18T21:00:00.000Z');
    });

    it('dayMonth=31 started on 31 January: delay <= max, target is 31 March', async () => {

        const { context } = createContext({
            now: '2026-01-31T00:00:30.000Z',
            properties: { dayMonth: '31', hour: '0', minute: '0' }
        });

        await Digest.start(context);

        const { content, delay } = lastTimeout(context);
        assert.ok(delay <= MAX_TIMEOUT);
        assert.strictEqual(content.intermediate, true);
        assert.strictEqual(content.nextDate, '2026-03-31T00:00:00.000Z');
        assert.strictEqual(content.previousDate, '2026-01-31T00:00:30.000Z');
    });

    it('an intermediate timeout does not drain and keeps the original target date', async () => {

        const { context } = createContext({
            now: '2026-02-01T00:00:30.000Z',
            properties: { dayMonth: '31', hour: '0', minute: '0' },
            messages: timeoutMessage({
                previousDate: '2026-01-31T00:00:30.000Z',
                nextDate: '2026-03-31T00:00:00.000Z',
                intermediate: true
            }),
            entries: [{ a: 1 }]
        });

        await Digest.receive(context);

        assert.strictEqual(context.sendJson.callCount, 0);
        assert.strictEqual(context.stateUnset.called, false);
        assert.strictEqual((await context.stateGet('entries')).length, 1);

        const { content, delay } = lastTimeout(context);
        assert.strictEqual(delay, MAX_TIMEOUT);
        assert.deepStrictEqual(content, {
            previousDate: '2026-01-31T00:00:30.000Z',
            nextDate: '2026-03-31T00:00:00.000Z',
            intermediate: true
        });
    });

    it('the last intermediate step waits exactly until the target date', async () => {

        const { context } = createContext({
            now: '2026-03-30T12:00:00.000Z',
            properties: { dayMonth: '31', hour: '0', minute: '0' },
            messages: timeoutMessage({
                previousDate: '2026-01-31T00:00:30.000Z',
                nextDate: '2026-03-31T00:00:00.000Z',
                intermediate: true
            })
        });

        await Digest.receive(context);

        const { content, delay } = lastTimeout(context);
        assert.strictEqual(delay, 12 * 60 * 60 * 1000);
        assert.strictEqual(content.intermediate, undefined);
        assert.strictEqual(content.nextDate, '2026-03-31T00:00:00.000Z');
    });

    it('when the target date is reached, entries are drained and the next run is scheduled', async () => {

        const { context } = createContext({
            now: '2026-03-31T00:00:00.000Z',
            properties: { dayMonth: '31', hour: '0', minute: '0' },
            messages: timeoutMessage({
                previousDate: '2026-01-31T00:00:30.000Z',
                nextDate: '2026-03-31T00:00:00.000Z'
            }),
            entries: [{ a: 1 }]
        });

        await Digest.receive(context);

        assert.strictEqual(context.sendJson.callCount, 1);
        const { content, delay } = lastTimeout(context);
        assert.ok(delay <= MAX_TIMEOUT);
        assert.strictEqual(content.intermediate, true);
        // April has 30 days, the next 31st is in May.
        assert.strictEqual(content.nextDate, '2026-05-31T00:00:00.000Z');
        assert.strictEqual(content.previousDate, '2026-03-31T00:00:00.000Z');
    });

    it('a timeout delivered slightly early does not schedule the same run again', async () => {

        const { context } = createContext({
            now: '2026-03-30T23:59:59.500Z',
            properties: { hour: '0', minute: '0' },
            messages: timeoutMessage({
                previousDate: '2026-03-30T00:00:00.000Z',
                nextDate: '2026-03-31T00:00:00.000Z'
            })
        });

        await Digest.receive(context);

        const { content } = lastTimeout(context);
        assert.strictEqual(content.nextDate, '2026-04-01T00:00:00.000Z');
    });

    it('short schedules are a single timeout as before', async () => {

        const { context } = createContext({
            now: '2026-10-27T07:40:00.000Z',
            properties: { minute: '0' }
        });

        await Digest.start(context);

        const { content, delay } = lastTimeout(context);
        assert.strictEqual(delay, 20 * 60 * 1000);
        assert.strictEqual(content.intermediate, undefined);
        assert.strictEqual(content.nextDate, '2026-10-27T08:00:00.000Z');
    });

    it('a chain of timeouts never exceeds the engine limit and drains exactly once, at the target date', async () => {

        const properties = { dayMonth: '18', hour: '22', minute: '0', timezone: 'Europe/Prague' };
        let now = new Date('2026-10-18T20:00:30.000Z').getTime();
        let content = { previousDate: '2026-09-18T20:00:00.000Z' };
        let drains = 0;
        let firstTarget;

        for (let step = 0; step < 100; step++) {
            const { context } = createContext({
                now,
                properties,
                messages: timeoutMessage(content),
                entries: [{ step }]
            });
            await Digest.receive(context);
            drains += context.sendJson.callCount;

            const next = lastTimeout(context);
            assert.ok(next.delay <= ENGINE_MAX_DELAY, `step ${step}: delay ${next.delay} exceeds the engine limit`);
            assert.ok(next.delay <= MAX_TIMEOUT);

            if (step === 0) {
                firstTarget = next.content.nextDate;
                drains = 0; // the drain at 18 October 22:00 itself
            }
            now += next.delay;
            content = next.content;
            if (!content.intermediate) {
                break;
            }
        }

        assert.strictEqual(drains, 0, 'intermediate steps must not drain');
        assert.strictEqual(content.intermediate, undefined);
        assert.strictEqual(new Date(now).toISOString(), firstTarget);
        assert.strictEqual(firstTarget, '2026-11-18T21:00:00.000Z');

        // The final timeout drains and schedules December.
        const { context } = createContext({ now, properties, messages: timeoutMessage(content), entries: [{ a: 1 }] });
        await Digest.receive(context);
        assert.strictEqual(context.sendJson.callCount, 1);
        assert.strictEqual(lastTimeout(context).content.nextDate, '2026-12-18T21:00:00.000Z');
    });

    it('an invalid timezone is a non-retryable error', async () => {

        const { context } = createContext({
            now: '2026-10-27T07:40:00.000Z',
            properties: { minute: '0', timezone: 'Mars/Olympus' }
        });

        await assert.rejects(() => Digest.start(context), err => err instanceof context.CancelError);
    });

    it('an invalid schedule is a non-retryable error', async () => {

        const { context } = createContext({
            now: '2026-10-27T07:40:00.000Z',
            properties: { minute: '75' }
        });

        await assert.rejects(() => Digest.start(context), err => err instanceof context.CancelError);
    });
});
