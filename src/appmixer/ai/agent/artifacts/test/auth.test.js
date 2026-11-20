'use strict';

const assert = require('assert');
const sinon = require('sinon');

const auth = require('../../auth');
const provider = require('../../provider');

const definition = auth.definition();
const fields = definition.auth;
const providers = fields.provider.options.map(option => option.value);

// The dialog's rule (Appmixer 6.5): entries of eq/neq are combined with AND, the './' prefix of
// the referenced field is optional, and neq is not met while the referenced field is empty.
function isVisible(field, values) {

    const { eq = {}, neq = {} } = field.when || {};
    const valueOf = name => values[name.replace(/^\.\//, '')];
    return Object.entries(eq).every(([name, expected]) => valueOf(name) === expected)
        && Object.entries(neq).every(([name, unexpected]) => valueOf(name) && valueOf(name) !== unexpected);
}

function visibleFields(providerValue) {

    return Object.keys(fields)
        .filter(name => name !== 'provider' && isVisible(fields[name], { provider: providerValue }));
}

describe('ai.agent auth', () => {

    describe('conditional fields', () => {

        it('uses only the eq and neq operators, referencing the provider field', () => {

            Object.entries(fields).forEach(([name, field]) => {
                if (name === 'provider') {
                    assert.strictEqual(field.when, undefined);
                    return;
                }
                assert.ok(field.when, `${name} has no precondition`);
                Object.entries(field.when).forEach(([op, conditions]) => {
                    assert.ok(['eq', 'neq'].includes(op), `${name}: unsupported operator ${op}`);
                    Object.entries(conditions).forEach(([reference, value]) => {
                        assert.strictEqual(reference.replace(/^\.\//, ''), 'provider');
                        assert.ok(providers.includes(value), `${name}: unknown provider ${value}`);
                    });
                });
            });
        });

        it('shows only the provider select until a provider is chosen', () => {

            assert.deepStrictEqual(visibleFields(undefined), []);
        });

        it('shows the fields of the selected provider only', () => {

            const expected = {
                'amazon-bedrock': ['accessKeyId', 'secretKey', 'awsRegion'],
                'google-vertex': ['projectId', 'location'],
                'azure': ['apiKey', 'azureEndpoint', 'customHeaders'],
                'openai-compatible': ['apiKey', 'baseURL', 'customHeaders']
            };
            providers.forEach(value => {
                assert.deepStrictEqual(
                    visibleFields(value),
                    expected[value] || ['apiKey', 'customHeaders'],
                    `fields for ${value}`
                );
            });
        });
    });

    describe('resolveAuth', () => {

        it('maps the provider-specific fields to the common names', () => {

            const bedrock = provider.resolveAuth({
                auth: { provider: 'amazon-bedrock', accessKeyId: 'AKIA', secretKey: 'secret', awsRegion: 'eu-west-1' }
            });
            assert.strictEqual(bedrock.apiKey, 'AKIA');
            assert.strictEqual(bedrock.secretKey, 'secret');
            assert.strictEqual(bedrock.region, 'eu-west-1');

            const vertex = provider.resolveAuth({
                auth: { provider: 'google-vertex', projectId: 'my-project', location: 'europe-west1' }
            });
            assert.strictEqual(vertex.projectId, 'my-project');
            assert.strictEqual(vertex.region, 'europe-west1');

            const azure = provider.resolveAuth({
                auth: { provider: 'azure', apiKey: 'key', azureEndpoint: 'https://res.openai.azure.com' }
            });
            assert.strictEqual(azure.baseURL, 'https://res.openai.azure.com');
        });

        it('still reads accounts connected with the previous dialog', () => {

            const bedrock = provider.resolveAuth({
                auth: { provider: 'amazon-bedrock', apiKey: 'AKIA', secretKey: 'secret', region: 'us-east-1' }
            });
            assert.strictEqual(bedrock.apiKey, 'AKIA');
            assert.strictEqual(bedrock.region, 'us-east-1');

            const azure = provider.resolveAuth({
                auth: { provider: 'azure', apiKey: 'key', baseURL: 'https://res.openai.azure.com' }
            });
            assert.strictEqual(azure.baseURL, 'https://res.openai.azure.com');
        });
    });

    describe('validate', () => {

        it('accepts Amazon Bedrock credentials entered in the new fields', async () => {

            await definition.validate({
                provider: 'amazon-bedrock', accessKeyId: 'AKIA', secretKey: 'secret', awsRegion: 'us-east-1'
            });
        });

        it('reports the missing Amazon Bedrock and Google Vertex AI fields', async () => {

            await assert.rejects(
                definition.validate({ provider: 'amazon-bedrock', secretKey: 'secret', awsRegion: 'us-east-1' }),
                /AWS Access Key ID is required/
            );
            await assert.rejects(
                definition.validate({ provider: 'amazon-bedrock', accessKeyId: 'AKIA', secretKey: 'secret' }),
                /AWS Region is required/
            );
            await assert.rejects(definition.validate({ provider: 'google-vertex' }), /Project ID is required/);
            await definition.validate({ provider: 'google-vertex', projectId: 'my-project' });
        });

        it('validates Azure OpenAI against the endpoint field', async () => {

            const get = sinon.stub().resolves({ data: { data: [{ id: 'gpt-4o' }] } });
            await definition.validate({
                provider: 'azure',
                apiKey: 'key',
                azureEndpoint: 'https://res.openai.azure.com/',
                httpRequest: { get }
            });
            assert.match(get.firstCall.args[0], /^https:\/\/res\.openai\.azure\.com\/openai\/models/);
        });
    });

    describe('accountNameFromProfileInfo', () => {

        it('names the account after the provider and a preview of the key', () => {

            assert.strictEqual(
                definition.accountNameFromProfileInfo({ provider: 'openai', apiKey: 'sk-1234567890' }),
                'openai / sk-1...7890'
            );
            assert.strictEqual(
                definition.accountNameFromProfileInfo({ provider: 'amazon-bedrock', accessKeyId: 'AKIAABCDEFGH' }),
                'amazon-bedrock / AKIA...EFGH'
            );
            assert.strictEqual(
                definition.accountNameFromProfileInfo({ provider: 'google-vertex', projectId: 'my-project' }),
                'google-vertex / my-project'
            );
        });
    });
});
