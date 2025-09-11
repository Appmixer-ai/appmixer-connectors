const assert = require('assert');
const sinon = require('sinon');
const lib = require('../../lib');

describe('google.drive webhook components', () => {

    let context;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Mock context object
        context = {
            auth: { accessToken: 'test-token', clientId: 'test-id', clientSecret: 'test-secret' },
            properties: {},
            componentId: 'test-component',
            lock: sandbox.stub(),
            loadState: sandbox.stub().returns({ startPageToken: 'test-token', processedFiles: [] }),
            stateSet: sandbox.stub(),
            stateGet: sandbox.stub(),
            stateUnset: sandbox.stub(),
            sendJson: sandbox.stub(),
            log: sandbox.stub()
        };

        // Mock lock object
        const mockLock = {
            extend: sandbox.stub(),
            unlock: sandbox.stub()
        };
        context.lock.returns(mockLock);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#checkMonitoredFiles fileTypesRestriction normalization', () => {

        it('should normalize string fileTypesRestriction to array', async () => {
            const result = lib.normalizeMultiselectInput('image/,video/');
            assert.deepStrictEqual(result, ['image/', 'video/']);
        });

        it('should normalize array fileTypesRestriction (pass through)', async () => {
            const result = lib.normalizeMultiselectInput(['image/', 'video/']);
            assert.deepStrictEqual(result, ['image/', 'video/']);
        });

        it('should handle null fileTypesRestriction', async () => {
            const result = lib.normalizeMultiselectInput(null);
            assert.deepStrictEqual(result, []);
        });

        it('should handle undefined fileTypesRestriction', async () => {
            const result = lib.normalizeMultiselectInput(undefined);
            assert.deepStrictEqual(result, []);
        });

    });

});
