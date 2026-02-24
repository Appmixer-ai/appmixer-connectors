'use strict';

const assert = require('assert');
const CreateStatusPage = require('../../statuspages/CreateStatusPage/CreateStatusPage');

describe('CreateStatusPage', () => {

    let context;

    beforeEach(() => {
        context = {
            auth: {
                apiKey: 'test-api-key'
            },
            messages: {
                in: {
                    content: {}
                }
            },
            httpRequest: async () => ({
                data: {
                    data: {
                        attributes: {
                            id: '123456789',
                            company_name: 'Test Company',
                            company_url: 'https://test.com',
                            subdomain: 'test-status',
                            timezone: 'UTC',
                            status: 'up'
                        }
                    }
                }
            }),
            sendJson: async (data, port) => ({ data, port }),
            CancelError: class extends Error {}
        };
    });

    it('should throw error when company name is missing', async () => {
        context.messages.in.content = {
            companyUrl: 'https://test.com',
            subdomain: 'test',
            timezone: 'UTC'
        };

        try {
            await CreateStatusPage.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Company name is required'));
        }
    });

    it('should throw error when company URL is missing', async () => {
        context.messages.in.content = {
            companyName: 'Test Company',
            subdomain: 'test',
            timezone: 'UTC'
        };

        try {
            await CreateStatusPage.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Company URL is required'));
        }
    });

    it('should throw error when subdomain is missing', async () => {
        context.messages.in.content = {
            companyName: 'Test Company',
            companyUrl: 'https://test.com',
            timezone: 'UTC'
        };

        try {
            await CreateStatusPage.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Subdomain is required'));
        }
    });

    it('should throw error when timezone is missing', async () => {
        context.messages.in.content = {
            companyName: 'Test Company',
            companyUrl: 'https://test.com',
            subdomain: 'test'
        };

        try {
            await CreateStatusPage.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Timezone is required'));
        }
    });

    it('should create a status page with required fields', async () => {
        let capturedOptions = {};
        context.httpRequest = async (options) => {
            capturedOptions = options;
            return {
                data: {
                    data: {
                        id: '123456789',
                        attributes: {
                            company_name: 'Test Company',
                            company_url: 'https://test.com',
                            subdomain: 'test-status',
                            timezone: 'UTC'
                        }
                    }
                }
            };
        };

        context.messages.in.content = {
            companyName: 'Test Company',
            companyUrl: 'https://test.com',
            subdomain: 'test-status',
            timezone: 'UTC'
        };

        const result = await CreateStatusPage.receive(context);

        assert.strictEqual(result.data.id, '123456789');
        assert.strictEqual(result.data.company_name, 'Test Company');
        assert.strictEqual(capturedOptions.method, 'POST');
        assert.strictEqual(capturedOptions.url, 'https://uptime.betterstack.com/api/v2/status-pages');
        assert.strictEqual(capturedOptions.data.company_name, 'Test Company');
        assert.strictEqual(capturedOptions.data.company_url, 'https://test.com');
        assert.strictEqual(capturedOptions.data.subdomain, 'test-status');
        assert.strictEqual(capturedOptions.data.timezone, 'UTC');
    });

    it('should create a status page with optional fields', async () => {
        let capturedOptions = {};
        context.httpRequest = async (options) => {
            capturedOptions = options;
            return {
                data: {
                    data: {
                        id: '123456789',
                        attributes: {
                            company_name: 'Test Company',
                            company_url: 'https://test.com',
                            subdomain: 'test-status',
                            timezone: 'UTC',
                            design: 'v2',
                            theme: 'dark',
                            subscribable: true
                        }
                    }
                }
            };
        };

        context.messages.in.content = {
            companyName: 'Test Company',
            companyUrl: 'https://test.com',
            subdomain: 'test-status',
            timezone: 'UTC',
            design: 'v2',
            theme: 'dark',
            subscribable: true
        };

        const result = await CreateStatusPage.receive(context);

        assert.strictEqual(result.data.design, 'v2');
        assert.strictEqual(result.data.theme, 'dark');
        assert.strictEqual(result.data.subscribable, true);
        assert.strictEqual(capturedOptions.data.design, 'v2');
        assert.strictEqual(capturedOptions.data.theme, 'dark');
        assert.strictEqual(capturedOptions.data.subscribable, true);
    });

    it('should include Authorization header', async () => {
        let capturedOptions = {};
        context.httpRequest = async (options) => {
            capturedOptions = options;
            return {
                data: {
                    data: {
                        id: '123456789',
                        attributes: {
                            company_name: 'Test Company',
                            company_url: 'https://test.com',
                            subdomain: 'test-status',
                            timezone: 'UTC'
                        }
                    }
                }
            };
        };

        context.messages.in.content = {
            companyName: 'Test Company',
            companyUrl: 'https://test.com',
            subdomain: 'test-status',
            timezone: 'UTC'
        };

        await CreateStatusPage.receive(context);

        assert(capturedOptions.headers.Authorization.includes('Bearer'));
        assert.strictEqual(capturedOptions.headers['Content-Type'], 'application/json');
    });
});
