'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        const { filter, outputType } = context.messages.in.content;
        const { generateOutputPortOptions, isSource } = context.properties;

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Metrics' });
        }

        const queryParams = {
            filter,
            include: 'flow-triggers'
        };

        // https://developers.klaviyo.com/en/reference/get_metrics
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://a.klaviyo.com/api/metrics/',
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            params: queryParams
        });

        const metrics = data.data;

        if (isSource) {
            return context.sendJson({ result: metrics }, 'out');
        }

        if (metrics.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: metrics, outputType });
    },

    toSelectArray({ result }) {

        return result.map(metric => {
            return { label: metric.attributes.name, value: metric.id };
        });
    },
    toSelectArrayNames({ result }) {

        return result.map(metric => {
            return { label: metric.attributes.name, value: metric.attributes.name };
        });
    }
};

const schema = {
    'type': { 'type': 'string', 'title': 'Type' },
    'id': { 'type': 'string', 'title': 'Metric ID' },
    'attributes': {
        'type': 'object',
        'title': 'Attributes',
        'properties': {
            'name': { 'type': 'string', 'title': 'Attributes.Name' },
            'created': { 'type': 'string', 'title': 'Attributes.Created' },
            'updated': { 'type': 'string', 'title': 'Attributes.Updated' },
            'integration': {
                'type': 'object',
                'title': 'Attributes.Integration',
                'properties': {
                    'object': { 'type': 'string', 'title': 'Integration.Object' },
                    'id': { 'type': 'string', 'title': 'Integration.ID' },
                    'key': { 'type': 'string', 'title': 'Integration.Key' },
                    'name': { 'type': 'string', 'title': 'Integration.Name' },
                    'category': { 'type': 'string', 'title': 'Integration.Category' }
                }
            }
        }
    },
    'relationships': {
        'type': 'object',
        'title': 'Relationships',
        'properties': {
            'flow-triggers': {
                'type': 'object',
                'title': 'Flow Triggers',
                'properties': {
                    'data': { 'type': 'array', 'title': 'Flow Triggers.Data' },
                    'links': {
                        'type': 'object',
                        'title': 'Flow Triggers.Links',
                        'properties': {
                            'self': { 'type': 'string', 'title': 'Flow Triggers.Links.Self' },
                            'related': { 'type': 'string', 'title': 'Flow Triggers.Links.Related' }
                        }
                    }
                }
            }
        }
    },
    'links': {
        'type': 'object',
        'title': 'Links',
        'properties': {
            'self': { 'type': 'string', 'title': 'Links.Self' }
        }
    }
};
