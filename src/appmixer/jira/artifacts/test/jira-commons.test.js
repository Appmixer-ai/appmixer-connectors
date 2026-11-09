'use strict';

const assert = require('assert');
const commons = require('../../jira-commons');

function createContext(handler) {

    const calls = [];
    return {
        calls,
        auth: { accessToken: 'token-123' },
        profileInfo: { apiUrl: 'https://api.atlassian.com/ex/jira/cloud-1/rest/api/3/' },
        httpRequest: async (options) => {
            calls.push(options);
            return handler(options, calls.length);
        }
    };
}

function httpError(status, data) {

    const err = new Error(`Request failed with status code ${status}`);
    err.response = { status, data };
    return err;
}

describe('jira-commons request', () => {

    it('sends the bearer token, query params and JSON body', async () => {

        const context = createContext(() => ({ data: { id: '10000' } }));

        const result = await commons.post('https://jira.test/issue', context, { fields: {} });
        await commons.get('https://jira.test/search/jql', context, { jql: 'project = X', maxResults: 1 });

        assert.deepStrictEqual(result, { id: '10000' });
        assert.strictEqual(context.calls[0].method, 'POST');
        assert.strictEqual(context.calls[0].url, 'https://jira.test/issue');
        assert.strictEqual(context.calls[0].headers.Authorization, 'Bearer token-123');
        assert.deepStrictEqual(context.calls[0].data, { fields: {} });
        assert.strictEqual(context.calls[1].method, 'GET');
        assert.deepStrictEqual(context.calls[1].params, { jql: 'project = X', maxResults: 1 });
        assert.strictEqual(context.calls[1].data, undefined);
    });

    it('keeps statusCode and the Jira body in the error message', async () => {

        const body = { errorMessages: ['Changing permission schemes is not allowed on the Jira Software or Core Free plans.'] };
        const context = createContext(() => {
            throw httpError(403, body);
        });

        await assert.rejects(
            commons.put('https://jira.test/project/X', context, {}),
            (err) => {
                assert.strictEqual(err.statusCode, 403);
                assert.ok(err.message.startsWith('403 - '));
                assert.ok(err.message.includes('Core Free plans.'));
                assert.deepStrictEqual(err.error, body);
                return true;
            }
        );
    });

    it('rethrows network errors unchanged', async () => {

        const networkError = new Error('socket hang up');
        const context = createContext(() => {
            throw networkError;
        });

        await assert.rejects(commons.get('https://jira.test/x', context), networkError);
    });

    it('pages through results with startAt', async () => {

        const context = createContext((options, n) => ({
            data: { values: n === 1 ? [{ id: 1 }, { id: 2 }] : [{ id: 3 }] }
        }));

        const values = await commons.pager({
            endpoint: 'https://jira.test/project/search',
            context,
            key: 'values',
            params: { maxResults: 2 }
        });

        assert.deepStrictEqual(values.map(v => v.id), [1, 2, 3]);
        assert.strictEqual(context.calls[1].params.startAt, 2);
    });

    it('fetchLatestIssue queries search/jql of the account instance', async () => {

        const context = createContext(() => ({ data: { issues: [{ id: '1' }] } }));

        const issue = await commons.fetchLatestIssue(context, { project: 'X' });

        assert.deepStrictEqual(issue, { id: '1' });
        assert.strictEqual(context.calls[0].url, 'https://api.atlassian.com/ex/jira/cloud-1/rest/api/3/search/jql');
        assert.strictEqual(context.calls[0].params.jql, 'project = "X" ORDER BY created DESC');
    });
});
