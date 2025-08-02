'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        const {
            filter,
            sort,
            outputType
        } = context.messages.in.content;
        const { generateOutputPortOptions, isSource } = context.properties;

        if (generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Profiles' });
        }

        const queryParams = {
            'page[size]': 100,
            filter,
            sort,
            'additional-fields[profile]': 'subscriptions,predictive_analytics'
        };

        // https://developers.klaviyo.com/en/reference/get_profiles
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://a.klaviyo.com/api/profiles',
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            params: queryParams
        });

        const profiles = data.data;

        if (isSource) {
            return context.sendJson({ result: profiles }, 'out');
        }

        if (!profiles || profiles.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: profiles });
    },

    toSelectArray({ result }) {

        return result.map(profile => {
            return { label: profile.attributes.email, value: profile.id };
        });
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
                    'latitude': { 'type': 'string', 'title': 'Location.Latitude' },
                    'longitude': { 'type': 'string', 'title': 'Location.Longitude' },
                    'region': { 'type': 'string', 'title': 'Location.Region' },
                    'zip': { 'type': 'string', 'title': 'Location.ZIP' },
                    'timezone': { 'type': 'string', 'title': 'Location.Timezone' },
                    'ip': { 'type': 'string', 'title': 'Location.IP Address' }
                }
            },
            'properties': { 'type': 'object', 'title': 'Attributes.Properties' },
            'subscriptions': {
                'type': 'object',
                'title': 'Attributes.Subscriptions',
                'properties': {
                    'email': {
                        'type': 'object',
                        'title': 'Subscriptions.Email Subscriptions',
                        'properties': {
                            'marketing': {
                                'type': 'object',
                                'title': 'Email Subscriptions.Email Marketing',
                                'properties': {
                                    'can_receive_email_marketing': { 'type': 'boolean', 'title': 'Email Marketing.Can Receive Email Marketing' },
                                    'consent': { 'type': 'string', 'title': 'Email Marketing.Consent' },
                                    'consent_timestamp': { 'type': 'string', 'title': 'Email Marketing.Consent Timestamp' },
                                    'last_updated': { 'type': 'string', 'title': 'Email Marketing.Last Updated' },
                                    'method': { 'type': 'string', 'title': 'Email Marketing.Method' },
                                    'method_detail': { 'type': 'string', 'title': 'Email Marketing.Method Detail' },
                                    'custom_method_detail': { 'type': 'string', 'title': 'Email Marketing.Custom Method Detail' },
                                    'double_optin': { 'type': 'boolean', 'title': 'Email Marketing.Double Opt-in' },
                                    'suppression': { 'type': 'array', 'title': 'Email Marketing.Suppression' },
                                    'list_suppressions': { 'type': 'array', 'title': 'Email Marketing.List Suppressions' }
                                }
                            }
                        }
                    },
                    'sms': {
                        'type': 'object',
                        'title': 'Subscriptions.SMS Subscriptions',
                        'properties': {
                            'marketing': {
                                'type': 'object',
                                'title': 'SMS Subscriptions.SMS Marketing',
                                'properties': {
                                    'can_receive_sms_marketing': { 'type': 'boolean', 'title': 'SMS Marketing.Can Receive SMS Marketing' },
                                    'consent': { 'type': 'string', 'title': 'SMS Marketing.Consent' },
                                    'consent_timestamp': { 'type': 'string', 'title': 'SMS Marketing.Consent Timestamp' },
                                    'method': { 'type': 'string', 'title': 'SMS Marketing.Method' },
                                    'method_detail': { 'type': 'string', 'title': 'SMS Marketing.Method Detail' },
                                    'last_updated': { 'type': 'string', 'title': 'SMS Marketing.Last Updated' }
                                }
                            },
                            'transactional': {
                                'type': 'object',
                                'title': 'SMS Subscriptions.SMS Transactional',
                                'properties': {
                                    'can_receive_sms_transactional': { 'type': 'boolean', 'title': 'SMS Transactional.Can Receive SMS Transactional' },
                                    'consent': { 'type': 'string', 'title': 'SMS Transactional.Consent' },
                                    'consent_timestamp': { 'type': 'string', 'title': 'SMS Transactional.Consent Timestamp' },
                                    'method': { 'type': 'string', 'title': 'SMS Transactional.Method' },
                                    'method_detail': { 'type': 'string', 'title': 'SMS Transactional.Method Detail' },
                                    'last_updated': { 'type': 'string', 'title': 'SMS Transactional.Last Updated' }
                                }
                            }
                        }
                    },
                    'mobile_push': {
                        'type': 'object',
                        'title': 'Subscriptions.Mobile Push Subscriptions',
                        'properties': {
                            'marketing': {
                                'type': 'object',
                                'title': 'Mobile Push Subscriptions.Mobile Push Marketing',
                                'properties': {
                                    'can_receive_push_marketing': { 'type': 'boolean', 'title': 'Mobile Push Marketing.Can Receive Push Marketing' },
                                    'consent': { 'type': 'string', 'title': 'Mobile Push Marketing.Consent' },
                                    'consent_timestamp': { 'type': 'string', 'title': 'Mobile Push Marketing.Consent Timestamp' }
                                }
                            }
                        }
                    }
                }
            },
            'predictive_analytics': {
                'type': 'object',
                'title': 'Attributes.Predictive Analytics',
                'properties': {
                    'historic_clv': { 'type': 'number', 'title': 'Predictive Analytics.Historic CLV' },
                    'predicted_clv': { 'type': 'number', 'title': 'Predictive Analytics.Predicted CLV' },
                    'total_clv': { 'type': 'number', 'title': 'Predictive Analytics.Total CLV' },
                    'historic_number_of_orders': { 'type': 'number', 'title': 'Predictive Analytics.Historic Number of Orders' },
                    'predicted_number_of_orders': { 'type': 'number', 'title': 'Predictive Analytics.Predicted Number of Orders' },
                    'average_days_between_orders': { 'type': 'number', 'title': 'Predictive Analytics.Average Days Between Orders' },
                    'average_order_value': { 'type': 'number', 'title': 'Predictive Analytics.Average Order Value' },
                    'churn_probability': { 'type': 'number', 'title': 'Predictive Analytics.Churn Probability' },
                    'expected_date_of_next_order': { 'type': 'string', 'title': 'Predictive Analytics.Expected Date of Next Order' }
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
                    'data': { 'type': 'array', 'title': 'Push Tokens.Data' },
                    'links': {
                        'type': 'object',
                        'title': 'Push Tokens.Links',
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
