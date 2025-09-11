const assert = require('assert');
const GetPresentation = require('../../src/appmixer/googleSlides/core/GetPresentation/GetPresentation');

describe('GetPresentation component', () => {

    const mockContext = {
        auth: {
            accessToken: 'mock-access-token'
        },
        httpRequest: null, // Will be set per test
        sendJson: (data, port) => ({ data, port }),
        messages: {
            in: {
                content: {}
            }
        },
        CancelError: class extends Error {
            constructor(message) {
                super(message);
                this.name = 'CancelError';
            }
        }
    };

    it('should handle array input for fields parameter', async () => {
        mockContext.messages.in.content = {
            presentationId: 'test-presentation-id',
            fields: ['presentationId', 'title', 'slides']
        };

        let actualParams;
        mockContext.httpRequest = ({ params }) => {
            actualParams = params;
            return { data: { presentationId: 'test-presentation-id' } };
        };

        await GetPresentation.receive(mockContext);

        assert.strictEqual(actualParams.fields, 'presentationId,title,slides');
    });

    it('should handle string input for fields parameter', async () => {
        mockContext.messages.in.content = {
            presentationId: 'test-presentation-id',
            fields: 'presentationId, title, slides'
        };

        let actualParams;
        mockContext.httpRequest = ({ params }) => {
            actualParams = params;
            return { data: { presentationId: 'test-presentation-id' } };
        };

        await GetPresentation.receive(mockContext);

        assert.strictEqual(actualParams.fields, 'presentationId,title,slides');
    });

    it('should handle undefined fields parameter', async () => {
        mockContext.messages.in.content = {
            presentationId: 'test-presentation-id'
        };

        let actualParams;
        mockContext.httpRequest = ({ params }) => {
            actualParams = params;
            return { data: { presentationId: 'test-presentation-id' } };
        };

        await GetPresentation.receive(mockContext);

        assert.strictEqual(actualParams.fields, undefined);
    });
});
