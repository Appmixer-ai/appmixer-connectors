'use strict';

const assert = require('assert');
const path = require('path');
const { createMockContext } = require('../utils');

const CONNECTOR = path.join(__dirname, '../../src/appmixer/posthog');
const component = name => require(path.join(CONNECTOR, 'core', name, `${name}.js`));

const contextFor = (content, data = {}) => {
    const context = createMockContext();
    context.auth = { apiKey: 'phx_test', host: 'https://eu.posthog.com/' };
    context.properties = {};
    context.messages = { in: { content } };
    context.httpRequest.resolves({ status: 200, headers: {}, data });
    return context;
};

const lastRequest = context => context.httpRequest.lastCall.args[0];

describe('appmixer.posthog', function() {

    describe('DeleteAnnotation', () => {

        it('soft-deletes the annotation and sends {}', async () => {
            const context = contextFor({ projectId: '244976', annotationId: 789 }, { id: 789, deleted: true });
            await component('DeleteAnnotation').receive(context);
            const req = lastRequest(context);
            assert.strictEqual(req.method, 'PATCH');
            assert.strictEqual(req.url, 'https://eu.posthog.com/api/projects/244976/annotations/789/');
            assert.strictEqual(req.headers.Authorization, 'Bearer phx_test');
            assert.deepStrictEqual(req.data, { deleted: true });
            assert.deepStrictEqual(context.sendJson.lastCall.args, [{}, 'out']);
        });

        it('requires the project and the annotation ID', async () => {
            await assert.rejects(
                component('DeleteAnnotation').receive(contextFor({ annotationId: '1' })),
                /Project is required/
            );
            await assert.rejects(
                component('DeleteAnnotation').receive(contextFor({ projectId: '1' })),
                /Annotation ID is required/
            );
        });
    });

    describe('FindPersons', () => {

        it('filters by exact distinct ID', async () => {
            const person = { id: 'p1', uuid: 'u1', distinct_ids: ['user-42'] };
            const context = contextFor({ projectId: '244976', distinctId: 'user-42', outputType: 'first' }, {
                results: [person]
            });
            await component('FindPersons').receive(context);
            const req = lastRequest(context);
            assert.strictEqual(req.url, 'https://eu.posthog.com/api/projects/244976/persons/');
            assert.deepStrictEqual(req.params, { limit: 100, distinct_id: 'user-42' });
            assert.deepStrictEqual(context.sendJson.lastCall.args, [{ ...person, index: 0, count: 1 }, 'out']);
        });

        it('keeps the search-only query without a distinct ID', async () => {
            const context = contextFor({ projectId: '244976', search: 'jane' }, { results: [] });
            await component('FindPersons').receive(context);
            assert.deepStrictEqual(lastRequest(context).params, { limit: 100, search: 'jane' });
            assert.deepStrictEqual(context.sendJson.lastCall.args, [{}, 'notFound']);
        });
    });
});
