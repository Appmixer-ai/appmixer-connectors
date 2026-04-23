#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '../src/appmixer');

// Common inPorts/outPorts template
function makeInPorts(connectorLabel, baseUrlNote) {
    return [
        {
            name: 'in',
            schema: {
                type: 'object',
                properties: {
                    url: { type: 'string' },
                    method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
                    headers: { type: 'string' },
                    parameters: { type: 'string' },
                    body: { type: 'string' }
                },
                required: ['url', 'method']
            },
            inspector: {
                inputs: {
                    url: {
                        type: 'text',
                        index: 1,
                        label: 'API Endpoint Path',
                        tooltip: `Enter the API endpoint path relative to <code>${baseUrlNote}</code> (for example <code>/v1/resource</code>) or provide a full URL.`
                    },
                    method: {
                        type: 'select',
                        index: 2,
                        label: 'HTTP Method',
                        defaultValue: 'GET',
                        tooltip: 'Select the HTTP method for the API call.',
                        options: [
                            { label: 'GET', value: 'GET' },
                            { label: 'POST', value: 'POST' },
                            { label: 'PUT', value: 'PUT' },
                            { label: 'PATCH', value: 'PATCH' },
                            { label: 'DELETE', value: 'DELETE' }
                        ]
                    },
                    headers: {
                        type: 'textarea',
                        index: 3,
                        label: 'Request Headers',
                        tooltip: 'Optional additional request headers as a JSON object (e.g. <code>{"X-Custom-Header": "value"}</code>).'
                    },
                    parameters: {
                        type: 'textarea',
                        index: 4,
                        label: 'Query Parameters',
                        tooltip: 'Optional query parameters as a JSON object (e.g. <code>{"key": "value"}</code>).'
                    },
                    body: {
                        type: 'textarea',
                        index: 5,
                        label: 'Request Body',
                        tooltip: 'Enter the request body for the API call (JSON format).'
                    }
                }
            }
        }
    ];
}

const outPorts = [
    {
        name: 'out',
        options: [
            { label: 'Status Code', value: 'status' },
            { label: 'Response Headers', value: 'headers' },
            { label: 'Response Body', value: 'body', schema: { type: 'object', properties: {} } }
        ]
    }
];

function makeComponentJson(connectorName, label, icon, baseUrlNote) {
    return {
        name: `appmixer.${connectorName}.core.MakeApiCall`,
        author: 'Appmixer <info@appmixer.com>',
        description: `Performs an arbitrary authorized API call to the ${label} API.`,
        version: '1.0.0',
        private: false,
        auth: {
            service: `appmixer:${connectorName}`
        },
        quota: {
            manager: `appmixer:${connectorName}`,
            resources: 'requests',
            scope: {
                userId: '{{userId}}'
            }
        },
        inPorts: makeInPorts(label, baseUrlNote),
        outPorts,
        icon
    };
}

// JS template generators

function bearerTemplate(connectorName, baseUrlExpr, authField) {
    return `'use strict';

module.exports = {
    async receive(context) {

        const { url, method, headers, parameters, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint URL is required!');
        }
        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        let parsedHeaders = {};
        if (headers) {
            try {
                parsedHeaders = JSON.parse(headers);
            } catch (e) {
                throw new context.CancelError('Headers must be a valid JSON object.');
            }
        }

        let parsedParameters = {};
        if (parameters) {
            try {
                parsedParameters = JSON.parse(parameters);
            } catch (e) {
                throw new context.CancelError('Parameters must be a valid JSON object.');
            }
        }

        const baseUrl = ${baseUrlExpr};
        const targetUrl = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : \`\${baseUrl}\${url}\`;

        const queryString = Object.keys(parsedParameters).length
            ? '?' + new URLSearchParams(parsedParameters).toString()
            : '';

        const requestOptions = {
            method,
            url: targetUrl + queryString,
            headers: {
                'Authorization': \`Bearer \${${authField}}\`,
                'Content-Type': 'application/json',
                ...parsedHeaders
            }
        };

        if (body) {
            try {
                requestOptions.data = JSON.parse(body);
            } catch (e) {
                throw new context.CancelError('Request Body must be valid JSON.');
            }
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
`;
}

