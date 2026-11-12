'use strict';

const assert = require('assert');

const auth = require('../../auth');
const lib = require('../../lib');
const CreateCandidate = require('../../core/CreateCandidate/CreateCandidate');
const UpdateCandidate = require('../../core/UpdateCandidate/UpdateCandidate');
const GetCandidate = require('../../core/GetCandidate/GetCandidate');
const DeleteCandidate = require('../../core/DeleteCandidate/DeleteCandidate');
const FindCandidates = require('../../core/FindCandidates/FindCandidates');
const FindJobs = require('../../core/FindJobs/FindJobs');
const ListJobStages = require('../../core/ListJobStages/ListJobStages');
const FindApplications = require('../../core/FindApplications/FindApplications');
const MoveApplication = require('../../core/MoveApplication/MoveApplication');
const RejectApplication = require('../../core/RejectApplication/RejectApplication');
const MakeApiCall = require('../../core/MakeApiCall/MakeApiCall');
const NewCandidate = require('../../core/NewCandidate/NewCandidate');
const UpdatedApplication = require('../../core/UpdatedApplication/UpdatedApplication');

class CancelError extends Error {}

/**
 * A mocked component context. responder(request, index) returns the response
 * ({ data, status, headers }) or throws; every request is recorded.
 */
function contextFor({ content = {}, properties = {}, state = {}, responder = () => ({ data: [] }) } = {}) {

    const requests = [];
    const sent = [];
    const context = {
        auth: { token: 'stored-token', clientId: 'client-id', clientSecret: 'client-secret' },
        messages: { in: { content } },
        properties,
        state,
        config: {},
        componentId: 'component-1',
        CancelError,
        requests,
        sent,
        savedState: null,
        httpRequest: async (request) => {
            requests.push(request);
            const response = await responder(request, requests.length - 1);
            return { status: 200, headers: {}, ...response };
        },
        sendJson: async (data, port) => {
            sent.push({ data, port });
        },
        saveState: async (value) => {
            context.savedState = value;
            context.state = value;
        },
        lock: async () => ({ unlock: async () => {} }),
        staticCache: {
            store: {},
            async get(key) { return this.store[key]; },
            async set(key, value) { this.store[key] = value; }
        }
    };
    return context;
}

function httpError(status, headers = {}, data = {}) {

    const error = new Error('Request failed with status ' + status);
    error.response = { status, headers, data };
    return error;
}

