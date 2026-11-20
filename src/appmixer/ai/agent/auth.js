'use strict';

module.exports = {

    type: 'apiKey',

    definition: () => {

        return {
            auth: {
                provider: {
                    type: 'select',
                    name: 'Provider',
                    tooltip: 'Select your AI provider.',
                    options: [
                        { value: 'openai', label: 'OpenAI' },
                        { value: 'anthropic', label: 'Anthropic' },
                        { value: 'google', label: 'Google (Gemini)' },
                        { value: 'google-vertex', label: 'Google Vertex AI' },
                        { value: 'mistral', label: 'Mistral' },
                        { value: 'xai', label: 'xAI (Grok)' },
                        { value: 'cohere', label: 'Cohere' },
                        { value: 'deepseek', label: 'DeepSeek' },
                        { value: 'groq', label: 'Groq' },
                        { value: 'perplexity', label: 'Perplexity' },
                        { value: 'togetherai', label: 'Together AI' },
                        { value: 'amazon-bedrock', label: 'Amazon Bedrock' },
                        { value: 'azure', label: 'Azure OpenAI' },
                        { value: 'openai-compatible', label: 'OpenAI-Compatible' }
                    ]
                },
                // Provider-specific fields are shown only for the provider they belong to
                // (`when`, Appmixer 6.5+). A hidden field is neither validated nor stored.
                // `when` knows eq/neq and combines entries with AND, so a field needed by two
                // providers is defined once per provider under its own key; provider.js
                // (resolveAuth) maps the keys back to common names.
                apiKey: {
                    type: 'text',
                    name: 'API Key',
                    tooltip: 'API key for the selected provider.',
                    // Every provider except Amazon Bedrock and Google Vertex AI. Both entries
                    // reference the provider field: 'provider' and './provider' are equivalent,
                    // which allows two neq conditions on the same field.
                    when: { neq: { 'provider': 'amazon-bedrock', './provider': 'google-vertex' } }
                },
                accessKeyId: {
                    type: 'text',
                    name: 'AWS Access Key ID',
                    tooltip: 'Access key ID of an AWS IAM user or role allowed to invoke Amazon Bedrock models.',
                    when: { eq: { provider: 'amazon-bedrock' } }
                },
                secretKey: {
                    type: 'text',
                    name: 'AWS Secret Access Key',
                    tooltip: 'Secret access key that belongs to the AWS Access Key ID.',
                    when: { eq: { provider: 'amazon-bedrock' } }
                },
                awsRegion: {
                    type: 'text',
                    name: 'AWS Region',
                    tooltip: 'AWS region of Amazon Bedrock, e.g. <code>us-east-1</code>.',
                    when: { eq: { provider: 'amazon-bedrock' } }
                },
                projectId: {
                    type: 'text',
                    name: 'Project ID',
                    tooltip: 'Your Google Cloud project ID, e.g. <code>my-gcp-project</code>.',
                    when: { eq: { provider: 'google-vertex' } }
                },
                location: {
                    type: 'text',
                    name: 'Location',
                    tooltip: 'Google Cloud region of Vertex AI, e.g. <code>us-central1</code>.',
                    when: { eq: { provider: 'google-vertex' } }
                },
                azureEndpoint: {
                    type: 'text',
                    name: 'Endpoint',
                    tooltip: 'Endpoint of your Azure OpenAI resource, e.g. <code>https://MY-RESOURCE.openai.azure.com</code>.',
                    when: { eq: { provider: 'azure' } }
                },
                baseURL: {
                    type: 'text',
                    name: 'Base URL',
                    tooltip: 'Base URL of the OpenAI-compatible API, e.g. <code>https://openrouter.ai/api/v1</code>, <code>https://api.groq.com/openai/v1</code> or <code>http://localhost:11434/v1</code>.',
                    when: { eq: { provider: 'openai-compatible' } }
                },
                customHeaders: {
                    type: 'textarea',
                    name: 'Custom Headers',
                    tooltip: '(Optional) JSON object of extra HTTP headers sent with every request, e.g. <code>{"HTTP-Referer":"https://myapp.com","X-Title":"My App"}</code>. Useful for OpenRouter site attribution or provider-specific headers.',
                    // Not used by Amazon Bedrock and Google Vertex AI (see apiKey).
                    when: { neq: { 'provider': 'amazon-bedrock', './provider': 'google-vertex' } }
                }
            },

            validate: async (context) => {

                // Lazy-require so the module is loaded at call time, not at startup.
                const { listModels, resolveAuth } = require('./provider');
                const { provider, apiKey, secretKey, region, projectId } = resolveAuth(context);

                // Providers that require non-standard credentials — validate by field presence only.
                if (provider === 'amazon-bedrock') {
                    if (!apiKey) throw new Error('AWS Access Key ID is required for Amazon Bedrock.');
                    if (!secretKey) throw new Error('AWS Secret Access Key is required for Amazon Bedrock.');
                    if (!region) throw new Error('AWS Region is required for Amazon Bedrock (e.g. us-east-1).');
                    return;
                }
                if (provider === 'google-vertex') {
                    if (!projectId) throw new Error('Google Cloud Project ID is required for Google Vertex AI.');
                    return;
                }

                // All other providers: validate by making a real models list call.
                await listModels(context);
            },

            // Runs once, when the account is connected. The result is stored with the account
            // and reaches the components as context.profileInfo. It records the context window
            // of the provider's models, which the agent uses to size its tool result limit
            // (the model itself is selected on the component, so all of them are recorded).
            requestProfileInfo: async (context) => {

                try {
                    return { contextWindows: await require('./provider').listContextWindows(context) };
                } catch (err) {
                    // The account is valid (see validate); the agent falls back to its default limit.
                    return { contextWindows: [] };
                }
            },

            accountNameFromProfileInfo: (context) => {

                // Only the dialog fields are passed on: resolveAuth() would otherwise read
                // `context.auth`, should this context ever carry one.
                const { provider, apiKey, projectId } = require('./provider').resolveAuth({
                    provider: context.provider,
                    apiKey: context.apiKey,
                    accessKeyId: context.accessKeyId,
                    projectId: context.projectId
                });
                // Google Vertex AI has no key; the project identifies the account.
                if (provider === 'google-vertex' && projectId) {
                    return `${provider} / ${projectId}`;
                }
                const key = apiKey || '';
                const preview = key.length > 8
                    ? key.slice(0, 4) + '...' + key.slice(-4)
                    : '***';
                return `${provider} / ${preview}`;
            }
        };
    }
};
