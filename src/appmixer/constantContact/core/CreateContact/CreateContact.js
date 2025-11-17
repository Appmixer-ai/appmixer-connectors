'use strict';

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
            email_addresses: [
                {
                    address: email_address,
                    permission_to_send: permission_to_send
                }
            ],
            create_source: create_source
        };

        // Add optional fields
        if (first_name) {
            requestBody.first_name = first_name;
        }

        if (last_name) {
            requestBody.last_name = last_name;
        }

        if (company_name) {
            requestBody.company_name = company_name;
        }

        if (job_title) {
            requestBody.job_title = job_title;
        }

        // Handle list_memberships - can be a string (JSON) or array
        if (list_memberships) {
            if (typeof list_memberships === 'string') {
                try {
                    requestBody.list_memberships = JSON.parse(list_memberships);
                } catch (e) {
                    requestBody.list_memberships = [list_memberships];
                }
            } else if (Array.isArray(list_memberships)) {
                requestBody.list_memberships = list_memberships;
            }
        }

        // Handle tags - can be a string (JSON) or array
        if (tags) {
            if (typeof tags === 'string') {
                try {
                    requestBody.tags = JSON.parse(tags);
                } catch (e) {
                    requestBody.tags = [tags];
                }
            } else if (Array.isArray(tags)) {
                requestBody.tags = tags;
            }
        }

        // https://v3.developer.constantcontact.com/api_reference/index.html#!/Contacts/createContact
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
