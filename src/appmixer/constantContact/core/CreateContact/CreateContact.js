/* eslint-disable camelcase */

'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {
        const {
            email_address,
            permission_to_send,
            first_name,
            last_name,
            company_name,
            job_title,
            list_memberships,
            tags,
            create_source
        } = context.messages.in.content;

        // Validate required fields
        if (!email_address) {
            throw new context.CancelError('Email address is required!');
        }
        if (!permission_to_send) {
            throw new context.CancelError('Permission to send is required!');
        }
        if (!create_source) {
            throw new context.CancelError('Create source is required!');
        }

        // Build the request body
        const requestBody = {
            email_address: {
                address: email_address,
                permission_to_send: permission_to_send
            },
            create_source
        };

        // Add optional fields
        if (first_name) requestBody.first_name = first_name;
        if (last_name) requestBody.last_name = last_name;
        if (company_name) requestBody.company_name = company_name;
        if (job_title) requestBody.job_title = job_title;
        if (list_memberships) {
            requestBody.list_memberships = lib.normalizeMultiselectInput(list_memberships, context, 'List Memberships');
        }
        if (tags) {
            requestBody.taggings = lib.normalizeMultiselectInput(tags, context, 'Tags');
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.cc.email/v3/contacts',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
