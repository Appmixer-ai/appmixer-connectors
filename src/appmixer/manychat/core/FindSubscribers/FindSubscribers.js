'use strict';

const lib = require('../../lib');

// The output contract of ONE subscriber. Declared above module.exports (see ITEM_SCHEMA rules).
const ITEM_SCHEMA = {
    type: 'object',
    required: [
        'id'
    ],
    properties: {
        id: {
            type: 'string',
            title: 'Subscriber ID',
            example: '1234567890'
        },
        page_id: {
            type: 'string',
            title: 'Page ID',
            example: '106123456789012'
        },
        first_name: {
            type: 'string',
            title: 'First Name',
            example: 'Jane'
        },
        last_name: {
            type: 'string',
            title: 'Last Name',
            example: 'Doe'
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'Jane Doe'
        },
        gender: {
            type: 'string',
            title: 'Gender',
            example: 'female'
        },
        profile_pic: {
            type: 'string',
            title: 'Profile Picture',
            example: 'https://manychat.com/avatar/1234567890.jpg'
        },
        locale: {
            type: 'string',
            title: 'Locale',
            example: 'en_US'
        },
        language: {
            type: 'string',
            title: 'Language',
            example: 'English'
        },
        timezone: {
            type: 'string',
            title: 'Timezone',
            example: 'UTC+01'
        },
        live_chat_url: {
            type: 'string',
            title: 'Live Chat URL',
            example: 'https://app.manychat.com/fb106123456789012/chat/1234567890'
        },
        last_input_text: {
            type: 'string',
            title: 'Last Input Text',
            example: 'Hello'
        },
        optin_phone: {
            type: 'boolean',
            title: 'SMS Opt-in',
            example: false
        },
        phone: {
            type: 'string',
            title: 'Phone',
            example: '+15550100123'
        },
        optin_email: {
            type: 'boolean',
            title: 'Email Opt-in',
            example: true
        },
        email: {
            type: 'string',
            title: 'Email',
            example: 'jane.doe@example.com'
        },
        subscribed: {
            type: 'string',
            title: 'Subscribed',
            example: '2026-01-15T10:30:00+00:00'
        },
        last_interaction: {
            type: 'string',
            title: 'Last Interaction',
            example: '2026-01-16T08:12:00+00:00'
        },
        last_seen: {
            type: 'string',
            title: 'Last Seen',
            example: '2026-01-16T08:15:00+00:00'
        },
        is_followup_enabled: {
            type: 'boolean',
            title: 'Follow-up Enabled',
            example: true
        },
        ig_username: {
            type: 'string',
            title: 'Instagram Username',
            example: 'janedoe'
        },
        ig_id: {
            type: 'integer',
            title: 'Instagram ID',
            example: 6384638
        },
        whatsapp_phone: {
            type: 'string',
            title: 'WhatsApp Phone',
            example: '+15550100123'
        },
        optin_whatsapp: {
            type: 'boolean',
            title: 'WhatsApp Opt-in',
            example: false
        },
        custom_fields: {
            type: 'array',
            title: 'Custom Fields',
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'integer',
                        title: 'ID',
                        example: 11234
                    },
                    name: {
                        type: 'string',
                        title: 'Name',
                        example: 'Favorite Color'
                    },
                    type: {
                        type: 'string',
                        title: 'Type',
                        example: 'text'
                    },
                    description: {
                        type: 'string',
                        title: 'Description',
                        example: 'Color the subscriber picked'
                    },
                    value: {
                        type: 'string',
                        title: 'Value',
                        example: 'blue'
                    }
                }
            },
            example: [
                {
                    id: 11234,
                    name: 'Favorite Color',
                    type: 'text',
                    description: 'Color the subscriber picked',
                    value: 'blue'
                }
            ]
        },
        tags: {
            type: 'array',
            title: 'Tags',
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'integer',
                        title: 'ID',
                        example: 98765
                    },
                    name: {
                        type: 'string',
                        title: 'Name',
                        example: 'VIP'
                    }
                }
            },
            example: [
                {
                    id: 98765,
                    name: 'VIP'
                }
            ]
        }
    }
};

/**
 * Run the Manychat search that matches `searchBy` and return a list of subscribers.
 * Email and phone match one subscriber; Manychat answers with an empty `data` when nobody matches.
 * @param {object} context
 * @returns {Promise<object[]>}
 */
const search = async function(context) {

    const { searchBy, searchValue, fieldId } = context.messages.in.content;

    if (searchBy === 'name') {
        return await lib.request(context, { path: '/fb/subscriber/findByName', params: { name: searchValue } }) || [];
    }
    if (searchBy === 'email' || searchBy === 'phone') {
        const subscriber = await lib.request(context, {
            path: '/fb/subscriber/findBySystemField',
            params: { [searchBy]: searchValue }
        });
        return subscriber && subscriber.id ? [subscriber] : [];
    }
    if (searchBy === 'customField') {
        if (!fieldId) {
            throw new context.CancelError('Custom Field is required when Search By is Custom Field!');
        }
        return await lib.request(context, {
            path: '/fb/subscriber/findByCustomField',
            params: { field_id: lib.toApiId(context, fieldId, 'Custom Field'), field_value: searchValue }
        }) || [];
    }
    throw new context.CancelError(`Unsupported Search By value: ${searchBy}`);
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { searchBy, searchValue, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Subscribers' });
        }

        if (!searchBy) {
            throw new context.CancelError('Search By is required!');
        }
        if (searchValue === undefined || searchValue === null || searchValue === '') {
            throw new context.CancelError('Search Value is required!');
        }

        const records = await search(context);

        if (!Array.isArray(records) || records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
