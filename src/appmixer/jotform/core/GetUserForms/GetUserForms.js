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
        const query = {
            'limit': limit,
            'offset': 0
        };
        let data;
        let result;
        let hasMore;
        let needMore;
        let page;

        // Get first page.
        ({
            data
        } = await this.httpRequest(context, {
            query
        }));
        const pageExpression = dependencies.jsonata('content');
        page = await pageExpression.evaluate(data);
        result = page.slice(0, limit);

        hasMore = result.length > 0;
        const countExpression = dependencies.jsonata('resultSet.count');
        let count = await countExpression.evaluate(data);
        hasMore = hasMore && result.length < count;
        needMore = result.length < limit;
        // Failsafe in case the 3rd party API doesn't behave correctly, to prevent infinite loop.
        let failsafe = 0;
        // Repeat for other pages.
        while (hasMore && needMore && failsafe < limit) {
            query['offset'] += 20;
            ({
                data
            } = await this.httpRequest(context, {
                query
            }));
            page = await pageExpression.evaluate(data);
            result = result.concat(page);
            hasMore = page.length > 0;
            count = await countExpression.evaluate(data);
            hasMore = hasMore && result.length < count;
            needMore = result.length < limit;
            failsafe += 1;
        }

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

        const input = context.messages.in.content;

        let url = this.getBaseUrl(context) + '/user/forms';

        const headers = {};
        const query = new URLSearchParams;

        const queryParameters = {
            'orderby': input['orderby'],
            'filter': input['filter']
        };

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
                    'id': { 'type': 'string', 'example': '242678198603467' },
                    'username': { 'type': 'string', 'example': 'johndoe' },
                    'title': { 'type': 'string', 'example': 'Customer Registration Form' },
                    'height': { 'type': 'string', 'example': '600' },
                    'status': { 'type': 'string', 'example': 'ENABLED' },
                    'created_at': { 'type': 'string', 'example': '2025-01-15 10:30:00' },
                    'updated_at': { 'type': 'string', 'example': '2025-09-04 22:23:43' },
                    'last_submission': { 'type': 'string', 'example': '2025-09-04 22:23:43' },
                    'new': { 'type': 'string', 'example': '1' },
                    'count': { 'type': 'string', 'example': '42' },
                    'type': { 'type': 'string', 'example': 'LEGACY' },
                    'favorite': { 'type': 'number', 'example': 0 },
                    'archived': { 'type': 'number', 'example': 0 },
                    'url': { 'type': 'string', 'example': 'https://form.jotform.com/242678198603467' }
                }
            }
        }
    }],

    objectOutputOptions: [
        { 'label': 'Id', 'value': 'id', 'schema': { 'type': 'string', 'example': '242678198603467' } },
        { 'label': 'Username', 'value': 'username', 'schema': { 'type': 'string', 'example': 'johndoe' } },
        { 'label': 'Title', 'value': 'title', 'schema': { 'type': 'string', 'example': 'Customer Registration Form' } },
        { 'label': 'Height', 'value': 'height', 'schema': { 'type': 'string', 'example': '600' } },
        { 'label': 'Status', 'value': 'status', 'schema': { 'type': 'string', 'example': 'ENABLED' } },
        { 'label': 'Created At', 'value': 'created_at', 'schema': { 'type': 'string', 'example': '2025-01-15 10:30:00' } },
        { 'label': 'Updated At', 'value': 'updated_at', 'schema': { 'type': 'string', 'example': '2025-09-04 22:23:43' } },
        { 'label': 'Last Submission', 'value': 'last_submission', 'schema': { 'type': 'string', 'example': '2025-09-04 22:23:43' } },
        { 'label': 'New', 'value': 'new', 'schema': { 'type': 'string', 'example': '1' } },
        { 'label': 'Count', 'value': 'count', 'schema': { 'type': 'string', 'example': '42' } },
        { 'label': 'Type', 'value': 'type', 'schema': { 'type': 'string', 'example': 'LEGACY' } },
        { 'label': 'Favorite', 'value': 'favorite', 'schema': { 'type': 'number', 'example': 0 } },
        { 'label': 'Archived', 'value': 'archived', 'schema': { 'type': 'number', 'example': 0 } },
        { 'label': 'Url', 'value': 'url', 'schema': { 'type': 'string', 'example': 'https://form.jotform.com/242678198603467' } }
    ]
};
