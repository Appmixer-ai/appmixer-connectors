'use strict';

// Every MakeApiCall sends the Request Headers and Query Parameters set in the Designer.
//
// The Designer's key-value field stores its rows as the JSON string of an object
// ('{"X-Kv-Test":"header-value"}', appmixer-fe inspector-field-input-key-value.vue).
// Until 2026-10 most MakeApiCall components accepted only an array of {key, value}
// rows and silently dropped that string — Freshdesk #9751 (Xero) found it.

const assert = require('assert');
const path = require('path');
const glob = require('glob');
const sinon = require('sinon');
const { createMockContext } = require('./utils');

const ROOT = path.join(__dirname, '..');
const components = glob.sync('src/**/MakeApiCall/MakeApiCall.js', { cwd: ROOT }).sort();

// Inputs a few components require on top of url/method; harmless for the rest.
const EXTRA_INPUTS = { baseUrl: 'https://kv-test.example.com', tenantId: 'kv-test-tenant', companyId: 'kv-test' };

// Account data a few components read before the call (DocuSign base URI, Jira cloud id, SuperOffice tenant).
const PROFILE_INFO = {
    accounts: [{ base_uri: 'https://kv-test.example.com', account_id: 'kv-test', is_default: true }],
    apiUrl: 'https://api.atlassian.com/ex/jira/kv-test',
    region: 'us',
    accountURL: 'https://kv-test.example.com',
    tenantId: 'Cust12345'
};

// SuperOffice asks its state endpoint where the tenant's API lives and sends the token only there.
const SUPEROFFICE_STATE = { IsRunning: true, Api: 'https://online.superoffice.com/Cust12345/api' };

// Service config of the components that validate it instead of taking any placeholder.
const CONFIG = {
    'src/appmixer/superoffice/core/MakeApiCall/MakeApiCall.js': { environment: 'online' }
};

// Account fields a connector validates before any request (it refuses to send the
// token anywhere else), keyed by the connector directory (src/appmixer/<connector>).
const AUTH_OVERRIDES = {
    // lib.js accepts only a *.workday.com / *.myworkday.com hostname.
    workday: { host: 'kv-test.workday.com' },
    // The site is the content URL of a Tableau site ("mysite"), not a host: lib.js accepts letters,
    // digits, "-" and "_" only. Its name ends with "Url", so the host shapes would be put in it.
    tableau: { siteContentUrl: 'kv-test' }
};

// Tableau signs in first (POST /auth/signin) and sends the session token, not the account fields.
const TABLEAU_SIGNIN = { status: 200, data: { credentials: { token: 'kv-test-token', site: { id: 'kv-test-site' }, user: { id: 'kv-test-user' } } } };

// What a *Url/*Uri/*Domain account field holds differs by connector: a full URL, a bare hostname
// ("acme.example.com") or just the account name ("acme" for acme.freshservice.com). A connector
// that validates the field before sending the token rejects the other shapes, so the test tries
// them in turn and needs no entry per connector. AUTH_OVERRIDES is only for a field that must
// name the vendor's own host.
const HOST_SHAPES = ['https://kv-test.example.com', 'kv-test.example.com', 'kv-test'];

// Any auth or config field reads as a placeholder: a host for *Url/*Uri/*Domain fields, a token otherwise.
const createAuth = (overrides = {}, hostShape = HOST_SHAPES[0]) => new Proxy({}, {
    get: (target, prop) => {
        if (typeof prop !== 'string') return undefined;
        if (prop === 'profileInfo') return PROFILE_INFO;
        if (Object.prototype.hasOwnProperty.call(overrides, prop)) return overrides[prop];
        // An Azure resource endpoint: ai.foundry refuses a host outside the Azure OpenAI domains.
        if (prop === 'endpoint') return 'https://kv-test.openai.azure.com';
        return /(url|uri|domain)$/i.test(prop) ? hostShape : 'kv-test';
    }
});

const findHeader = (headers, name) => Object.entries(headers || {})
    .find(([key]) => key.toLowerCase() === name.toLowerCase());

describe('MakeApiCall: Request Headers and Query Parameters from the Designer', function() {

    this.timeout(10000);

    it('finds the MakeApiCall components', () => {
        assert(components.length > 150, `only ${components.length} found`);
    });

    // One call of the component with the given shape of host-like account fields. Returns the
    // request that carried the test header (if any), all requests, and the error the component threw.
    const callWith = async (file, hostShape) => {

        const component = require(path.join(ROOT, file));
        const connector = file.split('/')[2];
        const auth = createAuth(AUTH_OVERRIDES[connector], hostShape);
        const context = createMockContext();
        context.auth = auth;
        context.config = CONFIG[file] || auth;
        context.profileInfo = { ...context.profileInfo, ...PROFILE_INFO };
        context.httpRequest.resolves({
            status: 200,
            statusCode: 200,
            headers: { 'content-type': 'application/json' },
            data: {}
        });
        context.httpRequest
            .withArgs(sinon.match({ url: sinon.match(/\/api\/state\/Cust12345$/) }))
            .resolves({ status: 200, data: SUPEROFFICE_STATE });
        context.httpRequest
            .withArgs(sinon.match({ method: 'POST', url: sinon.match(/\/api\/[\d.]+\/auth\/signin$/) }))
            .resolves(TABLEAU_SIGNIN);
        context.messages = {
            in: {
                content: {
                    ...EXTRA_INPUTS,
                    url: '/kv-test',
                    method: 'GET',
                    headers: JSON.stringify({ 'X-Kv-Test': 'header-value' }),
                    parameters: JSON.stringify({ kvtest: 'param-value' })
                }
            }
        };

        let error = null;
        try {
            await component.receive(context);
        } catch (err) {
            error = err;
        }

        const requests = context.httpRequest.getCalls().map(call => call.args[0]);
        const request = requests.find(options => findHeader(options.headers, 'X-Kv-Test'));
        return { request, requests, error };
    };

    components.forEach(file => {

        it(path.dirname(file).replace(/^src\//, ''), async () => {

            // The first shape whose call sends the header counts; when none does, the failure
            // reported is the one of the first shape (the placeholder every connector got before).
            let first = null;
            let result = null;
            for (const hostShape of HOST_SHAPES) {
                result = await callWith(file, hostShape);
                first = first || result;
                if (result.request && !result.error) break;
            }
            if (!result.request || result.error) {
                result = first;
            }
            if (result.error) throw result.error;

            const { request, requests } = result;
            assert(request, `no request carried the X-Kv-Test header (${requests.length} request(s))`);
            assert.strictEqual(findHeader(request.headers, 'X-Kv-Test')[1], 'header-value');

            const params = request.params || {};
            const inUrl = /[?&]kvtest=param-value(&|$)/.test(request.url || '');
            assert(params.kvtest === 'param-value' || inUrl, 'the kvtest query parameter was not sent');
        });
    });
});
