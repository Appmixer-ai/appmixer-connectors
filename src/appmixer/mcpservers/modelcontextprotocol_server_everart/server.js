'use strict';

// Stdio MCP server spawned by lib.mcpCall. It replaces the deprecated
// @modelcontextprotocol/server-everart package (pinned to MCP SDK 0.5.0 / zod 3)
// and keeps its tool contract: same tool name, input schema and response text.
// The `everart` SDK is replaced with direct calls to the EverArt REST API
// (same endpoints, headers, body and polling as the SDK's v1.generations).
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');

const EVERART_BASE_URL = 'https://api.everart.ai/v1';

const server = new Server(
    { name: 'example-servers/everart', version: '0.2.0' },
    { capabilities: { tools: {}, resources: {} } }
);

if (!process.env.EVERART_API_KEY) {
    console.error('EVERART_API_KEY environment variable is not set');
    process.exit(1);
}

const defaultHeaders = {
    Authorization: `Bearer ${process.env.EVERART_API_KEY}`,
    'Content-Type': 'application/json'
};

// Mirrors EverArtError of the everart SDK: `${message}: ${JSON.stringify(data)}`.
class EverArtError extends Error {

    constructor(status, message, data) {

        let dataMessage;
        try {
            dataMessage = JSON.stringify(data);
        } catch {
            dataMessage = '';
        }
        super(`${message}: ${dataMessage}`);
        let name = 'EverArtUnknownError';
        switch (status) {
            case 400: name = 'EverArtInvalidRequestError'; break;
            case 401: name = 'EverArtUnauthorizedError'; break;
            case 403: name = 'EverArtForbiddenError'; break;
            case 404: name = 'EverArtRecordNotFoundError'; break;
            case 451: name = 'EverArtContentModerationError'; break;
        }
        this.name = name;
    }
}

async function everartRequest(method, endpoint, body) {

    const response = await fetch(`${EVERART_BASE_URL}/${endpoint}`, {
        method,
        headers: defaultHeaders,
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    // Like the SDK (axios): JSON when it parses, otherwise the raw body text.
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }
    return { status: response.status, data };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// POST /v1/models/:id/generations (everart SDK v1.generations.create).
async function createGenerations(modelId, prompt, type, options = {}) {

    const body = { prompt, type };
    if (options.image) body.image = options.image;
    if (options.height) body.height = options.height;
    if (options.width) body.width = options.width;
    if (options.imageCount) body.image_count = options.imageCount;
    if (options.webhookUrl) body.webhook_url = options.webhookUrl;

    const { status, data } = await everartRequest('POST', `models/${modelId}/generations`, body);
    if (status === 200 && data && Array.isArray(data.generations)) {
        return data.generations;
    }
    throw new EverArtError(status, 'Failed to create generations', data);
}

// GET /v1/generations/:id (everart SDK v1.generations.fetch).
async function fetchGeneration(id) {

    const { status, data } = await everartRequest('GET', `generations/${id}`);
    if (status === 200 && data && data.generation) {
        return data.generation;
    }
    throw new EverArtError(status, 'Failed to fetch generation', data);
}

// everart SDK v1.generations.fetchWithPolling: poll every second while STARTING/PROCESSING.
async function fetchGenerationWithPolling(id) {

    let generation = await fetchGeneration(id);
    while (generation.status === 'STARTING' || generation.status === 'PROCESSING') {
        await sleep(1000);
        generation = await fetchGeneration(id);
    }
    return generation;
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'generate_image',
            description:
                'Generate images using EverArt Models and returns a clickable link to view the generated image. ' +
                'The tool will return a URL that can be clicked to view the image in a browser. ' +
                'Available models:\n' +
                '- 5000:FLUX1.1: Standard quality\n' +
                '- 9000:FLUX1.1-ultra: Ultra high quality\n' +
                '- 6000:SD3.5: Stable Diffusion 3.5\n' +
                '- 7000:Recraft-Real: Photorealistic style\n' +
                '- 8000:Recraft-Vector: Vector art style\n' +
                '\nThe response will contain a direct link to view the generated image.',
            inputSchema: {
                type: 'object',
                properties: {
                    prompt: {
                        type: 'string',
                        description: 'Text description of desired image'
                    },
                    model: {
                        type: 'string',
                        description:
                            'Model ID (5000:FLUX1.1, 9000:FLUX1.1-ultra, 6000:SD3.5, 7000:Recraft-Real, 8000:Recraft-Vector)',
                        default: '5000'
                    },
                    image_count: {
                        type: 'number',
                        description: 'Number of images to generate',
                        default: 1
                    }
                },
                required: ['prompt']
            }
        }
    ]
}));

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
        {
            uri: 'everart://images',
            mimeType: 'image/png',
            name: 'Generated Images'
        }
    ]
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {

    if (request.params.uri === 'everart://images') {
        return {
            contents: [
                {
                    uri: 'everart://images',
                    mimeType: 'image/png',
                    blob: '' // Empty since this is just for listing
                }
            ]
        };
    }
    throw new Error('Resource not found');
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {

    if (request.params.name === 'generate_image') {
        try {
            const {
                prompt,
                model = '207910310772879360',
                image_count: imageCount = 1
            } = request.params.arguments || {};

            const generation = await createGenerations(model, prompt, 'txt2img', {
                imageCount,
                height: 1024,
                width: 1024
            });

            // Wait for generation to complete.
            const completedGen = await fetchGenerationWithPolling(generation[0].id);

            const imgUrl = completedGen.image_url;
            if (!imgUrl) throw new Error('No image URL');

            // The original opened the URL in the local browser (`open`), which makes no sense
            // on a server; the returned text is kept identical.
            return {
                content: [
                    {
                        type: 'text',
                        text: `Image generated successfully!\nThe image has been opened in your default browser.\n\nGeneration details:\n- Model: ${model}\n- Prompt: "${prompt}"\n- Image URL: ${imgUrl}\n\nYou can also click the URL above to view the image again.`
                    }
                ]
            };
        } catch (error) {
            // stdout is the MCP channel; diagnostics go to stderr.
            console.error('Detailed error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [{ type: 'text', text: `Error: ${errorMessage}` }],
                isError: true
            };
        }
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
});

server.connect(new StdioServerTransport())
    .then(() => console.error('EverArt MCP Server running on stdio'))
    .catch(console.error);
