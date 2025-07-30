'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'dataType': { 'type': 'string', 'title': 'Data Type' },
    'options': {
        'type': 'array',
        'items': {
            'type': 'object',
            'properties': {
                'id': { 'type': 'string', 'title': 'Option ID' },
                'name': { 'type': 'string', 'title': 'Option Name' },
                'color': { 'type': 'string', 'title': 'Color' }
            }
        },
        'title': 'Options'
    }
};

module.exports = {
    async receive(context) {
        const { projectId, outputType = 'array' } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Fields', value: 'fields' });
        }

        const query = `
            query($projectId: ID!) {
                node(id: $projectId) {
                    ... on ProjectV2 {
                        fields(first: 100) {
                            nodes {
                                ... on ProjectV2Field {
                                    id
                                    name
                                    dataType
                                }
                                ... on ProjectV2SingleSelectField {
                                    id
                                    name
                                    dataType
                                    options {
                                        id
                                        name
                                        color
                                    }
                                }
                                ... on ProjectV2IterationField {
                                    id
                                    name
                                    dataType
                                    configuration {
                                        iterations {
                                            id
                                            title
                                            startDate
                                            duration
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.github.com/graphql',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                query,
                variables: { projectId }
            }
        });

        if (data.errors) {
            throw new context.CancelError(data.errors);
        }

        const project = data.data.node;
        if (!project) {
            throw context.CancelError(`Project with ID '${projectId}' not found`);
        }

        const fields = project.fields.nodes || [];

        return lib.sendArrayOutput({ context, records: fields, outputType });
    }
};
