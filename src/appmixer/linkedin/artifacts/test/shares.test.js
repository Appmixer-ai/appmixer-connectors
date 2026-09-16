'use strict';

const assert = require('assert');
const sinon = require('sinon');

const CreatePost = require('../../shares/CreatePost/CreatePost');
const CreateCompanyPost = require('../../shares/CreateCompanyPost/CreateCompanyPost');
const ListAdminOrganizations = require('../../shares/ListAdminOrganizations/ListAdminOrganizations');
const { VERSION_HEADER } = require('../../constants');

class CancelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CancelError';
    }
}

function createContext(input = {}, properties = {}) {

    const cache = new Map();
    return {
        CancelError,
        auth: { accessToken: 'token-1', profileInfo: { sub: 'member-1' } },
        config: {},
        properties,
        messages: { in: { content: input } },
        httpRequest: sinon.stub(),
        sendJson: sinon.stub().callsFake((data, port) => ({ data, port })),
        log: sinon.stub(),
        lock: sinon.stub().resolves({ unlock: sinon.stub() }),
        staticCache: {
            get: sinon.stub().callsFake(async key => cache.get(key)),
            set: sinon.stub().callsFake(async (key, value) => cache.set(key, value))
        }
    };
}

function httpError(status, data) {

    const err = new Error(`Request failed with status code ${status}`);
    err.response = { status, data };
    return err;
}

