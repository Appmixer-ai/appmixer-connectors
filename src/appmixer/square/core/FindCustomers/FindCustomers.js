'use strict';

const lib = require('../../lib.generated');
const schema = {
    id: {
        type: 'string',
        title: 'Customer Id'
    },
    created_at: {
        type: 'string',
        title: 'Created At'
    },
    updated_at: {
        type: 'string',
        title: 'Updated At'
    },
    given_name: {
        type: 'string',
        title: 'Given Name'
    },
    family_name: {
        type: 'string',
        title: 'Family Name'
    },
    email_address: {
        type: 'string',
        title: 'Email Address'
    },
    address: {
        type: 'object',
        properties: {
            address_line_1: {
                type: 'string',
                title: 'Address.Address Line 1'
            },
            address_line_2: {
                type: 'string',
                title: 'Address.Address Line 2'
            },
            locality: {
                type: 'string',
                title: 'Address.Locality'
            },
            administrative_district_level_1: {
                type: 'string',
                title: 'Address.Administrative District Level 1'
            },
            postal_code: {
                type: 'string',
                title: 'Address.Postal Code'
            },
            country: {
                type: 'string',
                title: 'Address.Country'
            }
        },
        title: 'Address'
    },
    phone_number: {
        type: 'string',
        title: 'Phone Number'
    },
    reference_id: {
        type: 'string',
        title: 'Reference Id'
    },
    preferences: {
        type: 'object',
        properties: {
            email_unsubscribed: {
                type: 'boolean',
                title: 'Preferences.Email Unsubscribed'
            }
        },
        title: 'Preferences'
    },
    creation_source: {
        type: 'string',
        title: 'Creation Source'
    },
    group_ids: {
        type: 'array',
        items: {
            type: 'string'
        },
        title: 'Group Ids'
    },
    segment_ids: {
        type: 'array',
        items: {
            type: 'string'
        },
        title: 'Segment Ids'
    },
    version: {
        type: 'number',
        title: 'Version'
    }
};

module.exports = {

    async receive(context) {

        const content = context.messages.in.content;
        const {
            query,
            emailAddress,
            phoneNumber,
            createdAtFrom,
            createdAtTo,
            updatedAtFrom,
            updatedAtTo,
            creationSource,
            groupIds,
            sortField,
            sortOrder,
            limit,
            outputType
        } = content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Customers' });
        }

        // Build the query filter object
        let filter = {};

        // Add text query filter if provided
        if (query && query.trim()) {
            filter.text = {
                fuzzy: query.trim()
            };
        }

        // Add email filter with fuzzy search if provided
        if (emailAddress && emailAddress.trim()) {
            filter.email_address = {
                fuzzy: emailAddress.trim()
            };
        }

        // Add phone number filter with fuzzy search if provided
        if (phoneNumber && phoneNumber.trim()) {
            filter.phone_number = {
                fuzzy: phoneNumber.trim()
            };
        }

        // Add date range filters if provided
        if (createdAtFrom || createdAtTo) {
            filter.created_at = {};
            if (createdAtFrom) {
                filter.created_at.start_at = createdAtFrom;
            }
            if (createdAtTo) {
                filter.created_at.end_at = createdAtTo;
            }
        }

        if (updatedAtFrom || updatedAtTo) {
            filter.updated_at = {};
            if (updatedAtFrom) {
                filter.updated_at.start_at = updatedAtFrom;
            }
            if (updatedAtTo) {
                filter.updated_at.end_at = updatedAtTo;
            }
        }

        // Add creation source filter if provided
        if (creationSource && creationSource.length > 0) {
            filter.creation_source = {
                values: Array.isArray(creationSource) ? creationSource : [creationSource],
                rule: 'INCLUDE'
            };
        }

        // Add group IDs filter if provided
        if (groupIds && groupIds.length > 0) {
            // Handle both string (comma-separated) and array inputs
            const groupIdsArray = typeof groupIds === 'string'
                ? groupIds.split(',').map(id => id.trim()).filter(id => id)
                : Array.isArray(groupIds) ? groupIds : [groupIds];

            if (groupIdsArray.length > 0) {
                filter.group_ids = {
                    all: groupIdsArray
                };
            }
        }

        // Build the query object
        let queryObject = {};

        // Add filter if any filters are present
        if (Object.keys(filter).length > 0) {
            queryObject.filter = filter;
        }

        // Add sort if specified
        if (sortField) {
            queryObject.sort = {
                field: sortField,
                order: sortOrder || 'ASC'
            };
        }

        // Build the search request body
        let searchBody = {};

        // Add query if any query parameters are present
        if (Object.keys(queryObject).length > 0) {
            searchBody.query = queryObject;
        }

        // Add limit if provided
        if (limit && limit > 0) {
            searchBody.limit = Math.min(limit, 100); // Square API limit is 100
        }

        // Use the customers search endpoint
        const environment = context.config.environment || 'production';
        const baseUrl = environment === 'production'
            ? 'https://connect.squareup.com'
            : 'https://connect.squareupsandbox.com';

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `${baseUrl}/v2/customers/search`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json',
                'Square-Version': '2025-08-20'
            },
            data: searchBody
        });

        let records = data.customers || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
