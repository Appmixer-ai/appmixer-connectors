'use strict';
/* eslint-disable no-underscore-dangle */

// google.spreadsheets.NewRow: issue #2949. A non-string "Index Column" (index) property made
// every tick fail with "context.properties.index.toUpperCase is not a function".

const assert = require('assert');
const path = require('path');
const Module = require('module');
const sinon = require('sinon');
const { createMockContext } = require('../../utils');

const COMPONENT = path.join(__dirname, '../../../src/appmixer/google/spreadsheets/NewRow/NewRow.js');

describe('google.spreadsheets.NewRow', function() {

    let originalLoad;
    let getStub;
    let NewRow;

    before(function() {
        // The Google connector's dependencies are installed per connector, not at the repo root.
        // Replace them with small fakes: values.get uses the node callback style.
        getStub = sinon.stub();
        const fakes = {
            googleapis: {
                sheets: () => ({ spreadsheets: { values: { get: getStub } } }),
                auth: { OAuth2: function OAuth2() {} }
            },
            'google-auth-library': { OAuth2Client: function OAuth2Client() {} },
            'google-spreadsheet': { GoogleSpreadsheet: function GoogleSpreadsheet() {} },
            '@fast-csv/parse': { parse: () => {} },
            bluebird: {
                promisify: (fn, { context } = {}) => (...args) => new Promise((resolve, reject) => {
                    fn.call(context, ...args, (err, res) => err ? reject(err) : resolve(res));
                }),
                map: (items, fn) => Promise.all(items.map(fn))
            }
        };
        originalLoad = Module._load;
        Module._load = function(request, ...rest) {
            if (Object.prototype.hasOwnProperty.call(fakes, request)) return fakes[request];
            return originalLoad.call(this, request, ...rest);
        };
        NewRow = require(COMPONENT);
    });

    after(function() {
        Module._load = originalLoad;
        // Drop the modules loaded with fakes so no other test gets them from the cache.
        const spreadsheets = path.dirname(path.dirname(COMPONENT));
        Object.keys(require.cache)
            .filter(file => file.startsWith(path.dirname(spreadsheets)))
            .forEach(file => delete require.cache[file]);
    });

    let context;

    beforeEach(function() {
        getStub.reset();
        getStub.callsFake((params, cb) => cb(null, { values: [['id', '1', '2']] }));
        context = createMockContext();
        context.auth = { clientId: 'id', clientSecret: 'secret', accessToken: 'token' };
        context.properties = { sheetId: 'sheet-1', worksheetId: '0/Sheet1', index: 'a' };
        context.state = {};
        context.saveState = sinon.stub().resolves();
        context.sendJson = sinon.stub().resolves();
    });

    const assertInvalidIndex = async (promise, raw) => {
        await assert.rejects(promise, err => {
            assert.strictEqual(err.name, 'CancelError');
            assert(err.message.includes('Invalid "Index Column" value'), err.message);
            assert(err.message.includes(JSON.stringify(raw)), err.message);
            return true;
        });
        assert.strictEqual(getStub.callCount, 0, 'no Google API call is made');
    };

    describe('tick', function() {

        it('upper-cases a lower-case column letter in the requested range', async function() {
            await NewRow.tick(context);

            assert.strictEqual(getStub.firstCall.args[0].range, 'Sheet1!A1:A');
            assert(context.saveState.calledOnceWith({ known: ['id', '1', '2'] }));
        });

        it('trims surrounding whitespace', async function() {
            context.properties.index = '  aa ';
            await NewRow.tick(context);

            assert.strictEqual(getStub.firstCall.args[0].range, 'Sheet1!AA1:AA');
        });

        [{ foo: 1 }, ['A'], '1A', '', 'ABCD', 5, null, undefined].forEach(raw => {
            it(`fails with a descriptive CancelError for ${JSON.stringify(raw)}`, async function() {
                context.properties.index = raw;
                await assertInvalidIndex(NewRow.tick(context), raw);
            });
        });
    });

    describe('test', function() {

        it('uses the same normalised column', async function() {
            context.properties.index = 'b';
            await NewRow.test(context);

            assert.strictEqual(getStub.firstCall.args[0].range, 'Sheet1!B1:B');
            assert(context.sendJson.calledOnce);
        });

        [{ value: 'A' }, ['A'], '1A'].forEach(raw => {
            it(`fails with a descriptive CancelError for ${JSON.stringify(raw)}`, async function() {
                context.properties.index = raw;
                await assertInvalidIndex(NewRow.test(context), raw);
            });
        });
    });
});
