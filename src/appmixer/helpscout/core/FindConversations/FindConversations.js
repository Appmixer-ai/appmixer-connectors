
'use strict';

const lib = require('../../lib.generated');
const schema = {
    id: {
        type: 'number',
        title: 'Conversation ID'
    },
    number: {
        type: 'number',
        title: 'Number'
    },
    threads: {
        type: 'number',
        title: 'Threads'
    },
    type: {
        type: 'string',
        title: 'Type'
    },
    folderId: {
        type: 'number',
        title: 'Folder ID'
    },
    status: {
        type: 'string',
        title: 'Status'
    },
    state: {
        type: 'string',
        title: 'State'
    },
    subject: {
        type: 'string',
        title: 'Subject'
    },
    preview: {
        type: 'string',
        title: 'Preview'
    },
    mailboxId: {
        type: 'number',
        title: 'Mailbox ID'
    },
    assignee: {
        type: 'object',
        properties: {
            id: {
                type: 'number',
                title: 'Assignee.ID'
            },
            type: {
                type: 'string',
                title: 'Assignee.Type'
            },
            first: {
                type: 'string',
                title: 'Assignee.First'
            },
            last: {
                type: 'string',
                title: 'Assignee.Last'
            },
            email: {
                type: 'string',
                title: 'Assignee.Email'
            }
        },
        title: 'Assignee'
    },
    createdBy: {
        type: 'object',
        properties: {
            id: {
                type: 'number',
                title: 'Created By.ID'
            },
            type: {
                type: 'string',
                title: 'Created By.Type'
            },
            email: {
                type: 'string',
                title: 'Created By.Email'
            }
        },
        title: 'Created By'
    },
    createdAt: {
        type: 'string',
        title: 'Created At'
    },
    closedBy: {
        type: 'number',
        title: 'Closed By'
    },
    closedByUser: {
        type: 'object',
        properties: {
            id: {
                type: 'number',
                title: 'Closed By User.ID'
            },
            type: {
                type: 'string',
                title: 'Closed By User.Type'
            },
            first: {
                type: 'string',
                title: 'Closed By User.First'
            },
            last: {
                type: 'string',
                title: 'Closed By User.Last'
            },
            photoUrl: {
                type: 'string',
                title: 'Closed By User.Photo Url'
            },
            email: {
                type: 'string',
                title: 'Closed By User.Email'
            }
        },
        title: 'Closed By User'
    },
    closedAt: {
        type: 'string',
        title: 'Closed At'
    },
    userUpdatedAt: {
        type: 'string',
        title: 'User Updated At'
    },
    customerWaitingSince: {
        type: 'object',
        properties: {
            time: {
                type: 'string',
                title: 'Customer Waiting Since.Time'
            },
            friendly: {
                type: 'string',
                title: 'Customer Waiting Since.Friendly'
            }
        },
        title: 'Customer Waiting Since'
    },
    source: {
        type: 'object',
        properties: {
            type: {
                type: 'string',
                title: 'Source.Type'
            },
            via: {
                type: 'string',
                title: 'Source.Via'
            }
        },
        title: 'Source'
    },
    tags: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: {
                    type: 'number',
                    title: 'Tags.ID'
                },
                color: {
                    type: 'string',
                    title: 'Tags.Color'
                },
                tag: {
                    type: 'string',
                    title: 'Tags.Tag'
                }
            }
        },
        title: 'Tags'
    },
    cc: {
        type: 'array',
        items: {
            type: 'string'
        },
        title: 'Cc'
    },
    bcc: {
        type: 'array',
        items: {
            type: 'string'
        },
        title: 'Bcc'
    },
    primaryCustomer: {
        type: 'object',
        properties: {
            id: {
                type: 'number',
                title: 'Primary Customer.ID'
            },
            type: {
                type: 'string',
                title: 'Primary Customer.Type'
            },
            first: {
                type: 'string',
                title: 'Primary Customer.First'
            },
            last: {
                type: 'string',
                title: 'Primary Customer.Last'
            },
            email: {
                type: 'string',
                title: 'Primary Customer.Email'
            }
        },
        title: 'Primary Customer'
    },
    snooze: {
        type: 'object',
        properties: {
            snoozedBy: {
                type: 'number',
                title: 'Snooze.Snoozed By'
            },
            snoozedUntil: {
                type: 'string',
                title: 'Snooze.Snoozed Until'
            },
            unsnoozeOnCustomerReply: {
                type: 'boolean',
                title: 'Snooze.Unsnooze On Customer Reply'
            }
        },
        title: 'Snooze'
    },
    nextEvent: {
        type: 'object',
        properties: {
            time: {
                type: 'string',
                title: 'Next Event.Time'
            },
            eventType: {
                type: 'string',
                title: 'Next Event.Event Type'
            },
            userId: {
                type: 'number',
                title: 'Next Event.User ID'
            },
            cancelOnCustomerReply: {
                type: 'boolean',
                title: 'Next Event.Cancel On Customer Reply'
            }
        },
        title: 'Next Event'
    },
    customFields: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: {
                    type: 'number',
                    title: 'Custom Fields.ID'
                },
                name: {
                    type: 'string',
                    title: 'Custom Fields.Name'
                },
                value: {
                    type: 'string',
                    title: 'Custom Fields.Value'
                },
                text: {
                    type: 'string',
                    title: 'Custom Fields.Text'
                }
            },
            required: [
                'id',
                'name',
                'value',
                'text'
            ]
        },
        title: 'Custom Fields'
    },
    _embedded: {
        type: 'object',
        properties: {
            threads: {
                type: 'array',
                items: {},
                title: 'Embedded.Threads'
            }
        },
        title: 'Embedded'
    },
    _links: {
        type: 'object',
        properties: {
            self: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Self.Href'
                    }
                },
                title: 'Links.Self'
            },
            mailbox: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Mailbox.Href'
                    }
                },
                title: 'Links.Mailbox'
            },
            primaryCustomer: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Primary Customer.Href'
                    }
                },
                title: 'Links.Primary Customer'
            },
            createdByCustomer: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Created By Customer.Href'
                    }
                },
                title: 'Links.Created By Customer'
            },
            closedBy: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Closed By.Href'
                    }
                },
                title: 'Links.Closed By'
            },
            threads: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Threads.Href'
                    }
                },
                title: 'Links.Threads'
            },
            assignee: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Assignee.Href'
                    }
                },
                title: 'Links.Assignee'
            },
            web: {
                type: 'object',
                properties: {
                    href: {
                        type: 'string',
                        title: 'Links.Web.Href'
                    }
                },
                title: 'Links.Web'
            }
        },
        title: 'Links'
    }
};

module.exports = {
    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Conversations' });
        }

        if (!query) {
            throw new context.CancelError('Search query is required.');
        }

        // Build query parameters — the component UI exposes only `query` and `outputType`.
        // We no longer accept page/pageSize/sortBy/sortOrder as inputs.
        const params = {};
        if (query) params.query = query;

        // Ensure results are always sorted by most recently modified first.
        // These are enforced regardless of any incoming parameters.
        params.sortField = 'modifiedAt';
        params.sortOrder = 'desc';
        params.embed = 'threads';
        // Use conversations endpoint with search functionality
        // https://developer.helpscout.com/mailbox-api/endpoints/conversations/list/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.helpscout.net/v2/conversations',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params
        });

        const records = data['_embedded']?.conversations || [];

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return await lib.sendArrayOutput({ context, records, outputType });
    }
};
