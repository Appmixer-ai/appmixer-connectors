
'use strict';

const lib = require('../../lib.generated');
const schema = {
    id: {
        type: 'number',
        title: 'Customer ID'
    },
    firstName: {
        type: 'string',
        title: 'First Name'
    },
    lastName: {
        type: 'string',
        title: 'Last Name'
    },
    gender: {
        type: 'string',
        title: 'Gender'
    },
    jobTitle: {
        type: 'string',
        title: 'Job Title'
    },
    location: {
        type: 'string',
        title: 'Location'
    },
    organizationId: {
        type: 'number',
        title: 'Organization ID'
    },
    photoType: {
        type: 'string',
        title: 'Photo Type'
    },
    photoUrl: {
        type: 'string',
        title: 'Photo Url'
    },
    age: {
        type: 'string',
        title: 'Age'
    },
    createdAt: {
        type: 'string',
        title: 'Created At'
    },
    updatedAt: {
        type: 'string',
        title: 'Updated At'
    },
    background: {
        type: 'string',
        title: 'Background'
    },
    draft: {
        type: 'boolean',
        title: 'Draft'
    },
    _embedded: {
        type: 'object',
        properties: {
            emails: {
                type: 'array',
                items: {},
                title: 'Embedded.Emails'
            },
            phones: {
                type: 'array',
                items: {},
                title: 'Embedded.Phones'
            },
            chats: {
                type: 'array',
                items: {},
                title: 'Embedded.Chats'
            },
            social_profiles: {
                type: 'array',
                items: {},
                title: 'Embedded.Social Profiles'
            },
            websites: {
                type: 'array',
                items: {},
                title: 'Embedded.Websites'
            },
            properties: {
                type: 'array',
                items: {},
                title: 'Embedded.Properties'
            }
        },
        title: 'Embedded'
    },
    _links: {
        type: 'object',
        properties: {
            address: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Address.Href'
                    }
                },
                title: 'Links.Address'
            },
            chats: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Chats.Href'
                    }
                },
                title: 'Links.Chats'
            },
            emails: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Emails.Href'
                    }
                },
                title: 'Links.Emails'
            },
            phones: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Phones.Href'
                    }
                },
                title: 'Links.Phones'
            },
            'social-profiles': {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Social-Profiles.Href'
                    }
                },
                title: 'Links.Social-Profiles'
            },
            websites: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Websites.Href'
                    }
                },
                title: 'Links.Websites'
            },
            organization: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Organization.Href'
                    }
                },
                title: 'Links.Organization'
            },
            self: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Self.Href'
                    }
                },
                title: 'Links.Self'
            }
        },
        title: 'Links'
    }
};

module.exports = {
    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Customers', value: 'customers' });
        }

        // Build query parameters
        const params = {};
        if (query) params.query = query;

        // Ensure results are always sorted by most recently modified first.
        // These are enforced regardless of any incoming parameters.
        params.sortField = 'modifiedAt';
        params.sortOrder = 'desc';

        // https://developer.helpscout.com/mailbox-api/endpoints/customers/list/
        const options = {
            method: 'GET',
            url: 'https://api.helpscout.net/v2/customers',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params
        };

        const { data } = await context.httpRequest(options);

        const records = data['_embedded']?.customers || [];

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
