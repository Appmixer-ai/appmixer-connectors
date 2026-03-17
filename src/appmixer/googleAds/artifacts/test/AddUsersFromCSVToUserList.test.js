'use strict';

const assert = require('assert');
const { Readable } = require('stream');
const sinon = require('sinon');
const testUtils = require('../../../../../test/utils');
const AddUsersFromCSVToUserList = require('../../core/AddUsersFromCSVToUserList/AddUsersFromCSVToUserList');

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

const SHARED_CSV_HEADER = 'first_name,last_name,personal_emails,personal_phone,mobile_phone,additional_personal_emails,personal_emails_validation_status,personal_emails_last_seen,linkedin_url,personal_address,personal_address_2,personal_city,personal_state,personal_zip,personal_zip4,contact_country,gender,age_range,married,children,income_range,net_worth,homeowner,job_title,job_title_normalized,job_title_last_updated,seniority_level,seniority_level_2,department,department_2,business_email,programmatic_business_emails,business_email_validation_status,business_email_last_seen,direct_number,professional_address,professional_address_2,professional_city,professional_state,professional_zip,professional_zip4,company_name,company_domain,company_phone,company_sic,company_naics,company_address,company_city,company_state,company_zip,company_country,company_revenue,company_employee_count,primary_industry,company_last_updated,last_updated';

function sharedAudienceCsv(overrides = {}) {
    const columns = SHARED_CSV_HEADER.split(',');
    const defaults = {
        first_name: 'Avery',
        last_name: 'Stone',
        personal_emails: 'avery.stone@example.test',
        personal_phone: '+12025550101',
        mobile_phone: '+12025550102',
        additional_personal_emails: 'avery.alt@example.test',
        personal_emails_validation_status: 'Valid',
        personal_emails_last_seen: '2026-01-15 19:00:00',
        linkedin_url: 'https://linkedin.example.test/in/avery-stone',
        personal_address: '101 Cedar Ave',
        personal_city: 'Springfield',
        personal_state: 'IL',
        personal_zip: '62704',
        contact_country: 'US',
        gender: 'X',
        age_range: '35-44',
        married: 'N',
        homeowner: 'Y',
        job_title: 'Founder',
        job_title_normalized: 'founder',
        job_title_last_updated: '2026-01-10 08:00:00',
        seniority_level: 'Cxo',
        seniority_level_2: 'owner',
        department: 'Operations',
        department_2: 'Leadership',
        business_email: 'avery@work.example.test',
        programmatic_business_emails: '\\N',
        business_email_validation_status: 'Valid',
        business_email_last_seen: '2026-01-15 19:00:00',
        direct_number: '+12025550103',
        professional_address: '200 Market St',
        professional_city: 'Chicago',
        professional_state: 'IL',
        professional_zip: '60601',
        company_name: 'Example Company',
        company_domain: 'example.test',
        company_phone: '+12025550999',
        company_sic: '7372',
        company_naics: '541511',
        company_address: '200 Market St',
        company_city: 'Chicago',
        company_state: 'IL',
        company_zip: '60601',
        company_country: 'US',
        company_revenue: '5000000',
        company_employee_count: '25',
        primary_industry: 'Software',
        company_last_updated: '2026-01-12 10:00:00',
        last_updated: '2026-01-15 19:00:00'
    };

    const row = columns.map(column => overrides[column] ?? defaults[column] ?? '');
    return [SHARED_CSV_HEADER, row.join(',')].join('\n');
}

function googleAdsSchema(mappings) {
    return { ADD: mappings };
}

const BASIC_EMAIL_SCHEMA = googleAdsSchema([
    { csvHeader: 'email', googleAdsType: 'email' }
]);

// ---------------------------------------------------------------------------
// Shared API response stubs
// ---------------------------------------------------------------------------

const JOB_RESOURCE = 'customers/7123133715/offlineUserDataJobs/111';
const USER_LIST_RESOURCE = 'customers/7123133715/userLists/9329730810';
const OPERATION_NAME = 'operations/jobs~111';

