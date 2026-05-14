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

        // Transform each submission to convert answers from object to array
        result = result.map(submission => ({
            ...submission,
            answersList: Object.values(submission.answers || {})
        }));

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

        let url = this.getBaseUrl(context) + `/form/${input['id']}/submissions`;

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
                    'id': {
                        'type': 'string'
                    },
                    'form_id': {
                        'type': 'string'
                    },
                    'ip': {
                        'type': 'string'
                    },
                    'created_at': {
                        'type': 'string'
                    },
                    'updated_at': {
                        'type': 'string'
                    },
                    'status': {
                        'type': 'string'
                    },
                    'new': {
                        'type': 'string'
                    },
                    'answers': {
                        'type': 'object'
                    },
                    'answersList': {
                        'type': 'array',
                        'description': 'Form answers as an ordered array. Each item represents one field. The answer property can be a string, object (compound fields), or nested object with arrays (matrix fields).',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'name': { 'type': 'string', 'example': 'phoneNumber5' },
                                'order': { 'type': 'string', 'example': '5' },
                                'text': { 'type': 'string', 'example': 'Phone Number' },
                                'type': { 'type': 'string', 'example': 'control_phone' },
                                'sublabels': {
                                    'type': 'object',
                                    'description': 'Sub-labels for compound fields',
                                    'example': { 'area': 'Area Code', 'phone': 'Phone Number' }
                                },
                                'answer': {
                                    'description': 'String for simple fields, object for compound fields (address/fullname), object with array values for matrix fields.',
                                    'example': '(123) 123-1233'
                                },
                                'prettyFormat': {
                                    'type': 'string',
                                    'description': 'Human-readable formatted answer for compound/matrix fields.',
                                    'example': 'FULL NAME LAST NAME'
                                }
                            }
                        }
                    },
                    'workflowStatus': {
                        'type': 'string'
                    }
                }
            }
        }
    }],

    objectOutputOptions: [{
        'label': 'Id',
        'value': 'id'
    },
    {
        'label': 'Form Id',
        'value': 'form_id'
    },
    {
        'label': 'Ip',
        'value': 'ip'
    },
    {
        'label': 'Created At',
        'value': 'created_at'
    },
    {
        'label': 'Updated At',
        'value': 'updated_at'
    },
    {
        'label': 'Status',
        'value': 'status'
    },
    {
        'label': 'New',
        'value': 'new'
    },
    {
        'label': 'Answers',
        'value': 'answers'
    },
    {
        'label': 'Answers List',
        'value': 'answersList',
        'schema': {
            'type': 'array',
            'items': {
                'type': 'object',
                'properties': {
                    'name': { 'type': 'string', 'example': 'phoneNumber5' },
                    'order': { 'type': 'string', 'example': '5' },
                    'text': { 'type': 'string', 'example': 'Phone Number' },
                    'type': { 'type': 'string', 'example': 'control_phone' },
                    'sublabels': {
                        'type': 'object',
                        'description': 'Sub-labels for compound fields (e.g. address parts, name parts)',
                        'example': { 'area': 'Area Code', 'phone': 'Phone Number' }
                    },
                    'answer': {
                        'description': 'The submitted value. String for simple fields (text, email, dropdown), object for compound fields (address, fullname, phone), or object with array values for matrix fields.',
                        'example': '(123) 123-1233'
                    },
                    'prettyFormat': {
                        'type': 'string',
                        'description': 'Human-readable formatted answer for compound/matrix fields.',
                        'example': 'FULL NAME LAST NAME'
                    }
                }
            }
        }
    },
    {
        'label': 'Workflow Status',
        'value': 'workflowStatus'
    }
    ]
};
