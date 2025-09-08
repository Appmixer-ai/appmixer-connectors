const assert = require('assert');
const sinon = require('sinon');
const lib = require('../../../src/appmixer/google/drive/lib');

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

        // Mock Google API
        const mockDrive = {
            changes: {
                list: sandbox.stub().returns({
                    data: {
                        changes: [],
                        newStartPageToken: 'new-token'
                    }
                })
            }
        };

        // Mock lib functions
        sandbox.stub(lib, 'getOauth2Client').returns({});
        sandbox.stub(lib, 'findSubfolders').returns([]);

        // Mock google module
        const googleMock = {
            drive: sandbox.stub().returns(mockDrive)
        };

        // Mock require for googleapis
        const Module = require('module');
        const originalRequire = Module.prototype.require;
        Module.prototype.require = function(id) {
            if (id === 'googleapis') {
                return { google: googleMock };
            }
            return originalRequire.apply(this, arguments);
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
        // Restore require
        const Module = require('module');
        delete Module.prototype.require;
    });

    describe('#checkMonitoredFiles fileTypesRestriction normalization', () => {

        it('should normalize string fileTypesRestriction to array', async () => {
            context.properties = {
                fileTypesRestriction: 'image/,video/'
            };

            // Spy on the normalizeMultiselectInput function
            const normalizeSpy = sandbox.spy(lib, 'normalizeMultiselectInput');

            await lib.checkMonitoredFiles(context, { filter: () => true });

            assert(normalizeSpy.calledWith('image/,video/'));
        });

        it('should normalize array fileTypesRestriction (pass through)', async () => {
            context.properties = {
                fileTypesRestriction: ['image/', 'video/']
            };

            // Spy on the normalizeMultiselectInput function
            const normalizeSpy = sandbox.spy(lib, 'normalizeMultiselectInput');

            await lib.checkMonitoredFiles(context, { filter: () => true });

            assert(normalizeSpy.calledWith(['image/', 'video/']));
        });

        it('should handle null fileTypesRestriction', async () => {
            context.properties = {
                fileTypesRestriction: null
            };

            // Spy on the normalizeMultiselectInput function
            const normalizeSpy = sandbox.spy(lib, 'normalizeMultiselectInput');

            await lib.checkMonitoredFiles(context, { filter: () => true });

            assert(normalizeSpy.calledWith(null));
        });

        it('should handle undefined fileTypesRestriction', async () => {
            context.properties = {};

            // Spy on the normalizeMultiselectInput function
            const normalizeSpy = sandbox.spy(lib, 'normalizeMultiselectInput');

            await lib.checkMonitoredFiles(context, { filter: () => true });

            assert(normalizeSpy.calledWith(undefined));
        });

    });

});
