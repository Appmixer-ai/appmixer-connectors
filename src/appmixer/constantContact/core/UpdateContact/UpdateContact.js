'use strict';

module.exports = {
    async receive(context) {
        const {
            contactId,
            email_address: emailAddress,
            permission_to_send: permissionToSend,
            first_name: firstName,
            last_name: lastName,
            company_name: companyName,
            job_title: jobTitle,
            list_memberships: listMemberships,
            tags,
            update_source: updateSource
        } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required!');
        }

        // Build request body with only provided fields
        const body = {};

        if (emailAddress || permissionToSend) {
            body.email_address = {
                address: emailAddress,
                permission_to_send: permissionToSend || 'implicit'
            };
        }

        if (firstName) {
            body.first_name = firstName;
        }

        if (lastName) {
            body.last_name = lastName;
        }

        if (companyName) {
            body.company_name = companyName;
        }

        if (jobTitle) {
            body.job_title = jobTitle;
        }

        if (listMemberships) {
            const memberships = typeof listMemberships === 'string'
                ? listMemberships.split('\n').filter(item => item.trim())
                : Array.isArray(listMemberships) ? listMemberships : [];
            if (memberships.length > 0) {
                body.list_memberships = memberships;
            }
        }

        if (tags) {
            const tagArray = typeof tags === 'string'
                ? tags.split('\n').filter(item => item.trim())
                : Array.isArray(tags) ? tags : [];
            if (tagArray.length > 0) {
                body.tags = tagArray;
            }
        }

        if (updateSource) {
            body.update_source = updateSource;
        }

        const { data } = await context.httpRequest({
            method: 'PUT',
            url: `https://api.cc.email/v3/contacts/${contactId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: body
        });

        return context.sendJson(data, 'out');
    }
};
