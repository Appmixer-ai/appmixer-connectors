'use strict';

const assert = require('assert');

const auth = require('../../auth');
const lib = require('../../lib');
const MakeApiCall = require('../../core/MakeApiCall/MakeApiCall');
const GetWorker = require('../../core/GetWorker/GetWorker');
const RunReport = require('../../core/RunReport/RunReport');
const RunWQLQuery = require('../../core/RunWQLQuery/RunWQLQuery');

class CancelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CancelError';
    }
}

const createContext = ({ content = {}, auth: authData = {}, response = { data: {} } } = {}) => {
    const requests = [];
    const sent = [];
    return {
        requests,
        sent,
        CancelError,
        properties: {},
        auth: { host: 'wd2-impl-services1.workday.com', tenant: 'acme', token: 'access-token', ...authData },
        messages: { in: { content } },
        httpRequest: async (options) => {
            requests.push(options);
            return { status: 200, headers: {}, ...response };
        },
        sendJson: async (data, port) => {
            sent.push({ data, port });
        }
    };
};

describe('workday', function() {

    describe('auth.validate', function() {

        const authContext = (overrides) => {
            const requests = [];
            return {
                requests,
                host: 'wd2-impl-services1.workday.com',
                tenant: 'acme',
                clientId: 'client',
                clientSecret: 'secret',
                refreshToken: 'refresh',
                httpRequest: async (options) => {
                    requests.push(options);
                    return { data: { access_token: 'token', expires_in: -1 } };
                },
                ...overrides
            };
        };

        it('exchanges the refresh token at the tenant token endpoint', async function() {
            const context = authContext();
            const result = await auth.definition.validate(context);
            assert.strictEqual(context.requests.length, 1);
            assert.strictEqual(context.requests[0].url, 'https://wd2-impl-services1.workday.com/ccx/oauth2/acme/token');
            assert.match(context.requests[0].data, /grant_type=refresh_token/);
            assert.deepStrictEqual(result, { token: 'token', expires: 3600 });
        });

        for (const host of ['evil.example/x?', 'evil.com', 'wd2.workday.com.evil.com', 'https://wd2.workday.com']) {
            it(`makes no request for host ${host}`, async function() {
                const context = authContext({ host });
                await assert.rejects(() => auth.definition.validate(context), /Invalid Workday host/);
                assert.strictEqual(context.requests.length, 0);
            });
        }

        it('makes no request for an invalid tenant', async function() {
            const context = authContext({ tenant: 'acme/../x' });
            await assert.rejects(() => auth.definition.validate(context), /Invalid Workday tenant/);
            assert.strictEqual(context.requests.length, 0);
        });
    });

    describe('components', function() {

        it('GetWorker rejects an ID that is not a Workday ID', async function() {
            const context = createContext({ content: { workerId: '../../x' } });
            await assert.rejects(() => GetWorker.receive(context), /Worker ID must be/);
            assert.strictEqual(context.requests.length, 0);
        });

        it('GetWorker accepts a reference ID', async function() {
            const context = createContext({ content: { workerId: 'Employee_ID=21005' }, response: { data: { id: 'w1' } } });
            await GetWorker.receive(context);
            assert.strictEqual(
                context.requests[0].url,
                'https://wd2-impl-services1.workday.com/api/common/v1/acme/workers/Employee_ID=21005'
            );
        });

        it('a stored invalid host never reaches a request', async function() {
            const context = createContext({ content: { workerId: 'w1' }, auth: { host: 'evil.example/x?' } });
            await assert.rejects(() => GetWorker.receive(context), /Invalid Workday host/);
            assert.strictEqual(context.requests.length, 0);
        });

        it('RunWQLQuery uses POST for long queries', async function() {
            const query = 'SELECT firstName FROM allWorkers WHERE ' + 'x = 1 AND '.repeat(300) + 'y = 1';
            const context = createContext({ content: { query }, response: { data: { total: 1, data: [{ firstName: 'A' }] } } });
            await RunWQLQuery.receive(context);
            assert.strictEqual(context.requests[0].method, 'POST');
            assert.deepStrictEqual(context.sent[0].data, { result: [{ firstName: 'A' }], count: 1, total: 1 });
        });

        it('RunReport builds the RaaS URL and passes prompts', async function() {
            const context = createContext({
                content: { reportOwner: 'lmcneil', reportName: 'Workers Report', parameters: '{"Effective_as_of_Date":"2026-01-31"}' },
                response: { data: { Report_Entry: [{ Worker: 'Logan McNeil' }] } }
            });
            await RunReport.receive(context);
            assert.strictEqual(
                context.requests[0].url,
                'https://wd2-impl-services1.workday.com/ccx/service/customreport2/acme/lmcneil/Workers%20Report'
            );
            assert.deepStrictEqual(context.requests[0].params, { Effective_as_of_Date: '2026-01-31', format: 'json' });
            assert.strictEqual(context.sent[0].data.count, 1);
        });
    });

    describe('MakeApiCall', function() {

        it('replaces {tenant} and keeps the request on the Workday host', async function() {
            const context = createContext({ content: { url: '/api/common/v1/{tenant}/workers', method: 'GET', parameters: '{"limit":"1"}' } });
            await MakeApiCall.receive(context);
            assert.strictEqual(context.requests[0].url, 'https://wd2-impl-services1.workday.com/api/common/v1/acme/workers');
            assert.deepStrictEqual(context.requests[0].params, { limit: '1' });
            assert.strictEqual(context.requests[0].headers.Authorization, 'Bearer access-token');
        });

        for (const url of ['https://evil.example/x', '//evil.example/x', 'https://user:pw@wd2-impl-services1.workday.com/x']) {
            it(`rejects ${url}`, async function() {
                const context = createContext({ content: { url, method: 'GET' } });
                await assert.rejects(() => MakeApiCall.receive(context), CancelError);
                assert.strictEqual(context.requests.length, 0);
            });
        }
    });

    describe('lib.toCsv', function() {

        it('quotes cells per RFC 4180', function() {
            assert.strictEqual(lib.toCsv([{ a: 'x,y', b: 'say "hi"' }]), 'a,b\n"x,y","say ""hi"""');
        });
    });
});
