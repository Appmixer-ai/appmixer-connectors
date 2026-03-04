'use strict';

const assert = require('assert');
const { Readable } = require('stream');
const sinon = require('sinon');
const testUtils = require('../../../../../test/utils');
const RemoveUsersInCSVFromUserList = require('../../core/RemoveUsersInCSVFromUserList/RemoveUsersInCSVFromUserList');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a Readable stream from a string (simulates getFileReadStream output).
 */
function csvStream(content) {
    const r = new Readable();
    r.push(content);
    r.push(null);
    return r;
}

/**
 * Build a minimal valid CSV with an email column.
 */
function emailCsv(rows) {
    const header = 'email';
    const lines = rows.map(r => r.email);
    return [header, ...lines].join('\n');
}

// ---------------------------------------------------------------------------
// Shared API response stubs
// ---------------------------------------------------------------------------

const JOB_RESOURCE = 'customers/7122133715/offlineUserDataJobs/222';
const USER_LIST_RESOURCE = 'customers/7122133715/userLists/9329730810';
const OPERATION_NAME = 'operations/jobs~222';

function stubApiResponses(context, { partialFailureError = null } = {}) {
    context.httpRequest.callsFake(({ url }) => {
        if (url.includes(':addOperations')) {
            return Promise.resolve({ data: { partialFailureError: partialFailureError || null } });
        }
        if (url.includes(':run')) {
            return Promise.resolve({ data: OPERATION_NAME });
        }
        if (url.includes('offlineUserDataJobs')) {
            // create-job endpoint (no action suffix)
            return Promise.resolve({ data: { resourceName: JOB_RESOURCE } });
        }
        return Promise.resolve({ data: {} });
    });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RemoveUsersInCSVFromUserList', () => {

    let context;

    beforeEach(() => {
        context = testUtils.createMockContext();
        context.messages = { in: { content: {} } };
        context.clearTimeout = sinon.stub().resolves();
        context.auth = { accessToken: 'test-access-token' };
        context.config = {};
        context.setTimeout = sinon.stub().resolves('timeout-id-1');
    });

    // -----------------------------------------------------------------------
    // Required input validation
    // -----------------------------------------------------------------------

    describe('Required input validation', () => {

        it('throws when fileId is missing', async () => {
            context.messages.in.content = {
                customerId: '7122133715',
                developerToken: 'dev-token',
                userListId: '9329730810'
            };

            await assert.rejects(() => RemoveUsersInCSVFromUserList.receive(context), {
                message: 'File is required!'
            });
        });

        it('throws when customerId is missing', async () => {
            context.messages.in.content = {
                fileId: 'file-abc',
                developerToken: 'dev-token',
                userListId: '9329730810'
            };

            await assert.rejects(() => RemoveUsersInCSVFromUserList.receive(context), {
                message: 'Customer ID is required!'
            });
        });

        it('throws when developerToken is missing', async () => {
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7122133715',
                userListId: '9329730810'
            };

            await assert.rejects(() => RemoveUsersInCSVFromUserList.receive(context), {
                message: 'Developer Token is required!'
            });
        });

        it('throws when userListId is missing', async () => {
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7122133715',
                developerToken: 'dev-token'
            };

            await assert.rejects(() => RemoveUsersInCSVFromUserList.receive(context), {
                message: 'User List ID is required!'
            });
        });
    });

    // -----------------------------------------------------------------------
    // Successful remove – small CSV (single chunk, no continuation)
    // -----------------------------------------------------------------------

    describe('Successful small CSV remove', () => {

        const CSV = emailCsv([
            { email: 'alice@example.com' },
            { email: 'bob@example.com' },
            { email: 'carol@example.com' }
        ]);

        beforeEach(() => {
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7122133715',
                developerToken: 'dev-token',
                userListId: '9329730810'
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(CSV)));
            stubApiResponses(context);
        });

        it('calls createJob, addOperations and run exactly once each', async () => {
            await RemoveUsersInCSVFromUserList.receive(context);

            const urls = context.httpRequest.getCalls().map(c => c.args[0].url);
            assert.ok(
                urls.some(u => u.includes('offlineUserDataJobs') && !u.includes(':addOperations') && !u.includes(':run')),
                'createJob called'
            );
            assert.ok(urls.some(u => u.includes(':addOperations')), 'addOperations called');
            assert.ok(urls.some(u => u.includes(':run')), 'runJob called');
        });

        it('sends result to "out" port with correct counts', async () => {
            await RemoveUsersInCSVFromUserList.receive(context);

            const outCalls = context.sendJson.getCalls().filter(c => c.args[1] === 'out');
            assert.strictEqual(outCalls.length, 1);

            const result = outCalls[0].args[0];
            assert.strictEqual(result.totalUsers, 3);
            assert.strictEqual(result.totalRows, 3);
            assert.strictEqual(result.totalSkipped, 0);
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.jobResourceName, JOB_RESOURCE);
            assert.deepStrictEqual(result.errors, []);
            assert.deepStrictEqual(result.internalErrors, []);
        });

        it('does not schedule a continuation', async () => {
            await RemoveUsersInCSVFromUserList.receive(context);
            assert.strictEqual(context.setTimeout.callCount, 0);
        });

        it('sets Authorization and developer-token headers', async () => {
            await RemoveUsersInCSVFromUserList.receive(context);

            const createJobCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes('offlineUserDataJobs') && !c.args[0].url.includes(':addOperations') && !c.args[0].url.includes(':run'));

            assert.ok(createJobCall, 'create-job call found');
            const headers = createJobCall.args[0].headers;
            assert.strictEqual(headers['Authorization'], 'Bearer test-access-token');
            assert.strictEqual(headers['developer-token'], 'dev-token');
        });

        it('sets login-customer-id header when loginCustomerId is provided', async () => {
            context.messages.in.content.loginCustomerId = '999-888-7777';

            await RemoveUsersInCSVFromUserList.receive(context);

            const createJobCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes('offlineUserDataJobs') && !c.args[0].url.includes(':addOperations') && !c.args[0].url.includes(':run'));

            assert.strictEqual(createJobCall.args[0].headers['login-customer-id'], '9998887777');
        });

        it('does not set login-customer-id header when loginCustomerId is absent', async () => {
            await RemoveUsersInCSVFromUserList.receive(context);

            const createJobCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes('offlineUserDataJobs') && !c.args[0].url.includes(':addOperations') && !c.args[0].url.includes(':run'));

            assert.ok(!('login-customer-id' in createJobCall.args[0].headers));
        });
    });

    // -----------------------------------------------------------------------
    // Operations use "remove" (not "create")
    // -----------------------------------------------------------------------

    describe('Remove operation semantics', () => {

        it('sends "remove" operations (not "create") to addOperations', async () => {
            const csv = emailCsv([{ email: 'alice@example.com' }]);
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7122133715',
                developerToken: 'dev-token',
                userListId: '9329730810'
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            await RemoveUsersInCSVFromUserList.receive(context);

            const addOpsCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes(':addOperations'));
            const ops = addOpsCall.args[0].data.operations;
            assert.strictEqual(ops.length, 1);
            assert.ok('remove' in ops[0], 'operation uses "remove" key');
            assert.ok(!('create' in ops[0]), 'operation does not use "create" key');
        });

        it('does not include uploadMode / uploadKeyType in the job body', async () => {
            const csv = emailCsv([{ email: 'alice@example.com' }]);
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7122133715',
                developerToken: 'dev-token',
                userListId: '9329730810'
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            await RemoveUsersInCSVFromUserList.receive(context);

            const createJobCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes('offlineUserDataJobs') && !c.args[0].url.includes(':addOperations') && !c.args[0].url.includes(':run'));
            const body = createJobCall.args[0].data;
            assert.ok(!body.job.customerMatchUserListMetadata.uploadKeyType, 'no uploadKeyType');
        });
    });

    // -----------------------------------------------------------------------
    // CSV with rows that have no usable identifier (skipped rows)
    // -----------------------------------------------------------------------

    describe('CSV with unidentifiable rows', () => {

        it('counts rows without any identifier as skipped', async () => {
            const csv = 'email,notes\nalice@example.com,ok\nbob@example.com,ok\n,no-email\n';
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7122133715',
                developerToken: 'dev-token',
                userListId: '9329730810'
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            await RemoveUsersInCSVFromUserList.receive(context);

            const outCalls = context.sendJson.getCalls().filter(c => c.args[1] === 'out');
            const result = outCalls[0].args[0];
            assert.strictEqual(result.totalUsers, 2);
            assert.strictEqual(result.totalSkipped, 1);
            assert.strictEqual(result.totalRows, 3);
        });
    });

    // -----------------------------------------------------------------------
    // Partial failure handling
    // -----------------------------------------------------------------------

    describe('Partial failure from Google Ads API', () => {

        it('records partial failure error in errors array while success remains true', async () => {
            const csv = emailCsv([{ email: 'alice@example.com' }]);
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7122133715',
                developerToken: 'dev-token',
                userListId: '9329730810'
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context, { partialFailureError: { code: 3, message: 'User not found' } });

            await RemoveUsersInCSVFromUserList.receive(context);

            const outCalls = context.sendJson.getCalls().filter(c => c.args[1] === 'out');
            const result = outCalls[0].args[0];
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.errors.length, 1);
        });
    });

    // -----------------------------------------------------------------------
    // Column-name flexibility
    // -----------------------------------------------------------------------

    describe('Column-name flexibility', () => {

        async function removeCsv(csvContent) {
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7122133715',
                developerToken: 'dev-token',
                userListId: '9329730810'
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csvContent)));
            stubApiResponses(context);
            await RemoveUsersInCSVFromUserList.receive(context);
            const outCalls = context.sendJson.getCalls().filter(c => c.args[1] === 'out');
            return outCalls[0].args[0];
        }

        it('handles "email_address" column alias', async () => {
            const result = await removeCsv('email_address\nalice@example.com\n');
            assert.strictEqual(result.totalUsers, 1);
        });

        it('handles "phone_number" column alias', async () => {
            const result = await removeCsv('phone_number\n+14155552671\n');
            assert.strictEqual(result.totalUsers, 1);
        });

        it('handles case-insensitive column names (EMAIL, Phone)', async () => {
            const result = await removeCsv('EMAIL,Phone\nalice@example.com,+14155552671\n');
            assert.strictEqual(result.totalUsers, 1);
        });

        it('handles address-based matching (first_name + last_name + country_code)', async () => {
            const csv = 'first_name,last_name,country_code\nJohn,Doe,US\n';
            const result = await removeCsv(csv);
            assert.strictEqual(result.totalUsers, 1);
        });

        it('handles "mobile_id" column', async () => {
            const result = await removeCsv('mobile_id\nAEBE52E7-03EE-455A-B3C4-E57283966239\n');
            assert.strictEqual(result.totalUsers, 1);
        });

        it('handles "third_party_user_id" column', async () => {
            const result = await removeCsv('third_party_user_id\nuser_42\n');
            assert.strictEqual(result.totalUsers, 1);
        });
    });

    // -----------------------------------------------------------------------
    // Continuation scheduling
    // -----------------------------------------------------------------------

    describe('Continuation scheduling', () => {

        it('schedules a continuation when timeout trigger fires mid-removal', async () => {
            context.config.batchSize = '1';
            context.config.timeoutSeconds = '60';
            context.config.timeoutTriggerSeconds = '1';

            const baseTime = 1000000;
            let dateCallCount = 0;
            const dateNowStub = sinon.stub(Date, 'now').callsFake(() => {
                return dateCallCount++ <= 1 ? baseTime : baseTime + 2000;
            });

            const csv = 'email\nalice@example.com\nbob@example.com\ncarol@example.com\n';

            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7122133715',
                developerToken: 'dev-token',
                userListId: '9329730810'
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            try {
                await RemoveUsersInCSVFromUserList.receive(context);
            } finally {
                dateNowStub.restore();
            }

            assert.strictEqual(context.setTimeout.callCount, 1);

            const continuationState = context.setTimeout.getCall(0).args[0];
            assert.ok(continuationState.fileId, 'state.fileId present');
            assert.ok(continuationState.customerId, 'state.customerId present');
            assert.strictEqual(typeof continuationState.lastProcessedRow, 'number');
            assert.strictEqual(typeof continuationState.totalUsersRemoved, 'number');
        });

        it('resumes from saved state on continuation', async () => {
            const continuationState = {
                fileId: 'file-abc',
                customerId: '7122133715',
                developerToken: 'dev-token',
                loginCustomerId: null,
                userListResourceName: USER_LIST_RESOURCE,
                batchSize: 10000,
                columnSeparator: ',',
                adPersonalization: null,
                adUserData: null,
                uploadStartMs: Date.now() - 5000,
                lastProcessedRow: 2,   // already processed 2 rows
                totalRows: 4,          // 4 rows total
                totalUsersRemoved: 2,
                totalUsersSkipped: 0,
                totalPartialFailures: 0,
                errors: [],
                internalErrors: [],
                jobResourceName: JOB_RESOURCE,
                jobsRun: []
            };

            context.messages = { timeout: { content: continuationState } };

            const csv = emailCsv([
                { email: 'a@example.com' },
                { email: 'b@example.com' },
                { email: 'c@example.com' },
                { email: 'd@example.com' }
            ]);
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            await RemoveUsersInCSVFromUserList.receive(context);

            const outCalls = context.sendJson.getCalls().filter(c => c.args[1] === 'out');
            assert.strictEqual(outCalls.length, 1);

            const result = outCalls[0].args[0];
            // Continued from row 2 → should process remaining 2 rows + carry over 2
            assert.strictEqual(result.totalUsers, 4);
            assert.strictEqual(result.totalRows, 4);
            assert.strictEqual(result.success, true);
        });

        it('ignores stale continuation messages that have no fileId', async () => {
            context.messages = { timeout: { content: { customerId: '123' } } }; // no fileId

            await RemoveUsersInCSVFromUserList.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 0);
            assert.strictEqual(context.sendJson.callCount, 0);
        });
    });

    // -----------------------------------------------------------------------
    // stop() hook
    // -----------------------------------------------------------------------

    describe('stop()', () => {

        it('cancels a pending timeout if one is stored in state', async () => {
            context.stateGet = sinon.stub().resolves('timeout-id-1');

            await RemoveUsersInCSVFromUserList.stop(context);

            assert.strictEqual(context.clearTimeout.callCount, 1);
            assert.strictEqual(context.clearTimeout.getCall(0).args[0], 'timeout-id-1');
            assert.strictEqual(context.stateUnset.callCount, 1);
        });

        it('does nothing when there is no stored timeout', async () => {
            context.stateGet = sinon.stub().resolves(null);

            await RemoveUsersInCSVFromUserList.stop(context);

            assert.strictEqual(context.clearTimeout.callCount, 0);
        });
    });

    // -----------------------------------------------------------------------
    // Consent fields
    // -----------------------------------------------------------------------

    describe('Consent fields', () => {

        it('includes consent in user data when adPersonalization and adUserData are set', async () => {
            const csv = emailCsv([{ email: 'alice@example.com' }]);
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7122133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                adPersonalization: 'GRANTED',
                adUserData: 'GRANTED'
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            await RemoveUsersInCSVFromUserList.receive(context);

            const addOpsCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes(':addOperations'));
            const ops = addOpsCall.args[0].data.operations;
            assert.strictEqual(ops.length, 1);
            assert.strictEqual(ops[0].remove.consent.adPersonalization, 'GRANTED');
            assert.strictEqual(ops[0].remove.consent.adUserData, 'GRANTED');
        });

        it('omits consent object when no consent fields are provided', async () => {
            const csv = emailCsv([{ email: 'alice@example.com' }]);
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7122133715',
                developerToken: 'dev-token',
                userListId: '9329730810'
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            await RemoveUsersInCSVFromUserList.receive(context);

            const addOpsCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes(':addOperations'));
            const ops = addOpsCall.args[0].data.operations;
            assert.strictEqual(ops[0].remove.consent, undefined);
        });
    });

    // -----------------------------------------------------------------------
    // Customer ID normalisation
    // -----------------------------------------------------------------------

    describe('Customer ID normalisation', () => {

        it('strips hyphens from customerId when building the API URL', async () => {
            const csv = emailCsv([{ email: 'alice@example.com' }]);
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '712-213-3715',
                developerToken: 'dev-token',
                userListId: '9329730810'
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            await RemoveUsersInCSVFromUserList.receive(context);

            const createJobCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes('offlineUserDataJobs') && !c.args[0].url.includes(':addOperations') && !c.args[0].url.includes(':run'));
            assert.ok(createJobCall.args[0].url.includes('7122133715'), 'normalised customer ID in URL');
        });
    });

    // -----------------------------------------------------------------------
    // Empty CSV
    // -----------------------------------------------------------------------

    describe('Empty CSV', () => {

        it('sends out with zero counts when CSV has only a header row', async () => {
            const csv = 'email\n';
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7122133715',
                developerToken: 'dev-token',
                userListId: '9329730810'
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            context.httpRequest.callsFake(({ url }) => {
                if (url.includes('offlineUserDataJobs') && !url.includes(':')) {
                    return Promise.resolve({ data: { resourceName: JOB_RESOURCE } });
                }
                if (url.includes(':run')) {
                    return Promise.resolve({ data: OPERATION_NAME });
                }
                return Promise.resolve({ data: {} });
            });

            await RemoveUsersInCSVFromUserList.receive(context);

            const outCalls = context.sendJson.getCalls().filter(c => c.args[1] === 'out');
            const result = outCalls[0].args[0];
            assert.strictEqual(result.totalUsers, 0);
            assert.strictEqual(result.totalRows, 0);
            assert.strictEqual(result.success, true);
        });
    });
});
