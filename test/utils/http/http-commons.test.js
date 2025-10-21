const sinon = require('sinon');
const assert = require('assert');

describe('processResponse', () => {

    let axiosRequestStub;

    beforeEach(() => {
        // Stub axios from the http connector's node_modules
        const axios = require('../../../src/appmixer/utils/http/node_modules/axios');
        axiosRequestStub = sinon.stub(axios, 'request').callsFake((options) => {
            return new Promise((resolve) => {
                resolve({
                    status: 200,
                    config: options,
                    headers: {
                        'content-type': 'application/json; charset=utf-8',
                        'x-custom-header': 'custom-value'
                    },
                    data: { key: 'value' }
                });
            });
        });
    });

    afterEach(() => {
        axiosRequestStub.restore();
    });

    it('should correctly parse and return response headers', async () => {

        const testUrl = 'https://foo.bar/';

        const request = require('../../../src/appmixer/utils/http/http-commons');
        const result = await request('get', {
            url: testUrl
        });

        assert.equal(result.statusCode, 200);
        assert.equal(result.request.uri.href, testUrl);
        assert.equal(result.request.method, 'get');
        assert.deepEqual(result.headers['x-custom-header'], 'custom-value');
        assert.deepEqual(result.headers['content-type'], {
            type: 'application/json',
            parameters: { charset: 'utf-8' }
        });
        assert.deepEqual(result.body, { key: 'value' });
    });
});