describe('linkedin shares', function() {

    describe('CreatePost', function() {

        it('requires text', async function() {

            const context = createContext({ visibility: 'PUBLIC' });
            await assert.rejects(CreatePost.receive(context), { name: 'CancelError', message: 'Text is required!' });
            assert.strictEqual(context.httpRequest.callCount, 0);
        });

        it('requires URL and title when sharing a link', async function() {

            await assert.rejects(
                CreatePost.receive(createContext({ text: 'Hello', specificLink: true, title: 'T' })),
                /URL is required/
            );
            await assert.rejects(
                CreatePost.receive(createContext({ text: 'Hello', specificLink: true, url: 'https://a.b' })),
                /Title is required/
            );
        });

        it('posts as the member', async function() {

            const context = createContext({ text: 'Hello' });
            context.httpRequest.resolves({ status: 201, headers: { 'x-restli-id': 'urn:li:share:1' } });

            await CreatePost.receive(context);

            const request = context.httpRequest.firstCall.args[0];
            assert.strictEqual(request.data.author, 'urn:li:person:member-1');
            assert.strictEqual(request.headers['LinkedIn-Version'], VERSION_HEADER);
            assert.deepStrictEqual(context.sendJson.firstCall.args, [{ status: 201, postId: 'urn:li:share:1' }, 'out']);
        });
    });

    describe('CreateCompanyPost', function() {

        it('accepts a numeric organization ID', async function() {

            const context = createContext({ organizationId: '2414183', text: 'Hello' });
            context.httpRequest.resolves({ status: 201, headers: { 'x-restli-id': 'urn:li:share:2' } });

            await CreateCompanyPost.receive(context);

            const request = context.httpRequest.firstCall.args[0];
            assert.strictEqual(request.method, 'POST');
            assert.strictEqual(request.url, 'https://api.linkedin.com/rest/posts');
            assert.strictEqual(request.headers.Authorization, 'Bearer token-1');
            assert.strictEqual(request.headers['LinkedIn-Version'], VERSION_HEADER);
            assert.strictEqual(request.data.author, 'urn:li:organization:2414183');
            assert.strictEqual(request.data.commentary, 'Hello');
            assert.strictEqual(request.data.visibility, 'PUBLIC');
            assert.strictEqual(request.data.content, undefined);
            assert.deepStrictEqual(context.sendJson.firstCall.args, [{ status: 201, postId: 'urn:li:share:2' }, 'out']);
        });

        it('accepts an organization URN', async function() {

            const context = createContext({ organizationId: ' urn:li:organization:12345 ', text: 'Hello' });
            context.httpRequest.resolves({ status: 201, headers: {} });

            await CreateCompanyPost.receive(context);

            assert.strictEqual(context.httpRequest.firstCall.args[0].data.author, 'urn:li:organization:12345');
        });

        it('accepts a numeric organization ID passed as a number', async function() {

            const context = createContext({ organizationId: 12345, text: 'Hello' });
            context.httpRequest.resolves({ status: 201, headers: {} });

            await CreateCompanyPost.receive(context);

            assert.strictEqual(context.httpRequest.firstCall.args[0].data.author, 'urn:li:organization:12345');
        });

        [
            'urn:li:person:abc',
            'urn:li:organizationBrand:12345',
            'acme-inc',
            '12345abc'
        ].forEach(organizationId => {
            it(`rejects '${organizationId}' without calling LinkedIn`, async function() {

                const context = createContext({ organizationId, text: 'Hello' });
                await assert.rejects(CreateCompanyPost.receive(context), { name: 'CancelError', message: /Invalid organization ID/ });
                assert.strictEqual(context.httpRequest.callCount, 0);
            });
        });

        it('requires the organization ID and text', async function() {

            await assert.rejects(
                CreateCompanyPost.receive(createContext({ text: 'Hello' })),
                { name: 'CancelError', message: 'Organization ID is required!' }
            );
            await assert.rejects(
                CreateCompanyPost.receive(createContext({ organizationId: '1' })),
                { name: 'CancelError', message: 'Text is required!' }
            );
        });

        it('requires URL and title for article shares', async function() {

            await assert.rejects(
                CreateCompanyPost.receive(createContext({ organizationId: '1', text: 'Hi', specificLink: true, title: 'T' })),
                /URL is required/
            );
            await assert.rejects(
                CreateCompanyPost.receive(createContext({ organizationId: '1', text: 'Hi', specificLink: true, url: 'https://a.b' })),
                /Title is required/
            );
        });

        it('builds an article share', async function() {

            const context = createContext({
                organizationId: '1',
                text: 'Read this',
                visibility: 'LOGGED_IN',
                specificLink: true,
                url: 'https://example.com/post',
                title: 'Example',
                description: 'An example article'
            });
            context.httpRequest.resolves({ status: 201, headers: {} });

            await CreateCompanyPost.receive(context);

            const { data } = context.httpRequest.firstCall.args[0];
            assert.strictEqual(data.visibility, 'LOGGED_IN');
            assert.deepStrictEqual(data.content, {
                article: { source: 'https://example.com/post', title: 'Example', description: 'An example article' }
            });
        });

        it('explains a 403 and keeps the LinkedIn message', async function() {

            const context = createContext({ organizationId: '42', text: 'Hello' });
            context.httpRequest.rejects(httpError(403, {
                status: 403,
                code: 'ACCESS_DENIED',
                message: 'Not enough permissions to access: partnerApiPostsExternal.CREATE'
            }));

            await assert.rejects(CreateCompanyPost.receive(context), err => {
                assert.strictEqual(err.name, 'CancelError');
                assert.match(err.message, /organization 42/);
                assert.match(err.message, /w_organization_social/);
                assert.match(err.message, /partnerApiPostsExternal\.CREATE/);
                return true;
            });
        });

        it('rethrows other errors unchanged', async function() {

            const context = createContext({ organizationId: '42', text: 'Hello' });
            const error = httpError(422, { message: 'invalid' });
            context.httpRequest.rejects(error);

            await assert.rejects(CreateCompanyPost.receive(context), err => err === error);
        });
    });

    describe('ListAdminOrganizations', function() {

        function stubLinkedIn(context, { aclPages, organizations = {} }) {

            context.httpRequest.callsFake(async request => {
                if (request.url.endsWith('/organizationAcls')) {
                    const page = request.params.start / request.params.count;
                    return { data: { elements: aclPages[page] || [] } };
                }
                const id = request.url.split('/').pop();
                if (organizations[id] instanceof Error) {
                    throw organizations[id];
                }
                return { data: organizations[id] };
            });
        }

        it('lists approved pages the member can post to, with their names', async function() {

            const context = createContext({}, { isSource: true });
            stubLinkedIn(context, {
                aclPages: [[
                    { organization: 'urn:li:organization:1', role: 'ADMINISTRATOR', state: 'APPROVED' },
                    // Paginated finder sample in LinkedIn docs uses organizationTarget.
                    { organizationTarget: 'urn:li:organization:2', role: 'CONTENT_ADMINISTRATOR', state: 'APPROVED' },
                    { organization: 'urn:li:organization:3', role: 'ANALYST', state: 'APPROVED' }
                ]],
                organizations: {
                    1: { localizedName: 'Acme' },
                    2: httpError(403, { message: 'Viewer does not have permission' })
                }
            });

            const result = await ListAdminOrganizations.receive(context);

            const aclRequest = context.httpRequest.firstCall.args[0];
            assert.deepStrictEqual(aclRequest.params, {
                q: 'roleAssignee', state: 'APPROVED', start: 0, count: 100
            });
            assert.strictEqual(aclRequest.headers['LinkedIn-Version'], VERSION_HEADER);
            assert.deepStrictEqual(result.data, {
                organizations: [{ id: '1', name: 'Acme' }, { id: '2', name: 'Organization 2' }]
            });
            assert.deepStrictEqual(ListAdminOrganizations.organizationsToSelectArray(result.data), [
                { label: 'Acme (1)', value: '1' },
                { label: 'Organization 2 (2)', value: '2' }
            ]);
        });

        it('follows pagination and removes duplicates', async function() {

            const context = createContext();
            const admin = id => ({ organization: `urn:li:organization:${id}`, role: 'ADMINISTRATOR' });
            const firstPage = Array.from({ length: 100 }, (_, i) => admin(i + 1));
            stubLinkedIn(context, { aclPages: [firstPage, [admin(101), admin(1)]] });

            const result = await ListAdminOrganizations.receive(context);

            assert.strictEqual(result.data.organizations.length, 101);
            assert.strictEqual(result.data.organizations[100].id, '101');
            // 2 ACL pages + 101 name lookups; the 3rd page is never requested.
            assert.strictEqual(context.httpRequest.callCount, 103);
        });

        it('caches the list per token', async function() {

            const context = createContext({}, { isSource: true });
            stubLinkedIn(context, {
                aclPages: [[{ organization: 'urn:li:organization:1', role: 'ADMINISTRATOR' }]],
                organizations: { 1: { localizedName: 'Acme' } }
            });

            await ListAdminOrganizations.receive(context);
            const second = await ListAdminOrganizations.receive(context);

            assert.strictEqual(context.httpRequest.callCount, 2); // one ACL page + one name lookup
            assert.deepStrictEqual(second.data.organizations, [{ id: '1', name: 'Acme' }]);
            assert.strictEqual(context.staticCache.set.firstCall.args[2], 15 * 60 * 1000);
            assert.strictEqual(context.lock.callCount, 2);
        });

        it('returns an empty list to the dropdown when LinkedIn fails', async function() {

            const context = createContext({}, { isSource: true });
            context.httpRequest.rejects(httpError(403, { message: 'Not enough permissions' }));

            const result = await ListAdminOrganizations.receive(context);

            assert.deepStrictEqual(result.data, { organizations: [] });
            assert.deepStrictEqual(ListAdminOrganizations.organizationsToSelectArray(result.data), []);
        });

        it('throws outside of the dropdown', async function() {

            const context = createContext();
            const error = httpError(403, { message: 'Not enough permissions' });
            context.httpRequest.rejects(error);

            await assert.rejects(ListAdminOrganizations.receive(context), err => err === error);
        });

        it('transform tolerates a missing payload', function() {

            assert.deepStrictEqual(ListAdminOrganizations.organizationsToSelectArray(undefined), []);
            assert.deepStrictEqual(ListAdminOrganizations.organizationsToSelectArray({}), []);
        });
    });
});
