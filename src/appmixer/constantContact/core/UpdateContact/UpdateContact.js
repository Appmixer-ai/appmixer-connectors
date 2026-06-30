/* eslint-disable camelcase */

'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {
        const {
            contact_id,
            email_address,
            permission_to_send,
            first_name,
            last_name,
            company_name,
            job_title,
            list_memberships,
            tags,
            update_source
        } = context.messages.in.content;

        // Validate required fields
        if (!contact_id) {
            throw new context.CancelError('Contact ID is required!');
        }
        if (!update_source) {
            throw new context.CancelError('Update source is required!');
        }

        // Build the request body - NOTE: PUT overwrites all fields not included with null
        const requestBody = {
            update_source
        };

        // Handle email address - email is required if permission_to_send is provided
        if (email_address) {
            requestBody.email_address = {
                address: email_address
            };
            if (permission_to_send) {
                requestBody.email_address.permission_to_send = permission_to_send;
            }
        } else if (permission_to_send) {
            throw new context.CancelError('Email address is required when setting permission to send!');
        }

        // Add optional fields
        if (first_name) requestBody.first_name = first_name;
        if (last_name) requestBody.last_name = last_name;
        if (company_name) requestBody.company_name = company_name;
        if (job_title) requestBody.job_title = job_title;

        // Handle multiselect inputs
        if (list_memberships) {
            requestBody.list_memberships = lib.normalizeMultiselectInput(list_memberships, context, 'List Memberships');
        }
        if (tags) {
            requestBody.taggings = lib.normalizeMultiselectInput(tags, context, 'Tags');
        }
        const options = {
            method: 'PUT',
            url: `https://api.cc.email/v3/contacts/${contact_id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        };

        await context.httpRequest(options);

        return context.sendJson({}, 'out');
    }
};
