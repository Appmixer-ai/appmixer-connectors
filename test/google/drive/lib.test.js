const assert = require('assert');
const sinon = require('sinon');

describe('google.drive.lib', () => {

    let lib;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Mock googleapis before requiring the lib
        const googleMock = {
            google: {
                drive: sandbox.stub(),
                auth: {
                    OAuth2: sandbox.stub()
                }
            }
        };

        // Mock moment
        const momentMock = sandbox.stub();

        // Mock uuid
        const uuidMock = {
            v4: sandbox.stub().returns('mock-uuid')
        };

        // Mock require
        const Module = require('module');
        const originalRequire = Module.prototype.require;
        Module.prototype.require = function(id) {
            if (id === 'googleapis') {
                return googleMock;
            }
            if (id === 'moment') {
                return momentMock;
            }
            if (id === 'uuid') {
                return uuidMock;
            }
            return originalRequire.apply(this, arguments);
        };

        // Now require the lib with mocked dependencies
        lib = require('../../../src/appmixer/google/drive/lib');
    });

    afterEach(() => {
        sandbox.restore();
        // Restore require
        const Module = require('module');
        delete Module.prototype.require;
        // Clear the module cache to force re-require
        delete require.cache[require.resolve('../../../src/appmixer/google/drive/lib')];
    });

    describe('#normalizeMultiselectInput', () => {

        it('should return empty array for null input', () => {
            const result = lib.normalizeMultiselectInput(null);
            assert.deepStrictEqual(result, []);
        });

        it('should return empty array for undefined input', () => {
            const result = lib.normalizeMultiselectInput(undefined);
            assert.deepStrictEqual(result, []);
        });

        it('should return empty array for empty string input', () => {
            const result = lib.normalizeMultiselectInput('');
            assert.deepStrictEqual(result, []);
        });

        it('should return the same array for array input', () => {
            const input = ['value1', 'value2', 'value3'];
            const result = lib.normalizeMultiselectInput(input);
            assert.deepStrictEqual(result, ['value1', 'value2', 'value3']);
        });

        it('should split comma-separated string into array', () => {
            const result = lib.normalizeMultiselectInput('value1,value2,value3');
            assert.deepStrictEqual(result, ['value1', 'value2', 'value3']);
        });

        it('should trim whitespace from comma-separated values', () => {
            const result = lib.normalizeMultiselectInput('  value1  ,  value2  ,  value3  ');
            assert.deepStrictEqual(result, ['value1', 'value2', 'value3']);
        });

        it('should filter out empty values from comma-separated string', () => {
            const result = lib.normalizeMultiselectInput('value1,,value2,   ,value3');
            assert.deepStrictEqual(result, ['value1', 'value2', 'value3']);
        });

        it('should handle single value string', () => {
            const result = lib.normalizeMultiselectInput('singlevalue');
            assert.deepStrictEqual(result, ['singlevalue']);
        });

        it('should throw error for invalid input type', () => {
            assert.throws(
                () => lib.normalizeMultiselectInput(123),
                /Invalid input type for multiselect field. Expected string or array./);
            assert.throws(
                () => lib.normalizeMultiselectInput({}),
                /Invalid input type for multiselect field. Expected string or array./);
            assert.throws(
                () => lib.normalizeMultiselectInput(true),
                /Invalid input type for multiselect field. Expected string or array./);
        });

    });

});