function stubApiResponses(context, { partialFailureError = null } = {}) {
    // POST /offlineUserDataJobs  → create job
    // POST /offlineUserDataJobs/111:addOperations → add ops
    // POST /offlineUserDataJobs/111:run → run
    context.httpRequest.callsFake(({ url }) => {
        if (url.includes(':addOperations')) {
            return Promise.resolve({ data: { partialFailureError: partialFailureError || null } });
        }
        if (url.includes(':run')) {
            return Promise.resolve({ data: OPERATION_NAME });
        }
        if (url.includes('offlineUserDataJobs')) {
            // create-job endpoint (no action suffix like :addOperations or :run)
            return Promise.resolve({ data: { resourceName: JOB_RESOURCE } });
        }
        return Promise.resolve({ data: {} });
    });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AddUsersFromCSVToUserList', () => {

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
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810'
            };

            await assert.rejects(() => AddUsersFromCSVToUserList.receive(context), {
                message: 'File is required!'
            });
        });

        it('throws when customerId is missing', async () => {
            context.messages.in.content = {
                fileId: 'file-abc',
                developerToken: 'dev-token',
                userListId: '9329730810'
            };

            await assert.rejects(() => AddUsersFromCSVToUserList.receive(context), {
                message: 'Customer ID is required!'
            });
        });

        it('throws when developerToken is missing', async () => {
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                userListId: '9329730810'
            };

            await assert.rejects(() => AddUsersFromCSVToUserList.receive(context), {
                message: 'Developer Token is required!'
            });
        });

        it('throws when userListId is missing', async () => {
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token'
            };

            await assert.rejects(() => AddUsersFromCSVToUserList.receive(context), {
                message: 'User List ID is required!'
            });
        });

        it('throws when schema is missing', async () => {
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810'
            };

            await assert.rejects(() => AddUsersFromCSVToUserList.receive(context), {
                message: 'Schema is required!'
            });
        });
    });

    // -----------------------------------------------------------------------
    // Successful upload – small CSV (single chunk, no continuation)
    // -----------------------------------------------------------------------

    describe('Successful small CSV upload', () => {

        const CSV = emailCsv([
            { email: 'alice@example.com' },
            { email: 'bob@example.com' },
            { email: 'carol@example.com' }
        ]);

        beforeEach(() => {
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: BASIC_EMAIL_SCHEMA
            };
            // Return the same CSV stream on every getFileReadStream call
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(CSV)));
            stubApiResponses(context);
        });

        it('calls createJob, addOperations and run exactly once each', async () => {
            await AddUsersFromCSVToUserList.receive(context);

            const urls = context.httpRequest.getCalls().map(c => c.args[0].url);
            // create-job: contains offlineUserDataJobs but NOT the action suffixes
            assert.ok(
                urls.some(u => u.includes('offlineUserDataJobs') && !u.includes(':addOperations') && !u.includes(':run')),
                'createJob called'
            );
            assert.ok(urls.some(u => u.includes(':addOperations')), 'addOperations called');
            assert.ok(urls.some(u => u.includes(':run')), 'runJob called');
        });

        it('sends result to "out" port with correct counts', async () => {
            await AddUsersFromCSVToUserList.receive(context);

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
            await AddUsersFromCSVToUserList.receive(context);
            assert.strictEqual(context.setTimeout.callCount, 0);
        });

        it('sets Authorization and developer-token headers', async () => {
            await AddUsersFromCSVToUserList.receive(context);

            const createJobCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes('offlineUserDataJobs') && !c.args[0].url.includes(':addOperations') && !c.args[0].url.includes(':run'));

            assert.ok(createJobCall, 'create-job call found');
            const headers = createJobCall.args[0].headers;
            assert.strictEqual(headers['Authorization'], 'Bearer test-access-token');
            assert.strictEqual(headers['developer-token'], 'dev-token');
        });

        it('sets login-customer-id header when loginCustomerId is provided', async () => {
            context.messages.in.content.loginCustomerId = '999-888-7777';

            await AddUsersFromCSVToUserList.receive(context);

            const createJobCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes('offlineUserDataJobs') && !c.args[0].url.includes(':addOperations') && !c.args[0].url.includes(':run'));

            assert.strictEqual(createJobCall.args[0].headers['login-customer-id'], '9998887777');
        });

        it('does not set login-customer-id header when loginCustomerId is absent', async () => {
            await AddUsersFromCSVToUserList.receive(context);

            const createJobCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes('offlineUserDataJobs') && !c.args[0].url.includes(':addOperations') && !c.args[0].url.includes(':run'));

            assert.ok(!('login-customer-id' in createJobCall.args[0].headers));
        });
    });

    // -----------------------------------------------------------------------
    // CSV with rows that have no usable identifier (skipped rows)
    // -----------------------------------------------------------------------

    describe('CSV with unidentifiable rows', () => {

        it('counts rows without any identifier as skipped', async () => {
            // Only the first two rows have emails; the third has no usable field
            const csv = 'email,notes\nalice@example.com,ok\nbob@example.com,ok\n,no-email\n';
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: BASIC_EMAIL_SCHEMA
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            await AddUsersFromCSVToUserList.receive(context);

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
            // NOTE: success reflects internalErrors only; partialFailureError goes to errors[].
            const csv = emailCsv([{ email: 'alice@example.com' }]);
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: BASIC_EMAIL_SCHEMA
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context, { partialFailureError: { code: 3, message: 'Invalid email' } });

            await AddUsersFromCSVToUserList.receive(context);

            const outCalls = context.sendJson.getCalls().filter(c => c.args[1] === 'out');
            const result = outCalls[0].args[0];
            // success is only false when internalErrors occur, not partial API failures
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.errors.length, 1);
        });
    });

    // -----------------------------------------------------------------------
    // Explicit schema mapping
    // -----------------------------------------------------------------------

    describe('Explicit schema mapping', () => {

        it('uses the mapped email column', async () => {
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: googleAdsSchema([{ csvHeader: 'email_address', googleAdsType: 'email' }])
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream('email_address\nalice@example.com\n')));
            stubApiResponses(context);

            await AddUsersFromCSVToUserList.receive(context);

            const outCalls = context.sendJson.getCalls().filter(c => c.args[1] === 'out');
            assert.strictEqual(outCalls[0].args[0].totalUsers, 1);
        });

        it('uses the mapped phone column', async () => {
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: googleAdsSchema([{ csvHeader: 'phone_number', googleAdsType: 'phoneNumber' }])
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream('phone_number\n+14155552671\n')));
            stubApiResponses(context);

            await AddUsersFromCSVToUserList.receive(context);

            const outCalls = context.sendJson.getCalls().filter(c => c.args[1] === 'out');
            assert.strictEqual(outCalls[0].args[0].totalUsers, 1);
        });

        it('matches mapped headers case-insensitively', async () => {
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: googleAdsSchema([
                    { csvHeader: 'email', googleAdsType: 'email' },
                    { csvHeader: 'phone', googleAdsType: 'phoneNumber' }
                ])
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream('EMAIL,Phone\nalice@example.com,+14155552671\n')));
            stubApiResponses(context);

            await AddUsersFromCSVToUserList.receive(context);

            const outCalls = context.sendJson.getCalls().filter(c => c.args[1] === 'out');
            assert.strictEqual(outCalls[0].args[0].totalUsers, 1);
        });

        it('uses mapped address fields', async () => {
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: googleAdsSchema([
                    { csvHeader: 'first_name', googleAdsType: 'firstName' },
                    { csvHeader: 'last_name', googleAdsType: 'lastName' },
                    { csvHeader: 'country_code', googleAdsType: 'countryCode' }
                ])
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream('first_name,last_name,country_code\nJohn,Doe,US\n')));
            stubApiResponses(context);

            await AddUsersFromCSVToUserList.receive(context);

            const outCalls = context.sendJson.getCalls().filter(c => c.args[1] === 'out');
            assert.strictEqual(outCalls[0].args[0].totalUsers, 1);
        });

        it('uses the mapped mobile ID column', async () => {
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: googleAdsSchema([{ csvHeader: 'mobile_id', googleAdsType: 'mobileId' }])
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream('mobile_id\nAEBE52E7-03EE-455A-B3C4-E57283966239\n')));
            stubApiResponses(context);

            await AddUsersFromCSVToUserList.receive(context);

            const outCalls = context.sendJson.getCalls().filter(c => c.args[1] === 'out');
            assert.strictEqual(outCalls[0].args[0].totalUsers, 1);
        });

        it('uses the mapped third-party user ID column', async () => {
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: googleAdsSchema([{ csvHeader: 'third_party_user_id', googleAdsType: 'thirdPartyUserId' }])
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream('third_party_user_id\nuser_42\n')));
            stubApiResponses(context);

            await AddUsersFromCSVToUserList.receive(context);

            const outCalls = context.sendJson.getCalls().filter(c => c.args[1] === 'out');
            assert.strictEqual(outCalls[0].args[0].totalUsers, 1);
        });

        it('accepts the anonymized shared Facebook-style CSV format', async () => {
            const csv = sharedAudienceCsv();
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: googleAdsSchema([
                    { csvHeader: 'personal_emails', googleAdsType: 'email' },
                    { csvHeader: 'additional_personal_emails', googleAdsType: 'email' },
                    { csvHeader: 'business_email', googleAdsType: 'email' },
                    { csvHeader: 'personal_phone', googleAdsType: 'phoneNumber' },
                    { csvHeader: 'mobile_phone', googleAdsType: 'phoneNumber' },
                    { csvHeader: 'direct_number', googleAdsType: 'phoneNumber' },
                    { csvHeader: 'first_name', googleAdsType: 'firstName' },
                    { csvHeader: 'last_name', googleAdsType: 'lastName' },
                    { csvHeader: 'contact_country', googleAdsType: 'countryCode' },
                    { csvHeader: 'personal_zip', googleAdsType: 'postalCode' }
                ])
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            await AddUsersFromCSVToUserList.receive(context);

            const addOpsCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes(':addOperations'));
            const userIdentifiers = addOpsCall.args[0].data.operations[0].create.userIdentifiers;

            assert.strictEqual(userIdentifiers.filter(identifier => identifier.hashedEmail).length, 3);
            assert.strictEqual(userIdentifiers.filter(identifier => identifier.hashedPhoneNumber).length, 3);
            assert.ok(
                userIdentifiers.some(identifier => identifier.addressInfo
                    && identifier.addressInfo.countryCode === 'US'
                    && identifier.addressInfo.postalCode === '62704')
            );
        });

        it('uses explicit schema mapping for arbitrary CSV headers', async () => {
            const csv = 'alpha,beta,gamma,delta\ncasey@example.test,Casey,Rivera,US\n';
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: googleAdsSchema([
                    { csvHeader: 'alpha', googleAdsType: 'email' },
                    { csvHeader: 'beta', googleAdsType: 'firstName' },
                    { csvHeader: 'gamma', googleAdsType: 'lastName' },
                    { csvHeader: 'delta', googleAdsType: 'countryCode' }
                ])
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            await AddUsersFromCSVToUserList.receive(context);

            const addOpsCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes(':addOperations'));
            const userIdentifiers = addOpsCall.args[0].data.operations[0].create.userIdentifiers;

            assert.strictEqual(userIdentifiers.filter(identifier => identifier.hashedEmail).length, 1);
            assert.ok(userIdentifiers.some(identifier => identifier.addressInfo));
        });
    });

    // -----------------------------------------------------------------------
    // Continuation scheduling
    // -----------------------------------------------------------------------

    describe('Continuation scheduling', () => {

        it('schedules a continuation when timeout trigger fires mid-upload', async () => {
            // Process one row per batch so shouldContinue is evaluated between each row.
            // Stub Date.now so that after the first batch the elapsed time exceeds
            // the 1-second trigger window.
            context.config.batchSize = '1';           // one row per iteration
            context.config.timeoutSeconds = '60';
            context.config.timeoutTriggerSeconds = '1'; // 1 second → 1000ms

            const baseTime = 1000000;
            let dateCallCount = 0;
            const dateNowStub = sinon.stub(Date, 'now').callsFake(() => {
                // Date.now() call order inside receive():
                //   #0: uploadStartMs (line ~280)
                //   #1: receiveStartMs (line ~315)  ← we need this to equal baseTime
                //   #2+: all subsequent calls (lastProgressMs, isUploadExpired, now, shouldContinue)
                // We return baseTime for calls 0 and 1 so receiveStartMs = baseTime,
                // then +2000ms for every later call so shouldContinue triggers.
                return dateCallCount++ <= 1 ? baseTime : baseTime + 2000;
            });

            // CSV with 3 rows so there are more rows left after the first batch
            const csv = 'email\nalice@example.com\nbob@example.com\ncarol@example.com\n';

            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: BASIC_EMAIL_SCHEMA
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            try {
                await AddUsersFromCSVToUserList.receive(context);
            } finally {
                dateNowStub.restore();
            }

            // Should have scheduled a continuation after the first batch
            assert.strictEqual(context.setTimeout.callCount, 1);

            // The state passed to setTimeout must contain the required fields
            const continuationState = context.setTimeout.getCall(0).args[0];
            assert.ok(continuationState.fileId, 'state.fileId present');
            assert.ok(continuationState.customerId, 'state.customerId present');
            assert.strictEqual(typeof continuationState.lastProcessedRow, 'number');
            assert.strictEqual(typeof continuationState.totalUsersUploaded, 'number');
        });

        it('resumes from saved state on continuation', async () => {
            // Simulate a continuation message with state from a previous invocation
            const continuationState = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                loginCustomerId: null,
                userListResourceName: USER_LIST_RESOURCE,
                uploadMode: 'ADD',
                schema: BASIC_EMAIL_SCHEMA,
                batchSize: 10000,
                columnSeparator: ',',
                adPersonalization: null,
                adUserData: null,
                uploadStartMs: Date.now() - 5000,
                lastProcessedRow: 2,   // already processed 2 rows
                totalRows: 4,          // 4 rows total
                totalUsersUploaded: 2,
                totalUsersSkipped: 0,
                totalPartialFailures: 0,
                errors: [],
                internalErrors: [],
                jobs: { [USER_LIST_RESOURCE]: JOB_RESOURCE },
                jobsRun: [],
                jobRunning: JOB_RESOURCE
            };

            context.messages = { timeout: { content: continuationState } };

            // Stream with 4 rows; the continuation should only read rows 2-3
            const csv = emailCsv([
                { email: 'a@example.com' },
                { email: 'b@example.com' },
                { email: 'c@example.com' },
                { email: 'd@example.com' }
            ]);
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            await AddUsersFromCSVToUserList.receive(context);

            const outCalls = context.sendJson.getCalls().filter(c => c.args[1] === 'out');
            assert.strictEqual(outCalls.length, 1);

            const result = outCalls[0].args[0];
            // Continued from row 2 → should upload remaining 2 rows + carry over 2
            assert.strictEqual(result.totalUsers, 4);
            assert.strictEqual(result.totalRows, 4);
            assert.strictEqual(result.success, true);
        });

        it('ignores stale continuation messages that have no fileId', async () => {
            context.messages = { timeout: { content: { customerId: '123' } } }; // no fileId

            await AddUsersFromCSVToUserList.receive(context);

            // Should return early without doing anything
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

            await AddUsersFromCSVToUserList.stop(context);

            assert.strictEqual(context.clearTimeout.callCount, 1);
            assert.strictEqual(context.clearTimeout.getCall(0).args[0], 'timeout-id-1');
            assert.strictEqual(context.stateUnset.callCount, 1);
        });

        it('does nothing when there is no stored timeout', async () => {
            context.stateGet = sinon.stub().resolves(null);

            await AddUsersFromCSVToUserList.stop(context);

            assert.strictEqual(context.clearTimeout.callCount, 0);
        });
    });

    // -----------------------------------------------------------------------
    // Upload mode
    // -----------------------------------------------------------------------

    describe('Upload mode', () => {

        it('defaults to ADD upload mode', async () => {
            const csv = emailCsv([{ email: 'alice@example.com' }]);
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: BASIC_EMAIL_SCHEMA
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            await AddUsersFromCSVToUserList.receive(context);

            // The createJob body should not contain uploadKeyType for ADD mode
            const createJobCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes('offlineUserDataJobs') && !c.args[0].url.includes(':addOperations') && !c.args[0].url.includes(':run'));
            const body = createJobCall.args[0].data;
            assert.ok(!body.job.customerMatchUserListMetadata.uploadKeyType, 'no uploadKeyType for ADD');
        });

        it('sets uploadKeyType for REPLACE mode', async () => {
            const csv = emailCsv([{ email: 'alice@example.com' }]);
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: BASIC_EMAIL_SCHEMA,
                uploadMode: 'REPLACE'
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            await AddUsersFromCSVToUserList.receive(context);

            const createJobCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes('offlineUserDataJobs') && !c.args[0].url.includes(':addOperations') && !c.args[0].url.includes(':run'));
            const body = createJobCall.args[0].data;
            assert.strictEqual(body.job.customerMatchUserListMetadata.uploadKeyType, 'CONTACT_INFO');
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
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: BASIC_EMAIL_SCHEMA,
                adPersonalization: 'GRANTED',
                adUserData: 'GRANTED'
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            await AddUsersFromCSVToUserList.receive(context);

            const addOpsCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes(':addOperations'));
            const ops = addOpsCall.args[0].data.operations;
            assert.strictEqual(ops.length, 1);
            assert.strictEqual(ops[0].create.consent.adPersonalization, 'GRANTED');
            assert.strictEqual(ops[0].create.consent.adUserData, 'GRANTED');
        });

        it('omits consent object when no consent fields are provided', async () => {
            const csv = emailCsv([{ email: 'alice@example.com' }]);
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: BASIC_EMAIL_SCHEMA
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            await AddUsersFromCSVToUserList.receive(context);

            const addOpsCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes(':addOperations'));
            const ops = addOpsCall.args[0].data.operations;
            assert.strictEqual(ops[0].create.consent, undefined);
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
                customerId: '712-313-3715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: BASIC_EMAIL_SCHEMA
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            stubApiResponses(context);

            await AddUsersFromCSVToUserList.receive(context);

            const createJobCall = context.httpRequest.getCalls()
                .find(c => c.args[0].url.includes('offlineUserDataJobs') && !c.args[0].url.includes(':addOperations') && !c.args[0].url.includes(':run'));
            assert.ok(createJobCall.args[0].url.includes('7123133715'), 'normalised customer ID in URL');
        });
    });

    // -----------------------------------------------------------------------
    // Empty CSV
    // -----------------------------------------------------------------------

    describe('Empty CSV', () => {

        it('sends out with zero counts when CSV has only a header row', async () => {
            const csv = 'email\n'; // header only, no data rows
            context.messages.in.content = {
                fileId: 'file-abc',
                customerId: '7123133715',
                developerToken: 'dev-token',
                userListId: '9329730810',
                schema: BASIC_EMAIL_SCHEMA
            };
            context.getFileReadStream = sinon.stub().callsFake(() => Promise.resolve(csvStream(csv)));
            // create-job still gets called; run does not because nothing was added
            context.httpRequest.callsFake(({ url }) => {
                if (url.includes('offlineUserDataJobs') && !url.includes(':')) {
                    return Promise.resolve({ data: { resourceName: JOB_RESOURCE } });
                }
                if (url.includes(':run')) {
                    return Promise.resolve({ data: OPERATION_NAME });
                }
                return Promise.resolve({ data: {} });
            });

            await AddUsersFromCSVToUserList.receive(context);

            const outCalls = context.sendJson.getCalls().filter(c => c.args[1] === 'out');
            const result = outCalls[0].args[0];
            assert.strictEqual(result.totalUsers, 0);
            assert.strictEqual(result.totalRows, 0);
            assert.strictEqual(result.success, true);
        });
    });
});
