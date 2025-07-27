'use strict';

const lib = require('../../lib.generated');
const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'subject': { 'type': 'string', 'title': 'Subject' },
    'status': { 'type': 'string', 'title': 'Status' },
    'created_at': { 'type': 'string', 'title': 'Created At' }
};

module.exports = {

    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Campaigns' });
        }

        let url = 'https://a.klaviyo.com/api/campaigns/';
        const params = new URLSearchParams();

        // Klaviyo requires a channel filter for campaigns
        params.append('filter', 'equals(messages.channel,"email")');

        if (query) {
            // Add name filter along with the required channel filter
            params.append('filter', `contains(name,"${query}")`);
        }

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await context.httpRequest({
            method: 'GET',
            url: url,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            }
        });

        const campaigns = response.data.data.map(campaign => ({
            id: campaign.id,
            name: campaign.attributes.name,
            subject: campaign.attributes.subject,
            status: campaign.attributes.status,
            created_at: campaign.attributes.created_at
        }));

        return lib.sendArrayOutput({ context, records: campaigns, outputType });
    }
};