function customHeaderTemplate(connectorName, baseUrlExpr, authHeadersExpr) {
    return `'use strict';

module.exports = {
    async receive(context) {

        const { url, method, headers, parameters, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint URL is required!');
        }
        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        let parsedHeaders = {};
        if (headers) {
            try {
                parsedHeaders = JSON.parse(headers);
            } catch (e) {
                throw new context.CancelError('Headers must be a valid JSON object.');
            }
        }

        let parsedParameters = {};
        if (parameters) {
            try {
                parsedParameters = JSON.parse(parameters);
            } catch (e) {
                throw new context.CancelError('Parameters must be a valid JSON object.');
            }
        }

        const baseUrl = ${baseUrlExpr};
        const targetUrl = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : \`\${baseUrl}\${url}\`;

        const queryString = Object.keys(parsedParameters).length
            ? '?' + new URLSearchParams(parsedParameters).toString()
            : '';

        const requestOptions = {
            method,
            url: targetUrl + queryString,
            headers: {
                ${authHeadersExpr},
                'Content-Type': 'application/json',
                ...parsedHeaders
            }
        };

        if (body) {
            try {
                requestOptions.data = JSON.parse(body);
            } catch (e) {
                throw new context.CancelError('Request Body must be valid JSON.');
            }
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
`;
}

function basicAuthTemplate(connectorName, baseUrlExpr, credentialsExpr) {
    return `'use strict';

module.exports = {
    async receive(context) {

        const { url, method, headers, parameters, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint URL is required!');
        }
        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        let parsedHeaders = {};
        if (headers) {
            try {
                parsedHeaders = JSON.parse(headers);
            } catch (e) {
                throw new context.CancelError('Headers must be a valid JSON object.');
            }
        }

        let parsedParameters = {};
        if (parameters) {
            try {
                parsedParameters = JSON.parse(parameters);
            } catch (e) {
                throw new context.CancelError('Parameters must be a valid JSON object.');
            }
        }

        const baseUrl = ${baseUrlExpr};
        const targetUrl = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : \`\${baseUrl}\${url}\`;

        const queryString = Object.keys(parsedParameters).length
            ? '?' + new URLSearchParams(parsedParameters).toString()
            : '';

        const credentials = Buffer.from(${credentialsExpr}).toString('base64');

        const requestOptions = {
            method,
            url: targetUrl + queryString,
            headers: {
                'Authorization': \`Basic \${credentials}\`,
                'Content-Type': 'application/json',
                ...parsedHeaders
            }
        };

        if (body) {
            try {
                requestOptions.data = JSON.parse(body);
            } catch (e) {
                throw new context.CancelError('Request Body must be valid JSON.');
            }
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
`;
}

