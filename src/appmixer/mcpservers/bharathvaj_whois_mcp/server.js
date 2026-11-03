'use strict';

// Stdio MCP server spawned by lib.mcpCall. It replaces the @bharathvaj/whois-mcp 1.0.1 package
// (pinned to zod 3, which carries a memory exhaustion advisory and whose z.string().ip() does not
// exist in zod 4) and keeps its tool contract: same four tools, input schemas, response text and
// error texts. The WHOIS lookups themselves still go through whoiser 2.0.0-beta.3, exactly as before.
const net = require('net');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } = require('@modelcontextprotocol/sdk/types.js');

// whoiser is an ES module; a CommonJS file can only load it with a dynamic import.
let whoiserPromise;
const loadWhoiser = () => {
    if (!whoiserPromise) {
        whoiserPromise = import('whoiser');
    }
    return whoiserPromise;
};

const ASN_PATTERN = /^AS\d+$/i;

// Input schemas are what zod-to-json-schema produced for the original zod shapes
// (z.string().min(1), z.string().ip(), z.string().regex(/^AS\d+$/i)).
const TOOLS = [
    {
        name: 'whois_domain',
        description: 'Looksup whois information about the domain',
        inputSchema: {
            type: 'object',
            properties: {
                domain: { type: 'string', minLength: 1 }
            },
            required: ['domain'],
            additionalProperties: false,
            $schema: 'http://json-schema.org/draft-07/schema#'
        },
        execution: { taskSupport: 'forbidden' }
    },
    {
        name: 'whois_tld',
        description: 'Looksup whois information about the Top Level Domain (TLD)',
        inputSchema: {
            type: 'object',
            properties: {
                tld: { type: 'string', minLength: 1 }
            },
            required: ['tld'],
            additionalProperties: false,
            $schema: 'http://json-schema.org/draft-07/schema#'
        },
        execution: { taskSupport: 'forbidden' }
    },
    {
        name: 'whois_ip',
        description: 'Looksup whois information about the IP',
        inputSchema: {
            type: 'object',
            properties: {
                ip: { type: 'string', anyOf: [{ format: 'ipv4' }, { format: 'ipv6' }] }
            },
            required: ['ip'],
            additionalProperties: false,
            $schema: 'http://json-schema.org/draft-07/schema#'
        },
        execution: { taskSupport: 'forbidden' }
    },
    {
        name: 'whois_as',
        description: 'Looksup whois information about the Autonomous System Number (ASN)',
        inputSchema: {
            type: 'object',
            properties: {
                asn: { type: 'string', pattern: '^AS\\d+$' }
            },
            required: ['asn'],
            additionalProperties: false,
            $schema: 'http://json-schema.org/draft-07/schema#'
        },
        execution: { taskSupport: 'forbidden' }
    }
];

// Mirrors the zod 3 issue messages the original server produced for its single string argument.
const receivedType = (value) => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
};

const requireString = (args, field) => {
    const value = args[field];
    if (value === undefined) {
        throw new Error(`Required at ${field}`);
    }
    if (typeof value !== 'string') {
        throw new Error(`Expected string, received ${receivedType(value)} at ${field}`);
    }
    return value;
};

const VALIDATORS = {
    whois_domain: (args) => {
        const domain = requireString(args, 'domain');
        if (domain.length < 1) {
            throw new Error('String must contain at least 1 character(s) at domain');
        }
        return { domain };
    },
    whois_tld: (args) => {
        const tld = requireString(args, 'tld');
        if (tld.length < 1) {
            throw new Error('String must contain at least 1 character(s) at tld');
        }
        return { tld };
    },
    whois_ip: (args) => {
        const ip = requireString(args, 'ip');
        if (!net.isIP(ip)) {
            throw new Error('Invalid ip at ip');
        }
        return { ip };
    },
    whois_as: (args) => {
        const asn = requireString(args, 'asn');
        if (!ASN_PATTERN.test(asn)) {
            throw new Error('Invalid at asn');
        }
        // The original zod schema transformed "AS15169" into the number 15169 for whoiser.
        return { asn: parseInt(asn.slice(2)) };
    }
};

const HANDLERS = {
    whois_domain: async ({ domain }) => {
        const { whoisDomain } = await loadWhoiser();
        const result = await whoisDomain(domain);
        return `Domain whois lookup for: \n${JSON.stringify(result)}`;
    },
    whois_tld: async ({ tld }) => {
        const { whoisTld } = await loadWhoiser();
        const result = await whoisTld(tld);
        return `TLD whois lookup for: \n${JSON.stringify(result)}`;
    },
    whois_ip: async ({ ip }) => {
        const { whoisIp } = await loadWhoiser();
        const result = await whoisIp(ip);
        return `IP whois lookup for: \n${JSON.stringify(result)}`;
    },
    whois_as: async ({ asn }) => {
        const { whoisAsn } = await loadWhoiser();
        const result = await whoisAsn(asn);
        return `ASN whois lookup for: \n${JSON.stringify(result)}`;
    }
};

const toolError = (text) => ({ content: [{ type: 'text', text }], isError: true });

const server = new Server(
    { name: 'whois', version: '1.0.0', description: 'MCP for whois lookup about domain, IP, TLD, ASN, etc.' },
    { capabilities: { tools: { listChanged: true } } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {

    const { name, arguments: args = {} } = request.params;
    const validate = VALIDATORS[name];
    if (!validate) {
        // McpServer in the original turned McpError into an isError result with the error's message.
        return toolError(new McpError(ErrorCode.InvalidParams, `Tool ${name} not found`).message);
    }

    let input;
    try {
        input = validate(args);
    } catch (error) {
        return toolError(new McpError(ErrorCode.InvalidParams,
            `Input validation error: Invalid arguments for tool ${name}: ${error.message}`).message);
    }

    try {
        const text = await HANDLERS[name](input);
        return { content: [{ type: 'text', text }] };
    } catch (error) {
        return toolError(`Error: ${error.message}`);
    }
});

async function main() {

    const transport = new StdioServerTransport();
    await server.connect(transport);
    const cleanup = async () => {
        // stdout is the MCP channel; diagnostics go to stderr.
        console.error('Shutting down MCP server...');
        await transport.close();
        process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    console.error('Whois MCP Server running on stdio');
}

main().catch((error) => {
    console.error('Error initializing Whois MCP server:', error.message);
});
