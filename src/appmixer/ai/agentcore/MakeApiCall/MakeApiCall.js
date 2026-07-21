'use strict';

const { URL } = require('url');
const { SignatureV4 } = require('@aws-sdk/signature-v4');
const { HttpRequest } = require('@aws-sdk/protocol-http');
const { Sha256 } = require('@aws-crypto/sha256-js');
const lib = require('../lib');

function kvToObj(value) {
    if (!value) {
        return {};
    }
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (err) {
            return {};
        }
    }
    if (Array.isArray(value)) {
        const out = {};
        for (const row of value) {
            if (row && typeof row === 'object' && typeof row.key === 'string' && row.key.length) {
                out[row.key] = row.value;
            }
        }
        return out;
    }
    return value;
}

module.exports = {

    async receive(context) {

        const { url, method, headers: headersKV, parameters: parametersKV, body } = context.messages.in.content;

        if (!url) {
            throw new context.CancelError('API Endpoint URL is required!');
        }
        if (!method) {
            throw new context.CancelError('HTTP Method is required!');
        }

        const region = lib.resolveRegion(context);
        const extraHeaders = kvToObj(headersKV);
        const queryParams = kvToObj(parametersKV);

        const targetUrl = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : `https://bedrock-agentcore.${region}.amazonaws.com${url.startsWith('/') ? url : '/' + url}`;

        const parsed = new URL(targetUrl);
        const query = {};
        parsed.searchParams.forEach((value, key) => {
            query[key] = value;
        });
        Object.assign(query, queryParams);

        let bodyString;
        if (body !== undefined && body !== null && body !== '') {
            bodyString = typeof body === 'string' ? body : JSON.stringify(body);
        }

        // Derive the signing service name from the host so both the data-plane
        // (bedrock-agentcore) and control-plane (bedrock-agentcore-control) work.
        const service = parsed.hostname.startsWith('bedrock-agentcore-control')
            ? 'bedrock-agentcore-control'
            : 'bedrock-agentcore';

        const credentials = {
            accessKeyId: context.auth.accessKeyId,
            secretAccessKey: context.auth.secretKey
        };
        if (context.auth.sessionToken) {
            credentials.sessionToken = context.auth.sessionToken;
        }

        const requestToSign = new HttpRequest({
            protocol: parsed.protocol,
            hostname: parsed.hostname,
            path: parsed.pathname,
            query,
            method: method.toUpperCase(),
            headers: {
                host: parsed.hostname,
                'content-type': 'application/json',
                ...extraHeaders
            },
            body: bodyString
        });

        const signer = new SignatureV4({ credentials, region, service, sha256: Sha256 });
        const signed = await signer.sign(requestToSign);

        const response = await context.httpRequest({
            method: method.toUpperCase(),
            url: `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`,
            headers: signed.headers,
            params: query,
            data: bodyString
        });

        return context.sendJson({
            status: response.status,
            headers: response.headers,
            body: response.data
        }, 'out');
    }
};
