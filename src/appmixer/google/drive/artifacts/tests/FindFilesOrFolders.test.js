const assert = require('assert');
const sinon = require('sinon');
const FindFilesOrFolders = require('../../FindFilesOrFolders/FindFilesOrFolders');
const lib = require('../../lib');

describe('google.drive.FindFilesOrFolders', () => {

    let context;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Mock context object
        context = {
            auth: { accessToken: 'test-token', clientId: 'test-id', clientSecret: 'test-secret' },
            messages: {
                in: {
                    content: {}
                }
            },
            properties: {},
            sendJson: sandbox.stub(),
            sendArray: sandbox.stub(),
            saveFileStream: sandbox.stub().returns({ fileId: 'test-file-id' }),
            CancelError: Error
        };

        // Mock lib functions
        sandbox.stub(lib, 'getOauth2Client').returns({});
        sandbox.stub(lib, 'escapeSpecialCharacters').returns('test-query');
        sandbox.stub(lib, 'findFiles').returns([
            {
                index: 0,
                count: 1,
                isFile: true,
                isFolder: false,
                googleDriveFileMetadata: { id: 'file1', name: 'test.txt', mimeType: 'text/plain' }
            }
        ]);
        sandbox.stub(lib, 'findSubfolders').returns([]);
        sandbox.stub(lib, 'normalizeMultiselectInput');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('fileTypes normalization', () => {

        it('should normalize string fileTypes to array', async () => {
            context.messages.in.content = {
                fileTypes: 'image/,video/',
                outputType: 'firstItem',
                searchType: 'fileNameContains',
                query: 'test'
            };

            // Set up the normalization to return the expected array
            lib.normalizeMultiselectInput.withArgs('image/,video/').returns(['image/', 'video/']);

            await FindFilesOrFolders.receive(context);

            assert(lib.normalizeMultiselectInput.calledWith('image/,video/'));
        });

        it('should normalize array fileTypes (pass through)', async () => {
            context.messages.in.content = {
                fileTypes: ['image/', 'video/'],
                outputType: 'firstItem',
                searchType: 'fileNameContains',
                query: 'test'
            };

            // Set up the normalization to return the same array
            lib.normalizeMultiselectInput.withArgs(['image/', 'video/']).returns(['image/', 'video/']);

            await FindFilesOrFolders.receive(context);

            assert(lib.normalizeMultiselectInput.calledWith(['image/', 'video/']));
        });

        it('should handle null fileTypes', async () => {
            context.messages.in.content = {
                fileTypes: null,
                outputType: 'firstItem',
                searchType: 'fileNameContains',
                query: 'test'
            };

            // Set up the normalization to return empty array
            lib.normalizeMultiselectInput.withArgs(null).returns([]);

            await FindFilesOrFolders.receive(context);

            assert(lib.normalizeMultiselectInput.calledWith(null));
        });

        it('should handle undefined fileTypes', async () => {
            context.messages.in.content = {
                outputType: 'firstItem',
                searchType: 'fileNameContains',
                query: 'test'
            };

            // Set up the normalization to return empty array
            lib.normalizeMultiselectInput.withArgs(undefined).returns([]);

            await FindFilesOrFolders.receive(context);

            assert(lib.normalizeMultiselectInput.calledWith(undefined));
        });

    });

});
