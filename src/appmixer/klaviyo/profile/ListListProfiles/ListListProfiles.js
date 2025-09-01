'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        const { listId, outputType } = context.messages.in.content;
        const { generateOutputPortOptions } = context.properties;

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Profiles' });
        }

        if (!listId) {
            throw new context.CancelError('List ID is required!');
        }

        // https://developers.klaviyo.com/en/reference/get_lists_for_profile
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://a.klaviyo.com/api/lists/${listId}/profiles`,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/json',
                'Revision': '2025-07-15'
            }
        });

        const profiles = data.data;

        return lib.sendArrayOutput({ context, outputType, records: profiles });
    }
};

const schema = {
    'type': { 'type': 'string', 'title': 'Type' },
    'id': { 'type': 'string', 'title': 'Profile ID' },
    'attributes': {
        'type': 'object',
        'title': 'Attributes',
        'properties': {
            'email': { 'type': 'string', 'title': 'Attributes.Email' },
            'phone_number': { 'type': 'string', 'title': 'Attributes.Phone Number' },
            'external_id': { 'type': 'string', 'title': 'Attributes.External ID' },
            'anonymous_id': { 'type': 'string', 'title': 'Attributes.Anonymous ID' },
            'first_name': { 'type': 'string', 'title': 'Attributes.First Name' },
            'last_name': { 'type': 'string', 'title': 'Attributes.Last Name' },
            'organization': { 'type': 'string', 'title': 'Attributes.Organization' },
            'locale': { 'type': 'string', 'title': 'Attributes.Locale' },
            'title': { 'type': 'string', 'title': 'Attributes.Title' },
            'image': { 'type': 'string', 'title': 'Attributes.Image' },
            'created': { 'type': 'string', 'title': 'Attributes.Created' },
            'updated': { 'type': 'string', 'title': 'Attributes.Updated' },
            'last_event_date': { 'type': 'string', 'title': 'Attributes.Last Event Date' },
            'location': {
                'type': 'object',
                'title': 'Attributes.Location',
                'properties': {
                    'address1': { 'type': 'string', 'title': 'Location.Address 1' },
                    'address2': { 'type': 'string', 'title': 'Location.Address 2' },
                    'city': { 'type': 'string', 'title': 'Location.City' },
                    'country': { 'type': 'string', 'title': 'Location.Country' },
                    'latitude': { 'type': 'number', 'title': 'Location.Latitude' },
                    'longitude': { 'type': 'number', 'title': 'Location.Longitude' },
                    'region': { 'type': 'string', 'title': 'Location.Region' },
                    'zip': { 'type': 'string', 'title': 'Location.ZIP' },
                    'timezone': { 'type': 'string', 'title': 'Location.Timezone' },
                    'ip': { 'type': 'string', 'title': 'Location.IP Address' }
                }
            },
            'properties': { 'type': 'object', 'title': 'Attributes.Properties' },
            'joined_group_at': { 'type': 'string', 'title': 'Attributes.Joined Group At' }
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
            'lists': {
                'type': 'object',
                'title': 'Relationships.Lists',
                'properties': {
                    'links': {
                        'type': 'object',
                        'title': 'Lists.Links',
                        'properties': {
                            'self': { 'type': 'string', 'title': 'Links.Self' },
                            'related': { 'type': 'string', 'title': 'Links.Related' }
                        }
                    }
                }
            },
            'segments': {
                'type': 'object',
                'title': 'Relationships.Segments',
                'properties': {
                    'links': {
                        'type': 'object',
                        'title': 'Segments.Links',
                        'properties': {
                            'self': { 'type': 'string', 'title': 'Links.Self' },
                            'related': { 'type': 'string', 'title': 'Links.Related' }
                        }
                    }
                }
            },
            'push-tokens': {
                'type': 'object',
                'title': 'Relationships.Push Tokens',
                'properties': {
                    'links': {
                        'type': 'object',
                        'title': 'Push Tokens.Links',
                        'properties': {
                            'self': { 'type': 'string', 'title': 'Links.Self' },
                            'related': { 'type': 'string', 'title': 'Links.Related' }
                        }
                    }
                }
            },
            'conversation': {
                'type': 'object',
                'title': 'Relationships.Conversation',
                'properties': {
                    'links': {
                        'type': 'object',
                        'title': 'Conversation.Links',
                        'properties': {
                            'self': { 'type': 'string', 'title': 'Links.Self' },
                            'related': { 'type': 'string', 'title': 'Links.Related' }
                        }
                    }
                }
            }
        }
    }
};
