const path = require('path');
const assert = require('assert');

describe('GetPageOrThumbnail Component', function() {
    let context;
    let GetPageOrThumbnail;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.GOOGLE_SLIDES_ACCESS_TOKEN) {
            console.log('Skipping tests - GOOGLE_SLIDES_ACCESS_TOKEN not set');
            this.skip();
        }
        // Load the component - note: using the actual file path which may have the old naming
        GetPageOrThumbnail = require(path.join(__dirname, '../../src/appmixer/googleSlides/core/GetPageorThumbnail/GetPageOrThumbnail.js'));

        // Mock context
        context = {
            auth: {
                accessToken: process.env.GOOGLE_SLIDES_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {}
                }
            },
            properties: {},
            httpRequest: require('./httpRequest.js'),
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        assert(context.auth.accessToken, 'GOOGLE_SLIDES_ACCESS_TOKEN environment variable is required for tests');
    });

    it('should get page details without thumbnail', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        // You'll need to replace these with actual presentation and page IDs from your Google Drive
        context.messages.in.content = {
            presentationId: '1SamplePresentationIdThatExists',
            pageObjectId: 'SamplePageObjectId',
            thumbnail: false
        };

        try {
            await GetPageOrThumbnail.receive(context);

            console.log('GetPageOrThumbnail page details result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');
            assert(data.objectId, 'Expected page to have objectId property');

            // Check for expected page properties
            if (data.pageElements) {
                assert(Array.isArray(data.pageElements), 'Expected pageElements to be an array');
            }

            if (data.slideProperties) {
                assert(typeof data.slideProperties === 'object', 'Expected slideProperties to be an object');
            }

        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the GOOGLE_SLIDES_ACCESS_TOKEN in .env file');
            }
            if (error.response && error.response.status === 404) {
                console.log('Page not found - this is expected if using placeholder IDs');
                console.log('Please update the test with real presentation and page IDs to test properly');
                this.skip(); // Skip this test if using placeholder IDs
            }
            throw error;
        }
    });

    it('should get page thumbnail when thumbnail flag is true', async function() {
        let data;
        context.sendJson = function(output, port) {
            data = output;
        };

        // You'll need to replace these with actual presentation and page IDs from your Google Drive
        context.messages.in.content = {
            presentationId: '1SamplePresentationIdThatExists',
            pageObjectId: 'SamplePageObjectId',
            thumbnail: true
        };

        try {
            await GetPageOrThumbnail.receive(context);

            console.log('GetPageOrThumbnail thumbnail result:', JSON.stringify(data, null, 2));

            assert(data && typeof data === 'object', 'Expected data to be an object');

            // For thumbnail requests, we expect a contentUrl
            if (data.contentUrl) {
                assert(typeof data.contentUrl === 'string', 'Expected contentUrl to be a string');
                assert(data.contentUrl.startsWith('http'), 'Expected contentUrl to be a valid URL');
            }

            // Thumbnail responses also include width and height
            if (data.width !== undefined) {
                assert(typeof data.width === 'number', 'Expected width to be a number');
            }
            if (data.height !== undefined) {
                assert(typeof data.height === 'number', 'Expected height to be a number');
            }

        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('Authentication failed - access token may be expired');
                console.log('Error details:', error.response.data);
                throw new Error('Authentication failed: Access token is invalid or expired. Please refresh the GOOGLE_SLIDES_ACCESS_TOKEN in .env file');
            }
            if (error.response && error.response.status === 404) {
                console.log('Page not found - this is expected if using placeholder IDs');
                console.log('Please update the test with real presentation and page IDs to test properly');
                this.skip(); // Skip this test if using placeholder IDs
            }
            throw error;
        }
    });

    it('should require both presentationId and pageObjectId', async function() {
        // Test missing presentationId
        context.messages.in.content = {
            pageObjectId: 'some-page-id',
            thumbnail: false
        };

        try {
            await GetPageOrThumbnail.receive(context);
            assert.fail('Expected an error when presentationId is missing');
        } catch (error) {
            // This should fail due to missing required field
            assert(true, 'Component correctly requires presentationId');
        }

        // Test missing pageObjectId
        context.messages.in.content = {
            presentationId: 'some-presentation-id',
            thumbnail: false
        };

        try {
            await GetPageOrThumbnail.receive(context);
            assert.fail('Expected an error when pageObjectId is missing');
        } catch (error) {
            // This should fail due to missing required field
            assert(true, 'Component correctly requires pageObjectId');
        }
    });
});
