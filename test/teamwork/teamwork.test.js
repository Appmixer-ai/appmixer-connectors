'use strict';

const assert = require('assert');
const path = require('path');
const { createMockContext } = require('../utils');

const CONNECTOR = path.join(__dirname, '../../src/appmixer/teamwork');
const component = name => require(path.join(CONNECTOR, 'core', name, `${name}.js`));

const SITE = 'https://example.eu.teamwork.com';

const contextFor = (content, data = {}) => {
    const context = createMockContext();
    context.auth = { accessToken: 'token', profileInfo: { accountURL: SITE } };
    context.messages = { in: { content } };
    context.httpRequest.resolves({ status: 200, headers: {}, data });
    return context;
};

const lastRequest = context => context.httpRequest.lastCall.args[0];
const sent = context => context.sendJson.lastCall.args;

describe('appmixer.teamwork', function() {

    describe('Delete components', () => {

        const cases = [
            ['DeleteProject', { projectId: '123' }, `${SITE}/projects/123.json`],
            ['DeleteCompany', { companyId: '45' }, `${SITE}/companies/45.json`],
            ['DeleteTag', { tagId: '7' }, `${SITE}/projects/api/v3/tags/7.json`],
            ['DeleteWorkflow', { workflowId: '9' }, `${SITE}/projects/api/v3/workflows/9.json`],
            // The Custom Field dropdown sends "<id>-<type>".
            ['DeleteCustomField', { customFieldId: '4521-text-short' }, `${SITE}/projects/api/v3/customfields/4521.json`]
        ];

        cases.forEach(([name, content, url]) => {
            it(`${name} sends DELETE ${url.replace(SITE, '')} and outputs {}`, async () => {
                const context = contextFor(content);
                await component(name).receive(context);
                assert.strictEqual(lastRequest(context).method, 'DELETE');
                assert.strictEqual(lastRequest(context).url, url);
                assert.strictEqual(lastRequest(context).headers.Authorization, 'Bearer token');
                assert.deepStrictEqual(sent(context), [{}, 'out']);
            });

            it(`${name} cancels without an id`, async () => {
                const context = contextFor({});
                await assert.rejects(component(name).receive(context), context.CancelError);
                assert.strictEqual(context.httpRequest.callCount, 0);
            });
        });
    });

    describe('CreateTag', () => {

        it('creates a v3 tag and outputs it', async () => {
            const tag = { id: 183925, name: 'urgent', color: '#9b59b6', projectId: 0 };
            const context = contextFor({ name: 'urgent', color: '#9b59b6' }, { tag });
            await component('CreateTag').receive(context);
            assert.strictEqual(lastRequest(context).url, `${SITE}/projects/api/v3/tags.json`);
            assert.deepStrictEqual(lastRequest(context).data, { tag: { name: 'urgent', color: '#9b59b6' } });
            assert.deepStrictEqual(sent(context), [tag, 'out']);
        });

        it('restricts the tag to a project when set', async () => {
            const context = contextFor({ name: 'urgent', projectId: '42' }, { tag: { id: 1 } });
            await component('CreateTag').receive(context);
            assert.deepStrictEqual(lastRequest(context).data, { tag: { name: 'urgent', projectId: 42 } });
        });
    });

    describe('CreateCustomField', () => {

        it('creates a custom field and outputs it', async () => {
            const customfield = { id: 4521, name: 'Ref', entity: 'task', type: 'text-short' };
            const context = contextFor({ name: 'Ref', entity: 'task', type: 'text-short' }, { customfield });
            await component('CreateCustomField').receive(context);
            assert.strictEqual(lastRequest(context).method, 'POST');
            assert.strictEqual(lastRequest(context).url, `${SITE}/projects/api/v3/customfields.json`);
            assert.deepStrictEqual(lastRequest(context).data, { customfield: { name: 'Ref', entity: 'task', type: 'text-short' } });
            assert.deepStrictEqual(sent(context), [customfield, 'out']);
        });
    });

    describe('CreateWorkflow', () => {

        it('always sends workflowOptions (Teamwork answers 500 without it)', async () => {
            const workflow = { id: 20391, name: 'Pipeline' };
            const context = contextFor({ name: 'Pipeline' }, { workflow });
            await component('CreateWorkflow').receive(context);
            assert.deepStrictEqual(lastRequest(context).data, {
                workflow: { name: 'Pipeline', projectSpecific: false, status: 'active' },
                workflowOptions: {}
            });
            assert.deepStrictEqual(sent(context), [workflow, 'out']);
        });
    });

    describe('CreateWorkflowStage', () => {

        it('adds a stage to the workflow and outputs it with the workflow id', async () => {
            const context = contextFor(
                { workflowId: '20391', name: 'Backlog', color: '#3B82F6' },
                { stage: { id: 81234, name: 'Backlog' } }
            );
            await component('CreateWorkflowStage').receive(context);
            assert.strictEqual(lastRequest(context).url, `${SITE}/projects/api/v3/workflows/20391/stages.json`);
            assert.deepStrictEqual(lastRequest(context).data, {
                stage: { name: 'Backlog', color: '#3B82F6', showCompletedTasks: false },
                stageOptions: {}
            });
            assert.deepStrictEqual(sent(context), [{ id: 81234, name: 'Backlog', workflowId: 20391 }, 'out']);
        });
    });

    describe('AddWorkflowToProject', () => {

        it('attaches the workflow and outputs {}', async () => {
            const context = contextFor({ projectId: '42', workflowId: '20391' });
            await component('AddWorkflowToProject').receive(context);
            assert.strictEqual(lastRequest(context).method, 'POST');
            assert.strictEqual(lastRequest(context).url, `${SITE}/projects/api/v3/projects/42/workflows.json`);
            assert.deepStrictEqual(lastRequest(context).data, { workflow: { id: 20391 }, workflowOptions: {} });
            assert.deepStrictEqual(sent(context), [{}, 'out']);
        });
    });
});
