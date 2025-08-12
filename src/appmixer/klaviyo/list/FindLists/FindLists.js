'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        const { filter, sort, outputType } = context.messages.in.content;
        const { generateOutputPortOptions, isSource } = context.properties;

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Lists' });
        }

        const queryParams = {
            filter,
            include: 'flow-triggers,tags',
            sort
        };

        // https://developers.klaviyo.com/en/reference/get_lists
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://a.klaviyo.com/api/lists',
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            params: queryParams
        });

        const lists = data.data;

        if (isSource) {
            return context.sendJson({ result: lists }, 'out');
        }

        if (lists.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: lists, outputType });
    },

    toSelectArray({ result }) {

        return result.map(list => {
            return { label: list.attributes.name, value: list.id };
        });
    }
};

const schema = {
    'type': { 'type': 'string', 'title': 'Type' },
    'id': { 'type': 'string', 'title': 'List ID' },
    'attributes': {
        'type': 'object',
        'title': 'Attributes',
        'properties': {
            'name': { 'type': 'string', 'title': 'Attributes.Name' },
            'created': { 'type': 'string', 'title': 'Attributes.Created' },
            'updated': { 'type': 'string', 'title': 'Attributes.Updated' },
            'opt_in_process': { 'type': 'string', 'title': 'Attributes.Opt In Process' }
        }
    },
    'links': {
        'type': 'object',
        'title': 'Links',
        'properties': {
            'self': { 'type': 'string', 'title': 'Links.Self' }
        }
    },
    'relationships': {
        'type': 'object',
        'title': 'Relationships',
        'properties': {
            'profiles': {
                'type': 'object',
                'title': 'Relationships.Profiles',
                'properties': {
                    'links': {
                        'type': 'object',
                        'properties': {
                            'self': { 'type': 'string', 'title': 'Relationships.Profiles.Self' },
                            'related': { 'type': 'string', 'title': 'Relationships.Profiles.Related' }
                        }
                    }
                }
            },
            'tags': {
                'type': 'object',
                'title': 'Relationships.Tags',
                'properties': {
                    'data': {
                        'type': 'array',
                        'title': 'Relationships.Tags.Data',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'type': { 'type': 'string', 'title': 'Type' },
                                'id': { 'type': 'string', 'title': 'Tag ID' }
                            }
                        }
                    },
                    'links': {
                        'type': 'object',
                        'properties': {
                            'self': { 'type': 'string', 'title': 'Relationships.Tags.Self' },
                            'related': { 'type': 'string', 'title': 'Relationships.Tags.Related' }
                        }
                    }
                }
            },
            'flow-triggers': {
                'type': 'object',
                'title': 'Relationships.Flow Triggers',
                'properties': {
                    'data': {
                        'type': 'array',
                        'title': 'Relationships.Flow Triggers.Data',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'type': { 'type': 'string', 'title': 'Type' },
                                'id': { 'type': 'string', 'title': 'Flow Trigger ID' }
                            }
                        }
                    },
                    'links': {
                        'type': 'object',
                        'properties': {
                            'self': { 'type': 'string', 'title': 'Relationships.Flow Triggers.Self' },
                            'related': { 'type': 'string', 'title': 'Relationships.Flow Triggers.Related' }
                        }
                    }
                }
            }
        }
    }
};
