const assert = require('assert');
const GenerateReport = require('../../../src/appmixer/google/analytics/GenerateReport/GenerateReport');

// Mock context for testing
const mockContext = {
    CancelError: class extends Error {
        constructor(message) {
            super(message);
            this.name = 'CancelError';
        }
    },
    messages: {
        in: {
            content: {}
        }
    },
    properties: {
        propertyId: '123456789'
    },
    auth: {
        accessToken: 'mock-token'
    },
    httpRequest: async () => ({
        data: {
            dimensionHeaders: [],
            metricHeaders: [],
            rows: []
        }
    }),
    sendJson: (data) => data
};

describe('Google Analytics GenerateReport', () => {

    describe('multiselect normalization', () => {

        it('should normalize dimensions string input to array', async () => {
            mockContext.messages.in.content = {
                dimensions: 'country,city,browser',
                metrics: ['sessions', 'users'],
                keepEmptyRows: false
            };

            // Mock httpRequest to capture the request data
            mockContext.httpRequest = async (config) => {
                const body = config.data;

                // Verify that dimensions were normalized to array format
                assert(Array.isArray(body.dimensions));
                assert.strictEqual(body.dimensions.length, 3);
                assert.deepStrictEqual(body.dimensions, [
                    { name: 'country' },
                    { name: 'city' },
                    { name: 'browser' }
                ]);

                return {
                    data: {
                        dimensionHeaders: [],
                        metricHeaders: [],
                        rows: []
                    }
                };
            };

            await GenerateReport.receive(mockContext);
        });

        it('should normalize metrics string input to array', async () => {
            mockContext.messages.in.content = {
                dimensions: ['country', 'city'],
                metrics: 'sessions,users,pageviews',
                keepEmptyRows: false
            };

            // Mock httpRequest to capture the request data
            mockContext.httpRequest = async (config) => {
                const body = config.data;

                // Verify that metrics were normalized to array format
                assert(Array.isArray(body.metrics));
                assert.strictEqual(body.metrics.length, 3);
                assert.deepStrictEqual(body.metrics, [
                    { name: 'sessions' },
                    { name: 'users' },
                    { name: 'pageviews' }
                ]);

                return {
                    data: {
                        dimensionHeaders: [],
                        metricHeaders: [],
                        rows: []
                    }
                };
            };

            await GenerateReport.receive(mockContext);
        });

        it('should handle both dimensions and metrics as strings', async () => {
            mockContext.messages.in.content = {
                dimensions: 'country, city',
                metrics: 'sessions, users',
                keepEmptyRows: false
            };

            // Mock httpRequest to capture the request data
            mockContext.httpRequest = async (config) => {
                const body = config.data;

                // Verify that both were normalized correctly
                assert.deepStrictEqual(body.dimensions, [
                    { name: 'country' },
                    { name: 'city' }
                ]);
                assert.deepStrictEqual(body.metrics, [
                    { name: 'sessions' },
                    { name: 'users' }
                ]);

                return {
                    data: {
                        dimensionHeaders: [],
                        metricHeaders: [],
                        rows: []
                    }
                };
            };

            await GenerateReport.receive(mockContext);
        });

        it('should handle array inputs unchanged', async () => {
            mockContext.messages.in.content = {
                dimensions: ['country', 'city'],
                metrics: ['sessions', 'users'],
                keepEmptyRows: false
            };

            // Mock httpRequest to capture the request data
            mockContext.httpRequest = async (config) => {
                const body = config.data;

                // Verify that arrays were preserved
                assert.deepStrictEqual(body.dimensions, [
                    { name: 'country' },
                    { name: 'city' }
                ]);
                assert.deepStrictEqual(body.metrics, [
                    { name: 'sessions' },
                    { name: 'users' }
                ]);

                return {
                    data: {
                        dimensionHeaders: [],
                        metricHeaders: [],
                        rows: []
                    }
                };
            };

            await GenerateReport.receive(mockContext);
        });
    });
});