// Connector definitions
const connectors = [
    {
        name: 'activecampaign',
        label: 'ActiveCampaign',
        baseUrlNote: 'your ActiveCampaign URL',
        baseUrlExpr: 'context.auth.url.replace(/\\/$/, \'\')',
        type: 'custom',
        authHeadersExpr: "'Api-Token': context.auth.apiKey"
    },
    {
        name: 'apify',
        label: 'Apify',
        baseUrlNote: 'https://api.apify.com/v2',
        baseUrlExpr: "'https://api.apify.com/v2'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'azuredocumentintelligence',
        label: 'Azure Document Intelligence',
        baseUrlNote: 'your Azure Document Intelligence endpoint',
        baseUrlExpr: 'context.auth.endpoint.replace(/\\/$/, \'\')',
        type: 'custom',
        authHeadersExpr: "'Ocp-Apim-Subscription-Key': context.auth.apiKey"
    },
    {
        name: 'beehiiv',
        label: 'beehiiv',
        baseUrlNote: 'https://api.beehiiv.com/v2',
        baseUrlExpr: "'https://api.beehiiv.com/v2'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'betterstack',
        label: 'Better Stack',
        baseUrlNote: 'https://uptime.betterstack.com/api/v2',
        baseUrlExpr: "'https://uptime.betterstack.com/api/v2'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'bigCommerce',
        label: 'BigCommerce',
        baseUrlNote: 'https://api.bigcommerce.com/stores/{storeHash}/v3',
        baseUrlExpr: '`https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3`',
        type: 'custom',
        authHeadersExpr: "'X-Auth-Token': context.auth.accessToken"
    },
    {
        name: 'brevo',
        label: 'Brevo',
        baseUrlNote: 'https://api.brevo.com/v3',
        baseUrlExpr: "'https://api.brevo.com/v3'",
        type: 'custom',
        authHeadersExpr: "'api-key': context.auth.apiKey"
    },
    {
        name: 'clearbit',
        label: 'Clearbit',
        baseUrlNote: 'https://company.clearbit.com',
        baseUrlExpr: "'https://company.clearbit.com'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'cloudflare',
        label: 'Cloudflare',
        baseUrlNote: 'https://api.cloudflare.com/client/v4',
        baseUrlExpr: "'https://api.cloudflare.com/client/v4'",
        type: 'cloudflare'
    },
    {
        name: 'cloudflareWAF',
        label: 'Cloudflare WAF',
        baseUrlNote: 'https://api.cloudflare.com/client/v4',
        baseUrlExpr: "'https://api.cloudflare.com/client/v4'",
        type: 'bearer',
        authField: 'context.auth.apiToken'
    },
    {
        name: 'elevenlabs',
        label: 'ElevenLabs',
        baseUrlNote: 'https://api.elevenlabs.io/v1',
        baseUrlExpr: "'https://api.elevenlabs.io/v1'",
        type: 'custom',
        authHeadersExpr: "'xi-api-key': context.auth.apiKey"
    },
    {
        name: 'everart',
        label: 'EverArt',
        baseUrlNote: 'https://api.everart.ai/v1',
        baseUrlExpr: "'https://api.everart.ai/v1'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'freshdesk',
        label: 'Freshdesk',
        baseUrlNote: 'https://{domain}.freshdesk.com/api/v2',
        baseUrlExpr: '`https://${context.auth.domain}.freshdesk.com/api/v2`',
        type: 'basic',
        credentialsExpr: '`${context.auth.apiKey}:X`'
    },
    {
        name: 'freshsales',
        label: 'Freshsales',
        baseUrlNote: 'your Freshsales domain URL',
        baseUrlExpr: 'context.auth.domain.replace(/\\/$/, \'\')',
        type: 'custom',
        authHeadersExpr: "'Authorization': `Token token=${context.auth.apiKey}`"
    },
    {
        name: 'gohighlevel',
        label: 'GoHighLevel',
        baseUrlNote: 'https://services.leadconnectorhq.com',
        baseUrlExpr: "'https://services.leadconnectorhq.com'",
        type: 'bearer',
        authField: 'context.auth.accessToken'
    },
    {
        name: 'imperva',
        label: 'Imperva',
        baseUrlNote: 'https://my.imperva.com',
        baseUrlExpr: "'https://my.imperva.com'",
        type: 'custom',
        authHeadersExpr: "'x-API-Id': context.auth.id,\n                'x-API-Key': context.auth.key"
    },
    {
        name: 'jotform',
        label: 'JotForm',
        baseUrlNote: 'https://api.jotform.com or https://eu-api.jotform.com',
        baseUrlExpr: '`https://${context.auth.regionPrefix || \'api\'}.jotform.com`',
        type: 'custom',
        authHeadersExpr: "'APIKEY': context.auth.apiKey"
    },
    {
        name: 'kit',
        label: 'Kit',
        baseUrlNote: 'https://api.kit.com/v4',
        baseUrlExpr: "'https://api.kit.com/v4'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'klaviyo',
        label: 'Klaviyo',
        baseUrlNote: 'https://a.klaviyo.com/api',
        baseUrlExpr: "'https://a.klaviyo.com/api'",
        type: 'custom',
        authHeadersExpr: "'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,\n                'revision': '2024-10-15'"
    },
    {
        name: 'leadspicker',
        label: 'Leadspicker',
        baseUrlNote: 'https://leadspicker.com',
        baseUrlExpr: "'https://leadspicker.com'",
        type: 'custom',
        authHeadersExpr: "'X-API-Key': context.auth.apiKey"
    },
    {
        name: 'lemonsqueezy',
        label: 'Lemon Squeezy',
        baseUrlNote: 'https://api.lemonsqueezy.com/v1',
        baseUrlExpr: "'https://api.lemonsqueezy.com/v1'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'line',
        label: 'LINE',
        baseUrlNote: 'https://api.line.me',
        baseUrlExpr: "'https://api.line.me'",
        type: 'bearer',
        authField: 'context.auth.channelAccessToken'
    },
    {
        name: 'logscale',
        label: 'LogScale',
        baseUrlNote: 'your LogScale ingestion URL',
        baseUrlExpr: 'context.auth.url.replace(/\\/$/, \'\')',
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'mailerlite',
        label: 'MailerLite',
        baseUrlNote: 'https://connect.mailerlite.com/api',
        baseUrlExpr: "'https://connect.mailerlite.com/api'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'mandrill',
        label: 'Mandrill',
        baseUrlNote: 'https://mandrillapp.com/api/1.0',
        baseUrlExpr: "'https://mandrillapp.com/api/1.0'",
        type: 'mandrill'
    },
    {
        name: 'merk',
        label: 'Merk',
        baseUrlNote: 'https://api.merk.cz',
        baseUrlExpr: "'https://api.merk.cz'",
        type: 'custom',
        authHeadersExpr: "'Authorization': `Token ${context.auth.apiKey}`"
    },
    {
        name: 'monday',
        label: 'Monday.com',
        baseUrlNote: 'https://api.monday.com/v2',
        baseUrlExpr: "'https://api.monday.com/v2'",
        type: 'custom',
        authHeadersExpr: "'Authorization': context.auth.apiKey"
    },
    {
        name: 'naxai',
        label: 'Naxai',
        baseUrlNote: 'https://api.naxai.com',
        baseUrlExpr: "'https://api.naxai.com'",
        type: 'custom',
        authHeadersExpr: "'X-Client-Id': context.auth.clientId,\n                'X-Client-Secret': context.auth.clientSecret"
    },
    {
        name: 'nexl',
        label: 'NEXL',
        baseUrlNote: 'https://{regionPrefix}.nexl.cloud',
        baseUrlExpr: '`https://${context.auth.regionPrefix}.nexl.cloud`',
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'ntfy',
        label: 'ntfy',
        baseUrlNote: 'your ntfy server URL',
        baseUrlExpr: '(context.auth.serverUrl || \'https://ntfy.sh\').replace(/\\/$/, \'\')',
        type: 'bearer',
        authField: 'context.auth.accessToken'
    },
    {
        name: 'onesignal',
        label: 'OneSignal',
        baseUrlNote: 'https://onesignal.com/api/v1',
        baseUrlExpr: "'https://onesignal.com/api/v1'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'openai',
        label: 'OpenAI',
        baseUrlNote: 'https://api.openai.com/v1',
        baseUrlExpr: "'https://api.openai.com/v1'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'paddle',
        label: 'Paddle',
        baseUrlNote: 'https://api.paddle.com',
        baseUrlExpr: "'https://api.paddle.com'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'pdfco',
        label: 'PDF.co',
        baseUrlNote: 'https://api.pdf.co/v1',
        baseUrlExpr: "'https://api.pdf.co/v1'",
        type: 'custom',
        authHeadersExpr: "'x-api-key': context.auth.apiKey"
    },
    {
        name: 'perplexity',
        label: 'Perplexity',
        baseUrlNote: 'https://api.perplexity.ai',
        baseUrlExpr: "'https://api.perplexity.ai'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'pinecone',
        label: 'Pinecone',
        baseUrlNote: 'https://api.pinecone.io',
        baseUrlExpr: "'https://api.pinecone.io'",
        type: 'custom',
        authHeadersExpr: "'Api-Key': context.auth.apiKey"
    },
    {
        name: 'pipedrive',
        label: 'Pipedrive',
        baseUrlNote: 'https://api.pipedrive.com/v1',
        baseUrlExpr: "'https://api.pipedrive.com/v1'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'plivo',
        label: 'Plivo',
        baseUrlNote: 'https://api.plivo.com/v1',
        baseUrlExpr: "'https://api.plivo.com/v1'",
        type: 'basic',
        credentialsExpr: '`${context.auth.accountSID}:${context.auth.authenticationToken}`'
    },
    {
        name: 'ragieai',
        label: 'Ragie AI',
        baseUrlNote: 'https://api.ragie.ai',
        baseUrlExpr: "'https://api.ragie.ai'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'railway',
        label: 'Railway',
        baseUrlNote: 'https://backboard.railway.app/graphql/v2',
        baseUrlExpr: "'https://backboard.railway.app/graphql/v2'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'redmine',
        label: 'Redmine',
        baseUrlNote: 'your Redmine server URL',
        baseUrlExpr: 'context.auth.url.replace(/\\/$/, \'\')',
        type: 'custom',
        authHeadersExpr: "'X-Redmine-API-Key': context.auth.apiKey"
    },
    {
        name: 'replicate',
        label: 'Replicate',
        baseUrlNote: 'https://api.replicate.com/v1',
        baseUrlExpr: "'https://api.replicate.com/v1'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'resend',
        label: 'Resend',
        baseUrlNote: 'https://api.resend.com',
        baseUrlExpr: "'https://api.resend.com'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'servicenow',
        label: 'ServiceNow',
        baseUrlNote: 'https://{instance}.service-now.com',
        baseUrlExpr: '`https://${context.auth.instance}.service-now.com`',
        type: 'servicenow'
    },
    {
        name: 'sonarqube',
        label: 'SonarQube',
        baseUrlNote: 'your SonarQube server URL',
        baseUrlExpr: 'context.auth.serverUrl.replace(/\\/$/, \'\')',
        type: 'basic',
        credentialsExpr: '`${context.auth.apiKey}:`'
    },
    {
        name: 'tally',
        label: 'Tally',
        baseUrlNote: 'https://api.tally.so',
        baseUrlExpr: "'https://api.tally.so'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'twilio',
        label: 'Twilio',
        baseUrlNote: 'https://api.twilio.com/2010-04-01',
        baseUrlExpr: "'https://api.twilio.com/2010-04-01'",
        type: 'basic',
        credentialsExpr: '`${context.auth.accountSID}:${context.auth.authenticationToken}`'
    },
    {
        name: 'unkey',
        label: 'Unkey',
        baseUrlNote: 'https://api.unkey.com/v2',
        baseUrlExpr: "'https://api.unkey.com/v2'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'userengage',
        label: 'User.com',
        baseUrlNote: 'https://app.userengage.io',
        baseUrlExpr: "'https://app.userengage.io'",
        type: 'custom',
        authHeadersExpr: "'authorization': `Token ${context.auth.apiKey}`"
    },
    {
        name: 'vapi',
        label: 'Vapi',
        baseUrlNote: 'https://api.vapi.ai',
        baseUrlExpr: "'https://api.vapi.ai'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'verifyemail',
        label: 'Verify-Email',
        baseUrlNote: 'https://verifyemail.io/api',
        baseUrlExpr: "'https://verifyemail.io/api'",
        type: 'verifyemail'
    },
    {
        name: 'virustotal',
        label: 'VirusTotal',
        baseUrlNote: 'https://www.virustotal.com/api/v3',
        baseUrlExpr: "'https://www.virustotal.com/api/v3'",
        type: 'custom',
        authHeadersExpr: "'x-apikey': context.auth.apiKey"
    },
    {
        name: 'voys',
        label: 'Voys',
        baseUrlNote: 'https://freedom.voys.nl/api',
        baseUrlExpr: "'https://freedom.voys.nl/api'",
        type: 'custom',
        authHeadersExpr: "'Authorization': `token ${context.auth.username}:${context.auth.apiKey}`"
    },
    {
        name: 'webflow',
        label: 'Webflow',
        baseUrlNote: 'https://api.webflow.com/v2',
        baseUrlExpr: "'https://api.webflow.com/v2'",
        type: 'bearer',
        authField: 'context.auth.apiKey'
    },
    {
        name: 'xtremepush',
        label: 'XtremePush',
        baseUrlNote: 'https://external-api.xtremepush.com',
        baseUrlExpr: "'https://external-api.xtremepush.com'",
        type: 'xtremepush'
    }
];

