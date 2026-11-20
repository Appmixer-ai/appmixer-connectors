'use strict';

const assert = require('assert');

const auth = require('../../auth');
const lib = require('../../lib');
const MakeApiCall = require('../../core/MakeApiCall/MakeApiCall');
const GetWorker = require('../../core/GetWorker/GetWorker');
const ListWorkers = require('../../core/ListWorkers/ListWorkers');
const FindWorkers = require('../../core/FindWorkers/FindWorkers');
const ListDirectReports = require('../../core/ListDirectReports/ListDirectReports');
const ListSupervisoryOrganizations = require('../../core/ListSupervisoryOrganizations/ListSupervisoryOrganizations');
const RunReport = require('../../core/RunReport/RunReport');
const RunWQLQuery = require('../../core/RunWQLQuery/RunWQLQuery');

class CancelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CancelError';
    }
}

const createContext = (options = {}) => {
    const { content = {}, auth: authData = {}, response = { data: {} }, respond, properties = {} } = options;
    const requests = [];
    const sent = [];
    const cache = new Map();
    return {
        requests,
        sent,
        CancelError,
        properties,
        config: {},
        lock: async () => ({ unlock: async () => {} }),
        staticCache: {
            get: async (key) => cache.get(key),
            set: async (key, value) => { cache.set(key, value); }
        },
        auth: { host: 'wd2-impl-services1.workday.com', tenant: 'acme', token: 'access-token', ...authData },
        messages: { in: { content } },
        httpRequest: async (options) => {
            requests.push(options);
            if (respond) {
                // respond() returns the response body, or throws like a failed request.
                return { status: 200, headers: {}, data: await respond(options, requests.length) };
            }
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
                'https://wd2-impl-services1.workday.com/api/staffing/v6/acme/workers/Employee_ID=21005'
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
            // The query travels in the body; only the paging goes to the query string.
            assert.deepStrictEqual(context.requests[0].data, { query });
            assert.deepStrictEqual(context.requests[0].params, { limit: 10000, offset: 0 });
            assert.deepStrictEqual(context.sent[0].data, { result: [{ firstName: 'A' }], count: 1, total: 1 });
        });

        it('RunWQLQuery reads every page of a result over 10,000 rows', async function() {
            const all = Array.from({ length: 18462 }, (_, i) => ({ workdayID: String(i) }));
            const context = createContext({
                content: { query: 'SELECT workdayID FROM fieldCuration' },
                respond: ({ params }) => ({
                    total: all.length,
                    data: all.slice(params.offset, params.offset + params.limit)
                })
            });
            await RunWQLQuery.receive(context);
            assert.deepStrictEqual(
                context.requests.map(r => [r.params.limit, r.params.offset]),
                [[10000, 0], [10000, 10000]]
            );
            assert.strictEqual(context.sent[0].data.count, 18462);
            assert.strictEqual(context.sent[0].data.total, 18462);
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

    describe('workers and organizations', function() {

        const STAFFING = 'https://wd2-impl-services1.workday.com/api/staffing/v6/acme';
        const worker = (n, organization = 'org1', location = 'loc1') => ({
            id: `w${n}`,
            descriptor: `Worker ${n}`,
            workerId: String(21000 + n),
            person: { email: `w${n}@example.com` },
            primaryJob: {
                businessTitle: `Title ${n}`,
                supervisoryOrganization: { id: organization, Organization_Reference_ID: `REF_${organization}` },
                location: { id: location, Location_ID: `SITE_${location}` }
            }
        });
        // Serves a collection 100 objects per page, as the REST API does.
        const pages = (all) => ({ params }) => ({
            total: all.length,
            data: all.slice(params.offset, params.offset + params.limit)
        });
        const failure = (status, headers = {}) => Object.assign(new Error(`HTTP ${status}`), { response: { status, headers } });

        it('ListWorkers reads every page', async function() {
            const all = Array.from({ length: 250 }, (_, i) => worker(i));
            const context = createContext({ content: { outputType: 'array' }, respond: pages(all) });
            await ListWorkers.receive(context);
            assert.strictEqual(context.requests.length, 3);
            assert.strictEqual(context.requests[0].url, `${STAFFING}/workers`);
            assert.deepStrictEqual(context.requests.map(r => r.params.offset), [0, 100, 200]);
            assert.strictEqual(context.sent[0].data.count, 250);
            assert.strictEqual(context.sent[0].data.result[249].person.email, 'w249@example.com');
        });

        it('a collection of exactly one page takes one request', async function() {
            const all = Array.from({ length: 100 }, (_, i) => worker(i));
            const context = createContext({ content: { outputType: 'array' }, respond: pages(all) });
            await ListWorkers.receive(context);
            assert.strictEqual(context.requests.length, 1);
            assert.strictEqual(context.sent[0].data.count, 100);
        });

        it('FindWorkers sends search, email and status to Workday', async function() {
            const context = createContext({
                content: { search: 'Logan', email: 'w1@example.com', includeTerminatedWorkers: true, outputType: 'array' },
                respond: pages([worker(1)])
            });
            await FindWorkers.receive(context);
            assert.deepStrictEqual(context.requests[0].params, {
                search: 'Logan', email: 'w1@example.com', includeTerminatedWorkers: true, limit: 100, offset: 0
            });
            assert.strictEqual(context.sent[0].port, 'out');
        });

        it('FindWorkers filters by organization and location of the primary job', async function() {
            const all = [worker(1, 'org1', 'loc1'), worker(2, 'org2', 'loc1'), worker(3, 'org1', 'loc2')];
            const byWid = createContext({
                content: { organizationId: 'org1', locationId: 'loc1', outputType: 'array' },
                respond: pages(all)
            });
            await FindWorkers.receive(byWid);
            assert.deepStrictEqual(byWid.sent[0].data.result.map(w => w.id), ['w1']);
            // No terminated workers unless asked for.
            assert.strictEqual('includeTerminatedWorkers' in byWid.requests[0].params, false);

            const byReference = createContext({
                content: { organizationId: 'Organization_Reference_ID=REF_org1', locationId: 'SITE_loc2', outputType: 'array' },
                respond: pages(all)
            });
            await FindWorkers.receive(byReference);
            assert.deepStrictEqual(byReference.sent[0].data.result.map(w => w.id), ['w3']);
        });

        it('FindWorkers sends notFound when nothing matches', async function() {
            const context = createContext({
                content: { organizationId: 'org9', outputType: 'array' },
                respond: pages([worker(1)])
            });
            await FindWorkers.receive(context);
            assert.strictEqual(context.sent[0].port, 'notFound');
            assert.strictEqual(context.sent[0].data.organizationId, 'org9');
        });

        it('GetWorker without Include Manager takes one request', async function() {
            const context = createContext({ content: { workerId: 'w1' }, respond: () => worker(1) });
            await GetWorker.receive(context);
            assert.strictEqual(context.requests.length, 1);
            assert.strictEqual('manager' in context.sent[0].data, false);
        });

        it('GetWorker resolves the manager of the primary organization', async function() {
            const context = createContext({
                content: { workerId: 'w1', includeManager: true },
                respond: ({ url }) => {
                    if (url === `${STAFFING}/workers/w1`) return worker(1);
                    if (url === `${STAFFING}/supervisoryOrganizations/org1`) {
                        return { id: 'org1', managers: [{ id: 'w7', descriptor: 'Worker 7' }] };
                    }
                    if (url === `${STAFFING}/workers/w7`) return worker(7);
                    throw new Error(`unexpected ${url}`);
                }
            });
            await GetWorker.receive(context);
            assert.deepStrictEqual(context.sent[0].data.manager, {
                id: 'w7', descriptor: 'Worker 7', workerId: '21007', email: 'w7@example.com', businessTitle: 'Title 7'
            });
        });

        it('GetWorker takes the manager of the superior organization for a worker who leads the own one', async function() {
            const context = createContext({
                content: { workerId: 'w1', includeManager: true },
                respond: ({ url }) => {
                    if (url === `${STAFFING}/workers/w1`) return worker(1);
                    if (url === `${STAFFING}/supervisoryOrganizations/org1`) {
                        return { id: 'org1', managers: [{ id: 'w1', descriptor: 'Worker 1' }] };
                    }
                    if (url === `${STAFFING}/supervisoryOrganizations/org1/orgChart`) {
                        return {
                            total: 1,
                            data: [{ id: 'org1', superior: { id: 'org0', managers: [{ id: 'w9', descriptor: 'Worker 9' }] } }]
                        };
                    }
                    if (url === `${STAFFING}/workers/w9`) return worker(9);
                    throw new Error(`unexpected ${url}`);
                }
            });
            await GetWorker.receive(context);
            assert.strictEqual(context.sent[0].data.manager.email, 'w9@example.com');
        });

        it('GetWorker leaves manager out at the top of the hierarchy', async function() {
            const context = createContext({
                content: { workerId: 'w1', includeManager: true },
                respond: ({ url }) => {
                    if (url === `${STAFFING}/workers/w1`) return worker(1);
                    if (url === `${STAFFING}/supervisoryOrganizations/org1`) return { id: 'org1', managers: [{ id: 'w1' }] };
                    if (url === `${STAFFING}/supervisoryOrganizations/org1/orgChart`) {
                        return { total: 1, data: [{ id: 'org1' }] };
                    }
                    throw new Error(`unexpected ${url}`);
                }
            });
            await GetWorker.receive(context);
            assert.strictEqual(context.sent[0].data.id, 'w1');
            assert.strictEqual('manager' in context.sent[0].data, false);
        });

        it('ListSupervisoryOrganizations adds the superior organization on request', async function() {
            const respond = ({ url }) => {
                if (url === `${STAFFING}/supervisoryOrganizations`) {
                    return { total: 2, data: [{ id: 'org0', descriptor: 'Top' }, { id: 'org1', descriptor: 'HR' }] };
                }
                if (url === `${STAFFING}/supervisoryOrganizations/org0/orgChart`) {
                    return { total: 1, data: [{ id: 'org0' }] };
                }
                if (url === `${STAFFING}/supervisoryOrganizations/org1/orgChart`) {
                    return {
                        total: 1,
                        data: [{ id: 'org1', superior: { id: 'org0', descriptor: 'Top', name: 'Top', code: 'T', managers: [] } }]
                    };
                }
                throw new Error(`unexpected ${url}`);
            };
            const plain = createContext({ content: { outputType: 'array' }, respond });
            await ListSupervisoryOrganizations.receive(plain);
            assert.strictEqual(plain.requests.length, 1);
            assert.strictEqual('superior' in plain.sent[0].data.result[1], false);

            const context = createContext({ content: { includeHierarchy: true, outputType: 'array' }, respond });
            await ListSupervisoryOrganizations.receive(context);
            const [top, hr] = context.sent[0].data.result;
            assert.strictEqual('superior' in top, false);
            assert.deepStrictEqual(hr.superior, {
                id: 'org0', descriptor: 'Top', name: 'Top', code: 'T', Organization_Reference_ID: undefined
            });
        });

        it('the organization lookup is cached and never fails the inspector', async function() {
            const context = createContext({
                properties: { isSource: true },
                content: { outputType: 'array' },
                respond: () => ({ total: 1, data: [{ id: 'org1', descriptor: 'HR' }] })
            });
            await ListSupervisoryOrganizations.receive(context);
            await ListSupervisoryOrganizations.receive(context);
            assert.strictEqual(context.requests.length, 1);
            assert.deepStrictEqual(
                ListSupervisoryOrganizations.toSelectArray(context.sent[1].data),
                [{ label: 'HR', value: 'org1' }]
            );

            const failing = createContext({
                properties: { isSource: true },
                content: { outputType: 'array' },
                respond: () => { throw failure(403); }
            });
            await ListSupervisoryOrganizations.receive(failing);
            assert.deepStrictEqual(failing.sent[0].data, { result: [], count: 0 });
        });

        it('a flow run does not swallow a permission error', async function() {
            const context = createContext({ content: { outputType: 'array' }, respond: () => { throw failure(403); } });
            await assert.rejects(() => ListSupervisoryOrganizations.receive(context), /HTTP 403/);
        });

        it('ListDirectReports reads every page of common/v1', async function() {
            const all = Array.from({ length: 130 }, (_, i) => ({ id: `w${i}`, descriptor: `Worker ${i}` }));
            const context = createContext({ content: { workerId: 'w1', outputType: 'array' }, respond: pages(all) });
            await ListDirectReports.receive(context);
            assert.strictEqual(
                context.requests[0].url,
                'https://wd2-impl-services1.workday.com/api/common/v1/acme/workers/w1/directReports'
            );
            assert.strictEqual(context.sent[0].data.count, 130);
        });

        it('a page without "total" does not end the paging early', async function() {
            const all = Array.from({ length: 250 }, (_, i) => worker(i));
            const context = createContext({
                content: { outputType: 'array' },
                // Only the first page reports the total; later pages report 0 or nothing.
                respond: ({ params }) => ({
                    ...(params.offset === 0 ? { total: all.length } : params.offset === 100 ? { total: 0 } : {}),
                    data: all.slice(params.offset, params.offset + params.limit)
                })
            });
            await ListWorkers.receive(context);
            assert.strictEqual(context.sent[0].data.count, 250);
        });

        it('a reference ID of another type does not match', async function() {
            const all = [worker(1, 'org1', 'loc1')];
            const context = createContext({
                content: { organizationId: 'Location_ID=REF_org1', outputType: 'array' },
                respond: pages(all)
            });
            await FindWorkers.receive(context);
            assert.strictEqual(context.sent[0].port, 'notFound');
        });

        it('GetWorker climbs the hierarchy until somebody else leads an organization', async function() {
            const context = createContext({
                content: { workerId: 'w1', includeManager: true },
                respond: ({ url }) => {
                    if (url === `${STAFFING}/workers/w1`) return worker(1);
                    if (url === `${STAFFING}/supervisoryOrganizations/org1`) return { id: 'org1', managers: [{ id: 'w1' }] };
                    if (url === `${STAFFING}/supervisoryOrganizations/org1/orgChart`) {
                        // The worker leads the superior organization too.
                        return { total: 1, data: [{ id: 'org1', superior: { id: 'org0', managers: [{ id: 'w1' }] } }] };
                    }
                    if (url === `${STAFFING}/supervisoryOrganizations/org0/orgChart`) {
                        return { total: 1, data: [{ id: 'org0', superior: { id: 'top', managers: [{ id: 'w5' }] } }] };
                    }
                    if (url === `${STAFFING}/workers/w5`) return worker(5);
                    throw new Error(`unexpected ${url}`);
                }
            });
            await GetWorker.receive(context);
            assert.strictEqual(context.sent[0].data.manager.id, 'w5');
        });

        it('the organization chart of another node gives no superior', async function() {
            const context = createContext({
                respond: () => ({ total: 2, data: [{ id: 'other', superior: { id: 'org1' } }, { id: 'org1', superior: { id: 'org1' } }] })
            });
            // A node that is not this organization is ignored, and so is a superior that is the organization itself.
            assert.strictEqual(await lib.getSuperiorOrganization(context, 'org1'), undefined);
            assert.strictEqual(await lib.getSuperiorOrganization(context, 'org2'), undefined);
        });

        it('GetWorker rejects "." and ".." as an ID', async function() {
            for (const workerId of ['.', '..']) {
                const context = createContext({ content: { workerId } });
                await assert.rejects(() => GetWorker.receive(context), /Worker ID must be/);
                assert.strictEqual(context.requests.length, 0);
            }
        });

        it('a throttled request (429) is retried', async function() {
            const context = createContext({
                content: { workerId: 'w1' },
                respond: (options, attempt) => {
                    if (attempt === 1) {
                        throw failure(429, { 'retry-after': '0.01' });
                    }
                    return worker(1);
                }
            });
            await GetWorker.receive(context);
            assert.strictEqual(context.requests.length, 2);
            assert.strictEqual(context.sent[0].data.id, 'w1');
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

        it('takes the columns from every record, not only the first one', function() {
            assert.strictEqual(lib.toCsv([{ a: 1 }, { a: 2, b: 'x' }]), 'a,b\n1,\n2,x');
        });
    });
});
