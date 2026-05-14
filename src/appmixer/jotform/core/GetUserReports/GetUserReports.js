'use strict';

const dependencies = {
    'jsonata': require('jsonata')
};

module.exports = {

    receive: async function(context) {

        if (context.properties.generateOutputPortOptions) {
            return this.getOutputPortOptions(context, context.messages.in.content.xConnectorOutputType);
        }

        const limit = context.messages.in.content.xConnectorPaginationLimit;
        const {
            data
        } = await this.httpRequest(context);
        const resultsExpression = dependencies.jsonata('content');
        const result = (await resultsExpression.evaluate(data)).slice(0, limit);

        if (context.messages.in.content.xConnectorOutputType === 'object') {
            return context.sendArray(result, 'out');
        } else {
            // array
            return context.sendJson({
                result
            }, 'out');
        }
    },

    httpRequest: async function(context, override = {}) {

        let url = this.getBaseUrl(context) + '/user/reports';

        const headers = {};
        const query = new URLSearchParams;

        const queryParameters = {};

        if (override?.query) {
            Object.keys(override.query).forEach(parameter => {
                queryParameters[parameter] = override.query[parameter];
            });
        }

        Object.keys(queryParameters).forEach(parameter => {
            if (queryParameters[parameter]) {
                query.append(parameter, queryParameters[parameter]);
            }
        });

        query.append('apiKey', context.auth.apiKey);

        const req = {
            url: url,
            method: 'GET',
            headers: headers
        };

        if (override.url) req.url = override.url;
        if (override.body) req.data = override.body;
        if (override.headers) req.headers = override.headers;
        if (override.method) req.method = override.method;

        const queryString = query.toString();
        if (queryString) {
            req.url += '?' + queryString;
        }

        try {
            const response = await context.httpRequest(req);
            const log = {
                step: 'http-request-success',
                request: {
                    url: req.url,
                    method: req.method,
                    headers: req.headers,
                    data: req.data
                },
                response: {
                    data: response.data,
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                }
            };
            await context.log(log);
            return response;
        } catch (err) {
            const log = {
                step: 'http-request-error',
                request: {
                    url: req.url,
                    method: req.method,
                    headers: req.headers,
                    data: req.data
                },
                response: err.response ? {
                    data: err.response.data,
                    status: err.response.status,
                    statusText: err.response.statusText,
                    headers: err.response.headers
                } : undefined
            };
            await context.log(log);
            throw err;
        }
    },

    getBaseUrl: function(context) {

        let url = 'https://{regionPrefix}.jotform.com';
        url = url.replaceAll('{regionPrefix}', context.auth.regionPrefix || 'api');
        return url;
    },

    getOutputPortOptions: function(context, xConnectorOutputType) {

        if (xConnectorOutputType === 'object') {
            return context.sendJson(this.objectOutputOptions, 'out');
        } else if (xConnectorOutputType === 'array') {
            return context.sendJson(this.arrayOutputOptions, 'out');
        }
    },

    arrayOutputOptions: [{
        'label': 'Result',
        'value': 'result',
        'schema': {
            'type': 'array',
            'items': {
                'type': 'object',
                'properties': {
                    'id': { 'type': 'string', 'example': '3028431756781' },
                    'form_id': { 'type': 'string', 'example': '242678198603467' },
                    'title': { 'type': 'string', 'example': 'Monthly Summary Report' },
                    'created_at': { 'type': 'string', 'example': '2025-01-15 10:30:00' },
                    'updated_at': { 'type': 'string', 'example': '2025-09-04 22:23:43' },
                    'fields': { 'type': 'string', 'example': 'field1,field2' },
                    'list_type': { 'type': 'string', 'example': 'grid' },
                    'status': { 'type': 'string', 'example': 'ENABLED' },
                    'url': { 'type': 'string', 'example': 'https://www.jotform.com/report/3028431756781' },
                    'isProtected': { 'type': 'boolean', 'example': false }
                }
            }
        }
    }],

    objectOutputOptions: [
    { 'label': 'Id', 'value': 'id', 'schema': { 'type': 'string', 'example': '3028431756781' } },
    { 'label': 'Form Id', 'value': 'form_id', 'schema': { 'type': 'string', 'example': '242678198603467' } },
    { 'label': 'Title', 'value': 'title', 'schema': { 'type': 'string', 'example': 'Monthly Summary Report' } },
    { 'label': 'Created At', 'value': 'created_at', 'schema': { 'type': 'string', 'example': '2025-01-15 10:30:00' } },
    { 'label': 'Updated At', 'value': 'updated_at', 'schema': { 'type': 'string', 'example': '2025-09-04 22:23:43' } },
    { 'label': 'Fields', 'value': 'fields', 'schema': { 'type': 'string', 'example': 'field1,field2' } },
    { 'label': 'List Type', 'value': 'list_type', 'schema': { 'type': 'string', 'example': 'grid' } },
    { 'label': 'Status', 'value': 'status', 'schema': { 'type': 'string', 'example': 'ENABLED' } },
    { 'label': 'Url', 'value': 'url', 'schema': { 'type': 'string', 'example': 'https://www.jotform.com/report/3028431756781' } },
    { 'label': 'Is Protected', 'value': 'isProtected', 'schema': { 'type': 'boolean', 'example': false } }
    ]
};
