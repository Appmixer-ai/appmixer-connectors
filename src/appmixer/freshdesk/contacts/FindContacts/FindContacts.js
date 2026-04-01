'use strict';

const axios = require('axios');

module.exports = {

    async receive(context) {

        const { auth } = context;
        const content = context.messages.in.content;

        const params = {};

        // Filter by a single email or phone (Freshdesk filter params)
        if (content.email) params.email = content.email;
        if (content.phone) params.phone = content.phone;
        if (content.mobilePhone) params.mobile_phone = content.mobilePhone;

        // If search query provided, use the search endpoint
        if (content.query) {
            const response = await axios.get(
                `https://${auth.domain}.freshdesk.com/api/v2/contacts/search`,
                {
                    params: { query: content.query },
                    auth: {
                        username: auth.apiKey,
                        password: 'X'
                    }
                }
            );
            const contacts = Array.isArray(response.data) ? response.data : (response.data.results || []);
            return context.sendJson({ contacts }, 'contacts');
        }

        // Otherwise use the list/filter endpoint
        if (content.updatedSince) params.updated_since = content.updatedSince;
        if (content.companyId) params.company_id = content.companyId;
        if (content.tag) params.tag = content.tag;

        // Pagination
        if (content.page) params.page = content.page;

        const response = await axios.get(
            `https://${auth.domain}.freshdesk.com/api/v2/contacts`,
            {
                params,
                auth: {
                    username: auth.apiKey,
                    password: 'X'
                }
            }
        );

        const contacts = response.data || [];
        return context.sendJson({ contacts }, 'contacts');
    }
};