describe('greenhouse connector', function() {

    describe('auth', function() {

        it('exchanges the client credentials for a token with the client credentials grant', async function() {

            let request;
            const result = await auth.definition.validate({
                clientId: 'abc',
                clientSecret: 'xyz',
                httpRequest: async (value) => {
                    request = value;
                    return { data: { token_type: 'Bearer', access_token: 'jwt-token', expires_in: 3600 } };
                }
            });

            assert.deepStrictEqual(result, { token: 'jwt-token', expires: 3600 });
            assert.strictEqual(request.method, 'POST');
            assert.strictEqual(request.url, 'https://auth.greenhouse.io/token');
            assert.strictEqual(request.data, 'grant_type=client_credentials');
            assert.strictEqual(request.headers['Content-Type'], 'application/x-www-form-urlencoded');
            assert.strictEqual(request.headers.Authorization, 'Basic ' + Buffer.from('abc:xyz').toString('base64'));
        });

        it('masks the client id in the account name', function() {

            assert.strictEqual(auth.definition.accountNameFromProfileInfo({ clientId: 'abcdefghijklmnop' }), 'abcd...mnop');
        });
    });

    describe('lib.apiRequest', function() {

        it('sends the stored bearer token to the Harvest API', async function() {

            const context = contextFor();
            await lib.apiRequest(context, { path: '/v3/jobs', params: { per_page: 1 } });

            assert.strictEqual(context.requests[0].url, 'https://harvest.greenhouse.io/v3/jobs');
            assert.strictEqual(context.requests[0].headers.Authorization, 'Bearer stored-token');
            assert.deepStrictEqual(context.requests[0].params, { per_page: 1 });
        });

        it('requests a fresh token once when the stored one is rejected', async function() {

            const context = contextFor({
                responder: (request, index) => {
                    if (index === 0) throw httpError(401);
                    if (request.url === 'https://auth.greenhouse.io/token') {
                        return { data: { access_token: 'fresh-token', expires_in: 3600 } };
                    }
                    return { data: [{ id: 1 }] };
                }
            });

            const { data } = await lib.apiRequest(context, { path: '/v3/jobs' });

            assert.deepStrictEqual(data, [{ id: 1 }]);
            assert.strictEqual(context.requests.length, 3);
            assert.strictEqual(context.requests[2].headers.Authorization, 'Bearer fresh-token');
        });

        it('waits for Retry-After on 429 and retries', async function() {

            const context = contextFor({
                responder: (request, index) => {
                    if (index === 0) throw httpError(429, { 'retry-after': '0' });
                    return { data: [] };
                }
            });

            await lib.apiRequest(context, { path: '/v3/jobs' });
            assert.strictEqual(context.requests.length, 2);
        });

        it('reports Greenhouse error details', async function() {

            const context = contextFor({
                responder: () => {
                    throw httpError(422, {}, { message: 'Unprocessable Content', errors: ['from_stage_id is invalid'] });
                }
            });

            await assert.rejects(
                lib.apiRequest(context, { method: 'POST', path: '/v3/applications/1/move', data: {} }),
                /422: Unprocessable Content \(from_stage_id is invalid\)/
            );
        });
    });

    describe('lib.listAll', function() {

        it('follows the Link header without resending the filters', async function() {

            const next = 'https://harvest.greenhouse.io/v3/candidates?cursor=abc';
            const context = contextFor({
                responder: (request, index) => index === 0
                    ? { data: [{ id: 3 }, { id: 2 }], headers: { link: '<' + next + '>; rel="next"' } }
                    : { data: [{ id: 1 }] }
            });

            const { records, truncated } = await lib.listAll(context, '/v3/candidates', { per_page: 2 }, 5);

            assert.deepStrictEqual(records.map(record => record.id), [3, 2, 1]);
            assert.strictEqual(truncated, false);
            assert.strictEqual(context.requests[1].url, next);
            assert.strictEqual(context.requests[1].params, undefined);
        });

        it('refuses a next page link on another host', async function() {

            const context = contextFor({
                responder: () => ({ data: [{ id: 1 }], headers: { link: '<https://evil.example/v3/x>; rel="next"' } })
            });

            await assert.rejects(lib.listAll(context, '/v3/candidates', {}, 5), /outside https:\/\/harvest.greenhouse.io/);
            assert.strictEqual(context.requests.length, 1);
        });
    });

    describe('candidates', function() {

        it('creates a candidate with an application on the picked job', async function() {

            const context = contextFor({
                content: {
                    firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', emailType: 'work',
                    phone: '+1 555 0100', tags: 'referral, backend', jobId: '4433651003'
                },
                responder: () => ({ data: { candidate: { id: 11, first_name: 'Jane' }, application: { id: 22 } } })
            });

            await CreateCandidate.receive(context);

            const request = context.requests[0];
            assert.strictEqual(request.method, 'POST');
            assert.strictEqual(request.url, 'https://harvest.greenhouse.io/v3/candidates');
            assert.deepStrictEqual(request.data, {
                first_name: 'Jane',
                last_name: 'Doe',
                email_addresses: [{ value: 'jane@example.com', type: 'work' }],
                phone_numbers: [{ value: '+1 555 0100', type: 'mobile' }],
                tags: ['referral', 'backend'],
                application: { job_id: 4433651003 }
            });
            assert.deepStrictEqual(context.sent[0], { data: { id: 11, first_name: 'Jane', applicationId: 22 }, port: 'out' });
        });

        it('creates a prospect when no job is picked', async function() {

            const context = contextFor({
                content: { firstName: 'Jane', lastName: 'Doe' },
                responder: () => ({ data: { candidate: { id: 11 }, application: { id: 22 } } })
            });

            await CreateCandidate.receive(context);
            assert.deepStrictEqual(context.requests[0].data, { first_name: 'Jane', last_name: 'Doe' });
        });

        it('patches only the fields that were set and returns an empty object', async function() {

            const context = contextFor({ content: { candidateId: '11', title: 'CTO' } });

            await UpdateCandidate.receive(context);

            assert.strictEqual(context.requests[0].method, 'PATCH');
            assert.strictEqual(context.requests[0].url, 'https://harvest.greenhouse.io/v3/candidates/11');
            assert.deepStrictEqual(context.requests[0].data, { title: 'CTO' });
            assert.deepStrictEqual(context.sent[0], { data: {}, port: 'out' });
        });

        it('refuses a non-numeric candidate id before any request', async function() {

            const context = contextFor({ content: { candidateId: '11/../../users', title: 'CTO' } });

            await assert.rejects(UpdateCandidate.receive(context), CancelError);
            await assert.rejects(DeleteCandidate.receive(contextFor({ content: { candidateId: 'x' } })), CancelError);
            assert.strictEqual(context.requests.length, 0);
        });

        it('gets a candidate through the ids filter and fails when it does not exist', async function() {

            const found = contextFor({ content: { candidateId: '11' }, responder: () => ({ data: [{ id: 11 }] }) });
            await GetCandidate.receive(found);
            assert.deepStrictEqual(found.requests[0].params, { ids: '11' });
            assert.deepStrictEqual(found.sent[0].data, { id: 11 });

            const missing = contextFor({ content: { candidateId: '12' }, responder: () => ({ data: [] }) });
            await assert.rejects(GetCandidate.receive(missing), /Candidate 12 was not found/);
        });

        it('deletes a candidate', async function() {

            const context = contextFor({ content: { candidateId: '11' } });
            await DeleteCandidate.receive(context);
            assert.strictEqual(context.requests[0].method, 'DELETE');
            assert.strictEqual(context.requests[0].url, 'https://harvest.greenhouse.io/v3/candidates/11');
            assert.deepStrictEqual(context.sent[0], { data: {}, port: 'out' });
        });

        it('finds candidates with pipe delimited date filters', async function() {

            const context = contextFor({
                content: { email: 'jane@example.com', createdAfter: '2026-11-01T00:00:00Z', outputType: 'array' },
                responder: () => ({ data: [{ id: 11 }] })
            });

            await FindCandidates.receive(context);

            assert.deepStrictEqual(context.requests[0].params, {
                per_page: 500,
                email: 'jane@example.com',
                created_at: 'gte|2026-11-01T00:00:00.000Z'
            });
            assert.deepStrictEqual(context.sent[0], { data: { result: [{ id: 11 }], count: 1 }, port: 'out' });
        });

        it('sends notFound when no candidate matches, and refuses two date filters', async function() {

            const context = contextFor({ content: { email: 'nobody@example.com' }, responder: () => ({ data: [] }) });
            await FindCandidates.receive(context);
            assert.strictEqual(context.sent[0].port, 'notFound');

            await assert.rejects(FindCandidates.receive(contextFor({
                content: { createdAfter: '2026-11-01T00:00:00Z', updatedAfter: '2026-11-01T00:00:00Z' }
            })), CancelError);
        });
    });

    describe('dropdown sources', function() {

        it('turns jobs into options and swallows errors in the inspector', async function() {

            assert.deepStrictEqual(
                FindJobs.toSelectArray({ result: [{ id: 5, name: 'Engineer', status: 'open' }] }),
                [{ label: 'Engineer (open)', value: '5' }]
            );

            const context = contextFor({
                content: { outputType: 'array' },
                properties: { isSource: true },
                responder: () => { throw httpError(403); }
            });
            await FindJobs.receive(context);
            assert.deepStrictEqual(context.sent[0], { data: { result: [], count: 0 }, port: 'out' });
        });

        it('lists the stages of a job in plan order', async function() {

            const context = contextFor({
                content: { jobId: '5', outputType: 'array' },
                responder: () => ({
                    data: [{ id: 3, sort_order: 2 }, { id: 2, sort_order: 0 }, { id: 1, sort_order: 1 }]
                })
            });

            await ListJobStages.receive(context);

            assert.deepStrictEqual(context.requests[0].params, { job_ids: '5', per_page: 500 });
            assert.deepStrictEqual(context.sent[0].data.result.map(stage => stage.id), [2, 1, 3]);
        });
    });

    describe('applications', function() {

        it('finds applications by candidate and status', async function() {

            const context = contextFor({
                content: { candidateId: '11', status: 'in_process', outputType: 'first' },
                responder: () => ({ data: [{ id: 22 }] })
            });

            await FindApplications.receive(context);

            assert.deepStrictEqual(context.requests[0].params, { per_page: 500, candidate_ids: '11', status: 'in_process' });
            assert.deepStrictEqual(context.sent[0].data, { id: 22, index: 0, count: 1 });
        });

        it('advances an application from its current job interview stage', async function() {

            const context = contextFor({
                content: { applicationId: '22' },
                responder: (request) => request.method === 'GET'
                    ? { data: [{ id: 22, job_interview_stage_id: 301, status: 'in_process' }] }
                    : { status: 204, data: '' }
            });

            await MoveApplication.receive(context);

            assert.deepStrictEqual(context.requests[0].params, { ids: '22' });
            assert.strictEqual(context.requests[1].url, 'https://harvest.greenhouse.io/v3/applications/22/move');
            assert.deepStrictEqual(context.requests[1].data, { from_stage_id: 301 });
            assert.deepStrictEqual(context.sent[0], { data: {}, port: 'out' });
        });

        it('moves to a picked stage with the given current stage without a lookup', async function() {

            const context = contextFor({ content: { applicationId: '22', fromStageId: '301', toStageId: '302' } });

            await MoveApplication.receive(context);

            assert.strictEqual(context.requests.length, 1);
            assert.deepStrictEqual(context.requests[0].data, { from_stage_id: 301, to_stage_id: 302 });
        });

        it('rejects an application with a reason and notes', async function() {

            const context = contextFor({ content: { applicationId: '22', rejectionReasonId: '7', notes: 'Not a fit' } });

            await RejectApplication.receive(context);

            assert.strictEqual(context.requests[0].url, 'https://harvest.greenhouse.io/v3/applications/22/reject');
            assert.deepStrictEqual(context.requests[0].data, { rejection_reason_id: 7, notes: 'Not a fit' });
        });
    });

    describe('MakeApiCall', function() {

        it('calls a path on the Harvest API with the key-value inputs the Designer stores', async function() {

            const context = contextFor({
                content: {
                    url: '/v3/jobs',
                    method: 'GET',
                    parameters: '{"status":"open"}',
                    headers: '{"X-Test":"1"}'
                },
                responder: () => ({ data: [{ id: 5 }] })
            });

            await MakeApiCall.receive(context);

            assert.strictEqual(context.requests[0].url, 'https://harvest.greenhouse.io/v3/jobs');
            assert.deepStrictEqual(context.requests[0].params, { status: 'open' });
            assert.strictEqual(context.requests[0].headers['X-Test'], '1');
            assert.strictEqual(context.requests[0].headers.Authorization, 'Bearer stored-token');
            assert.deepStrictEqual(context.sent[0].data, { statusCode: 200, headers: {}, body: [{ id: 5 }] });
        });

        it('never sends the token to another host', async function() {

            const foreign = ['https://evil.example/v3/jobs', '//evil.example/x', 'https://user:pw@harvest.greenhouse.io/v3/jobs'];
            for (const url of foreign) {
                const context = contextFor({ content: { url, method: 'GET' } });
                await assert.rejects(MakeApiCall.receive(context), CancelError);
                assert.strictEqual(context.requests.length, 0);
            }
        });
    });

    describe('triggers', function() {

        it('NewCandidate records a baseline on the first tick and emits only later candidates', async function() {

            let page = [{ id: 2, created_at: new Date().toISOString() }];
            const context = contextFor({ responder: () => ({ data: page }) });

            await NewCandidate.tick(context);
            assert.strictEqual(context.sent.length, 0);
            assert.deepStrictEqual(context.savedState.known, ['2']);
            assert.match(context.requests[0].params.created_at, /^gte\|\d{4}-\d{2}-\d{2}T/);

            page = [{ id: 3, created_at: new Date().toISOString() }, ...page];
            await NewCandidate.tick(context);
            assert.deepStrictEqual(context.sent.map(item => item.data.id), [3]);

            await NewCandidate.tick(context);
            assert.strictEqual(context.sent.length, 1);
        });

        it('NewCandidate keeps the state when an answer is empty while candidates are known', async function() {

            const context = contextFor({
                state: { since: new Date().toISOString(), known: ['2'] },
                responder: () => ({ data: [] })
            });

            await NewCandidate.tick(context);
            assert.strictEqual(context.savedState, null);
            assert.strictEqual(context.sent.length, 0);
        });

        it('UpdatedApplication fires again when the same application changes and applies the filters', async function() {

            const first = new Date(Date.now() - 1000).toISOString();
            const second = new Date().toISOString();
            let page = [{ id: 22, updated_at: first }];
            const context = contextFor({ properties: { jobId: '5', status: 'hired' }, responder: () => ({ data: page }) });

            await UpdatedApplication.tick(context);
            assert.strictEqual(context.requests[0].params.job_ids, '5');
            assert.strictEqual(context.requests[0].params.status, 'hired');

            page = [{ id: 22, updated_at: second }];
            await UpdatedApplication.tick(context);
            assert.deepStrictEqual(context.sent.map(item => item.data.updated_at), [second]);
        });

        it('test() emits the newest record without touching the state, and throws when there is none', async function() {

            const context = contextFor({ responder: () => ({ data: [{ id: 9 }] }) });
            await NewCandidate.test(context);
            assert.deepStrictEqual(context.requests[0].params, { per_page: 1 });
            assert.deepStrictEqual(context.sent[0], { data: { id: 9 }, port: 'out' });
            assert.strictEqual(context.savedState, null);

            await assert.rejects(UpdatedApplication.test(contextFor({ responder: () => ({ data: [] }) })), CancelError);
        });
    });
});
