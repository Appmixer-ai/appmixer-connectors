'use strict';

const axios = require('axios');

module.exports = {

    async receive(context) {

        const { auth } = context;
        const { contactId } = context.messages.in.content;

        const response = await axios.get(
            `https://${auth.domain}.freshdesk.com/api/v2/contacts/${contactId}`,
            {
                auth: {
                    username: auth.apiKey,
                    password: 'X'
                }
            }
        );

        const data = response.data;

        if (!data || !data.id) {
            return context.sendJson({ contactId }, 'notFound');
        }

        return context.sendJson({
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            mobile: data.mobile,
            twitterId: data.twitter_id,
            uniqueExternalId: data.unique_external_id,
            companyId: data.company_id,
            viewAllTickets: data.view_all_tickets,
            jobTitle: data.job_title,
            description: data.description,
            address: data.address,
            tags: data.tags,
            active: data.active,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        }, 'contact');
    }
};
