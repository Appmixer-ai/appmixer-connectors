'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        const { channelFilter, filter, sort, outputType } = context.messages.in.content;
        const { generateOutputPortOptions } = context.properties;

        if (!channelFilter) {
            throw new context.CancelError('Channel Filter is required!');
        }

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Campaigns' });
        }

        const queryParams = {
            filter: `equals(messages.channel,'${channelFilter}')${filter?.length > 0 ? `,${filter}` : ''}`,
            sort,
            include: 'tags,campaign-messages'
        };

        // https://developers.klaviyo.com/en/reference/get_campaigns
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://a.klaviyo.com/api/campaigns',
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            params: queryParams
        });

        const campaigns = data.data;

        if (campaigns.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: campaigns, outputType });
    }
};

const schema = {
    'type': { 'type': 'string', 'title': 'Type' },
    'id': { 'type': 'string', 'title': 'Id' },
    'attributes': {
        'type': 'object',
        'title': 'Attributes',
        'properties': {
            'name': { 'type': 'string', 'title': 'Name' },
            'status': { 'type': 'string', 'title': 'Status' },
            'archived': { 'type': 'boolean', 'title': 'Archived' },
            'audiences': {
                'type': 'object',
                'title': 'Audiences',
                'properties': {
                    'included': {
                        'type': 'array',
                        'title': 'Included',
                        'items': { 'type': 'string', 'title': 'Included Item' }
                    },
                    'excluded': {
                        'type': 'array',
                        'title': 'Excluded',
                        'items': { 'type': 'string', 'title': 'Excluded Item' }
                    }
                }
            },
            'send_options': {
                'type': 'object',
                'title': 'Send Options',
                'properties': {
                    'use_smart_sending': { 'type': 'boolean', 'title': 'Use Smart Sending' }
                }
            },
            'tracking_options': {
                'type': 'object',
                'title': 'Tracking Options',
                'properties': {
                    'add_tracking_params': { 'type': 'boolean', 'title': 'Add Tracking Params' },
                    'custom_tracking_params': {
                        'type': 'array',
                        'title': 'Custom Tracking Params',
                        'items': {
                            'type': 'object',
                            'title': 'Custom Tracking Param',
                            'properties': {
                                'type': { 'type': 'string', 'title': 'Type' },
                                'value': { 'type': 'string', 'title': 'Value' },
                                'name': { 'type': 'string', 'title': 'Name' }
                            }
                        }
                    },
                    'is_tracking_clicks': { 'type': 'boolean', 'title': 'Is Tracking Clicks' },
                    'is_tracking_opens': { 'type': 'boolean', 'title': 'Is Tracking Opens' }
                }
            },
            'send_strategy': {
                'type': 'object',
                'title': 'Send Strategy',
                'properties': {
                    'method': { 'type': 'string', 'title': 'Method' },
                    'datetime': { 'type': 'string', 'title': 'Datetime' },
                    'options': {
                        'type': 'object',
                        'title': 'Options',
                        'properties': {
                            'send_past_recipients_immediately': { 'type': 'boolean', 'title': 'Send Past Recipients Immediately' }
                        }
                    }
                }
            },
            'created_at': { 'type': 'string', 'title': 'Created At' },
            'scheduled_at': { 'type': 'string', 'title': 'Scheduled At' },
            'updated_at': { 'type': 'string', 'title': 'Updated At' },
            'send_time': { 'type': 'string', 'title': 'Send Time' }
        }
    },
    'links': {
        'type': 'object',
        'title': 'Links',
        'properties': {
            'self': { 'type': 'string', 'title': 'Self' }
        }
    },
    'relationships': {
        'type': 'object',
        'title': 'Relationships',
        'properties': {
            'campaign-messages': {
                'type': 'object',
                'title': 'Campaign Messages',
                'properties': {
                    'data': {
                        'type': 'array',
                        'title': 'Data',
                        'items': {
                            'type': 'object',
                            'title': 'Campaign Message Data',
                            'properties': {
                                'type': { 'type': 'string', 'title': 'Type' },
                                'id': { 'type': 'string', 'title': 'Id' }
                            }
                        }
                    },
                    'links': {
                        'type': 'object',
                        'title': 'Links',
                        'properties': {
                            'self': { 'type': 'string', 'title': 'Self' },
                            'related': { 'type': 'string', 'title': 'Related' }
                        }
                    }
                }
            },
            'tags': {
                'type': 'object',
                'title': 'Tags',
                'properties': {
                    'data': {
                        'type': 'array',
                        'title': 'Data',
                        'items': {
                            'type': 'object',
                            'title': 'Tag Data',
                            'properties': {
                                'type': { 'type': 'string', 'title': 'Type' },
                                'id': { 'type': 'string', 'title': 'Id' }
                            }
                        }
                    },
                    'links': {
                        'type': 'object',
                        'title': 'Links',
                        'properties': {
                            'self': { 'type': 'string', 'title': 'Self' },
                            'related': { 'type': 'string', 'title': 'Related' }
                        }
                    }
                }
            }
        }
    }
};
