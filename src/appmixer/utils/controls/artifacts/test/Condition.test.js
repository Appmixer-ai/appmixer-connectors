'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { createMockContext } = require('../../../../../../test/utils');

const Condition = require('../../Condition/Condition');

function run(expression) {

    const context = createMockContext({
        messages: { in: { content: { expression: { AND: [{ OR: [expression] }] } } } }
    });
    Condition.receive(context);
    assert.strictEqual(context.sendJson.callCount, 1);
    return context.sendJson.firstCall.args[1];
}

describe('Condition Component', () => {

    afterEach(() => {
        sinon.restore();
    });

    describe('missing input', () => {

        [undefined, null].forEach(input => {

            it(`contains routes ${input} input to false`, () => {
                assert.strictEqual(run({ input, operator: 'contains', value: 'foo' }), 'false');
            });

            it(`contains routes ${input} input to false even when value is 'null'`, () => {
                assert.strictEqual(run({ input, operator: 'contains', value: 'null' }), 'false');
            });

            it(`regex routes ${input} input to false`, () => {
                assert.strictEqual(run({ input, operator: 'regex', regex: 'n' }), 'false');
            });

            ['=', '!=', '>', '>=', '<', '<=', '%', 'empty', 'notEmpty', 'range'].forEach(operator => {
                it(`${operator} does not throw on ${input} input`, () => {
                    const port = run({
                        input,
                        operator,
                        value: '1',
                        divisor: 2,
                        rangeMin: '1',
                        rangeMax: '5'
                    });
                    assert.ok(['true', 'false'].includes(port));
                });
            });
        });

        it('empty routes undefined input to true', () => {
            assert.strictEqual(run({ input: undefined, operator: 'empty' }), 'true');
        });

        it('contains routes to false when value is undefined', () => {
            assert.strictEqual(run({ input: 'foo', operator: 'contains', value: undefined }), 'false');
        });
    });

    describe('contains', () => {

        it('matches case-insensitively', () => {
            assert.strictEqual(run({ input: 'Extra Bed requested', operator: 'contains', value: 'extra bed' }), 'true');
        });

        it('does not match a missing substring', () => {
            assert.strictEqual(run({ input: 'Late arrival', operator: 'contains', value: 'bed' }), 'false');
        });

        it('matches inside a non-string input', () => {
            assert.strictEqual(run({ input: { notes: 'Crib' }, operator: 'contains', value: 'crib' }), 'true');
        });
    });

    describe('regex', () => {

        it('matches a string input', () => {
            assert.strictEqual(run({ input: 'ABC-123', operator: 'regex', regex: '^[A-Z]+-\\d+$' }), 'true');
        });

        it('throws CancelError on an invalid pattern', () => {
            assert.throws(
                () => run({ input: 'abc', operator: 'regex', regex: '(' }),
                err => err.name === 'CancelError' && err.message.includes('Invalid regular expression')
            );
        });
    });
});
