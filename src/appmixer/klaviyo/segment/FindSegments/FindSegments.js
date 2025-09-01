'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        const { filter, sort, outputType } = context.messages.in.content;
        const { generateOutputPortOptions, isSource } = context.properties;

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Segments' });
        }

        const queryParams = {
            filter,
            include: 'flow-triggers,tags',
            sort
        };

        // https://developers.klaviyo.com/en/reference/get_segments
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://a.klaviyo.com/api/segments',
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            params: queryParams
        });

        const segments = data.data;

        if (isSource) {
            return context.sendJson({ result: segments }, 'out');
        }

        if (segments.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: segments, outputType });
    },

    toSelectArray({ result }) {

        return result.map(segment => {
            return { label: segment.attributes.name, value: segment.id };
        });
    }
};

const schema = {
    'type': { 'type': 'string', 'title': 'Type' },
    'id': { 'type': 'string', 'title': 'Segment ID' },
    'attributes': {
        'type': 'object',
        'title': 'Attributes',
        'properties': {
            'name': { 'type': 'string', 'title': 'Attributes.Name' },
            'definition': {
                'type': 'object',
                'title': 'Attributes.Definition',
                'properties': {
                    'condition_groups': {
                        'type': 'array',
                        'title': 'Attributes.Definition.Condition Groups',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'conditions': {
                                    'type': 'array',
                                    'title': 'Conditions',
                                    'items': {
                                        'type': 'object',
                                        'properties': {
                                            'type': { 'type': 'string', 'title': 'Type' },
                                            'is_member': { 'type': 'boolean', 'title': 'Is Member' },
                                            'group_ids': {
                                                'type': 'array',
                                                'title': 'Group IDs',
                                                'items': { 'type': 'string' }
                                            },
                                            'timeframe_filter': {
                                                'type': 'object',
                                                'title': 'Timeframe Filter',
                                                'properties': {
                                                    'type': { 'type': 'string', 'title': 'Type' },
                                                    'operator': { 'type': 'string', 'title': 'Operator' },
                                                    'unit': { 'type': 'string', 'title': 'Unit' },
                                                    'quantity': { 'type': 'number', 'title': 'Quantity' }
                                                }
                                            },
                                            'consent': {
                                                'type': 'object',
                                                'title': 'Consent',
                                                'properties': {
                                                    'channel': { 'type': 'string', 'title': 'Channel' },
                                                    'can_receive_marketing': { 'type': 'boolean', 'title': 'Can Receive Marketing' },
                                                    'consent_status': {
                                                        'type': 'object',
                                                        'title': 'Consent Status',
                                                        'properties': {
                                                            'subscription': { 'type': 'string', 'title': 'Subscription' },
                                                            'filters': { 'type': ['null', 'object'], 'title': 'Filters' }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            'created': { 'type': 'string', 'title': 'Attributes.Created' },
            'updated': { 'type': 'string', 'title': 'Attributes.Updated' },
            'is_active': { 'type': 'boolean', 'title': 'Attributes.Is Active' },
            'is_processing': { 'type': 'boolean', 'title': 'Attributes.Is Processing' },
            'is_starred': { 'type': 'boolean', 'title': 'Attributes.Is Starred' }
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