// Special JS templates
const specialTemplates = {
    cloudflare: `'use strict';

module.exports = {
    async receive(context) {

        const { url, method, headers, parameters, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint URL is required!');
        }
        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        let parsedHeaders = {};
        if (headers) {
            try {
                parsedHeaders = JSON.parse(headers);
            } catch (e) {
                throw new context.CancelError('Headers must be a valid JSON object.');
            }
        }

        let parsedParameters = {};
        if (parameters) {
            try {
                parsedParameters = JSON.parse(parameters);
            } catch (e) {
                throw new context.CancelError('Parameters must be a valid JSON object.');
            }
        }

        const baseUrl = 'https://api.cloudflare.com/client/v4';
        const targetUrl = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : \`\${baseUrl}\${url}\`;

        const queryString = Object.keys(parsedParameters).length
            ? '?' + new URLSearchParams(parsedParameters).toString()
            : '';

        const authHeaders = context.auth.email
            ? { 'X-Auth-Email': context.auth.email, 'X-Auth-Key': context.auth.apiKey }
            : { 'Authorization': \`Bearer \${context.auth.apiKey}\` };

        const requestOptions = {
            method,
            url: targetUrl + queryString,
            headers: {
                ...authHeaders,
                'Content-Type': 'application/json',
                ...parsedHeaders
            }
        };

        if (body) {
            try {
                requestOptions.data = JSON.parse(body);
            } catch (e) {
                throw new context.CancelError('Request Body must be valid JSON.');
            }
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
`,
    mandrill: `'use strict';

module.exports = {
    async receive(context) {

        const { url, method, headers, parameters, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint URL is required!');
        }
        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        let parsedHeaders = {};
        if (headers) {
            try {
                parsedHeaders = JSON.parse(headers);
            } catch (e) {
                throw new context.CancelError('Headers must be a valid JSON object.');
            }
        }

        let parsedParameters = {};
        if (parameters) {
            try {
                parsedParameters = JSON.parse(parameters);
            } catch (e) {
                throw new context.CancelError('Parameters must be a valid JSON object.');
            }
        }

        const baseUrl = 'https://mandrillapp.com/api/1.0';
        const targetUrl = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : \`\${baseUrl}\${url}\`;

        const queryString = Object.keys(parsedParameters).length
            ? '?' + new URLSearchParams(parsedParameters).toString()
            : '';

        let parsedBody = {};
        if (body) {
            try {
                parsedBody = JSON.parse(body);
            } catch (e) {
                throw new context.CancelError('Request Body must be valid JSON.');
            }
        }

        const requestOptions = {
            method,
            url: targetUrl + queryString,
            headers: {
                'Content-Type': 'application/json',
                ...parsedHeaders
            },
            data: {
                key: context.auth.apiKey,
                ...parsedBody
            }
        };

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
`,
    servicenow: `'use strict';

module.exports = {
    async receive(context) {

        const { url, method, headers, parameters, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint URL is required!');
        }
        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        let parsedHeaders = {};
        if (headers) {
            try {
                parsedHeaders = JSON.parse(headers);
            } catch (e) {
                throw new context.CancelError('Headers must be a valid JSON object.');
            }
        }

        let parsedParameters = {};
        if (parameters) {
            try {
                parsedParameters = JSON.parse(parameters);
            } catch (e) {
                throw new context.CancelError('Parameters must be a valid JSON object.');
            }
        }

        const baseUrl = \`https://\${context.auth.instance}.service-now.com\`;
        const targetUrl = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : \`\${baseUrl}\${url}\`;

        const queryString = Object.keys(parsedParameters).length
            ? '?' + new URLSearchParams(parsedParameters).toString()
            : '';

        const authHeaders = context.auth.apiKey
            ? { 'x-sn-apikey': context.auth.apiKey }
            : { 'Authorization': 'Basic ' + Buffer.from(\`\${context.auth.username}:\${context.auth.password}\`).toString('base64') };

        const requestOptions = {
            method,
            url: targetUrl + queryString,
            headers: {
                ...authHeaders,
                'Content-Type': 'application/json',
                ...parsedHeaders
            }
        };

        if (body) {
            try {
                requestOptions.data = JSON.parse(body);
            } catch (e) {
                throw new context.CancelError('Request Body must be valid JSON.');
            }
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
`,
    verifyemail: `'use strict';

module.exports = {
    async receive(context) {

        const { url, method, headers, parameters, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint URL is required!');
        }
        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        let parsedHeaders = {};
        if (headers) {
            try {
                parsedHeaders = JSON.parse(headers);
            } catch (e) {
                throw new context.CancelError('Headers must be a valid JSON object.');
            }
        }

        let parsedParameters = {};
        if (parameters) {
            try {
                parsedParameters = JSON.parse(parameters);
            } catch (e) {
                throw new context.CancelError('Parameters must be a valid JSON object.');
            }
        }

        const baseUrl = 'https://verifyemail.io/api';
        const targetUrl = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : \`\${baseUrl}\${url}\`;

        // API key is passed as a query parameter
        const allParams = { apikey: context.auth.apiKey, ...parsedParameters };
        const queryString = '?' + new URLSearchParams(allParams).toString();

        const requestOptions = {
            method,
            url: targetUrl + queryString,
            headers: {
                'Content-Type': 'application/json',
                ...parsedHeaders
            }
        };

        if (body) {
            try {
                requestOptions.data = JSON.parse(body);
            } catch (e) {
                throw new context.CancelError('Request Body must be valid JSON.');
            }
        }

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
`,
    xtremepush: `'use strict';

module.exports = {
    async receive(context) {

        const { url, method, headers, parameters, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint URL is required!');
        }
        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        let parsedHeaders = {};
        if (headers) {
            try {
                parsedHeaders = JSON.parse(headers);
            } catch (e) {
                throw new context.CancelError('Headers must be a valid JSON object.');
            }
        }

        let parsedParameters = {};
        if (parameters) {
            try {
                parsedParameters = JSON.parse(parameters);
            } catch (e) {
                throw new context.CancelError('Parameters must be a valid JSON object.');
            }
        }

        const baseUrl = 'https://external-api.xtremepush.com';
        const targetUrl = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : \`\${baseUrl}\${url}\`;

        const queryString = Object.keys(parsedParameters).length
            ? '?' + new URLSearchParams(parsedParameters).toString()
            : '';

        let parsedBody = {};
        if (body) {
            try {
                parsedBody = JSON.parse(body);
            } catch (e) {
                throw new context.CancelError('Request Body must be valid JSON.');
            }
        }

        const requestOptions = {
            method,
            url: targetUrl + queryString,
            headers: {
                'Content-Type': 'application/json',
                ...parsedHeaders
            },
            data: {
                apptoken: context.auth.apiKey,
                ...parsedBody
            }
        };

        const response = await context.httpRequest(requestOptions);

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
`
};

function generateJs(connector) {
    const { type, baseUrlExpr, authField, authHeadersExpr, credentialsExpr } = connector;
    if (specialTemplates[type]) {
        return specialTemplates[type];
    }
    if (type === 'bearer') {
        return bearerTemplate(connector.name, baseUrlExpr, authField);
    }
    if (type === 'custom') {
        return customHeaderTemplate(connector.name, baseUrlExpr, authHeadersExpr);
    }
    if (type === 'basic') {
        return basicAuthTemplate(connector.name, baseUrlExpr, credentialsExpr);
    }
    throw new Error(`Unknown type: ${type} for ${connector.name}`);
}

function bumpMinorVersion(version) {
    const parts = version.split('.');
    const major = parseInt(parts[0], 10);
    const minor = parseInt(parts[1], 10);
    return `${major}.${minor + 1}.0`;
}

let created = 0;
let errors = [];

for (const connector of connectors) {
    try {
        const connectorDir = path.join(baseDir, connector.name);
        if (!fs.existsSync(connectorDir)) {
            errors.push(`Connector directory not found: ${connector.name}`);
            continue;
        }

        // Read service.json for icon
        const serviceJsonPath = path.join(connectorDir, 'service.json');
        if (!fs.existsSync(serviceJsonPath)) {
            errors.push(`service.json not found for ${connector.name}`);
            continue;
        }
        const serviceJson = JSON.parse(fs.readFileSync(serviceJsonPath, 'utf8'));
        const icon = serviceJson.icon;

        // Create MakeApiCall directory
        const coreDir = path.join(connectorDir, 'core');
        const makeApiCallDir = path.join(coreDir, 'MakeApiCall');
        if (!fs.existsSync(coreDir)) {
            fs.mkdirSync(coreDir, { recursive: true });
        }
        if (!fs.existsSync(makeApiCallDir)) {
            fs.mkdirSync(makeApiCallDir, { recursive: true });
        }

        // Generate component.json
        const componentJson = makeComponentJson(connector.name, connector.label, icon, connector.baseUrlNote);
        fs.writeFileSync(
            path.join(makeApiCallDir, 'component.json'),
            JSON.stringify(componentJson, null, 4) + '\n'
        );

        // Generate MakeApiCall.js
        const jsContent = generateJs(connector);
        fs.writeFileSync(path.join(makeApiCallDir, 'MakeApiCall.js'), jsContent);

        // Update bundle.json
        const bundleJsonPath = path.join(connectorDir, 'bundle.json');
        let bundleJson;
        if (fs.existsSync(bundleJsonPath)) {
            bundleJson = JSON.parse(fs.readFileSync(bundleJsonPath, 'utf8'));
            const newVersion = bumpMinorVersion(bundleJson.version);
            bundleJson.changelog[newVersion] = ['add MakeApiCall component'];
            bundleJson.version = newVersion;
        } else {
            bundleJson = {
                name: `appmixer.${connector.name}`,
                version: '1.1.0',
                changelog: {
                    '1.0.0': ['Initial release.'],
                    '1.1.0': ['add MakeApiCall component']
                }
            };
        }
        fs.writeFileSync(bundleJsonPath, JSON.stringify(bundleJson, null, 4) + '\n');

        created++;
        console.log(`✓ ${connector.name}`);
    } catch (err) {
        errors.push(`${connector.name}: ${err.message}`);
        console.error(`✗ ${connector.name}: ${err.message}`);
    }
}

console.log(`\nCreated: ${created}/${connectors.length}`);
if (errors.length) {
    console.log('Errors:');
    errors.forEach(e => console.log('  -', e));
}
