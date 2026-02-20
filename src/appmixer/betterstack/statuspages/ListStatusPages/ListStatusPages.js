'use strict';

const lib = require('../../lib');

// Schema describing status page attributes
const SCHEMA = {
    'id': { 'type': 'string', 'title': 'Status Page ID' },
    'company_name': { 'type': 'string', 'title': 'Company Name' },
    'company_url': { 'type': 'string', 'title': 'Company URL' },
    'contact_url': { 'type': 'string', 'title': 'Contact URL' },
    'logo_url': { 'type': 'string', 'title': 'Logo URL' },
    'timezone': { 'type': 'string', 'title': 'Timezone' },
    'subdomain': { 'type': 'string', 'title': 'Subdomain' },
    'custom_domain': { 'type': 'string', 'title': 'Custom Domain' },
    'custom_css': { 'type': 'string', 'title': 'Custom CSS' },
    'custom_javascript': { 'type': 'string', 'title': 'Custom JavaScript' },
    'google_analytics_id': { 'type': 'string', 'title': 'Google Analytics ID' },
    'min_incident_length': { 'type': 'integer', 'title': 'Min Incident Length' },
    'announcement': { 'type': 'string', 'title': 'Announcement' },
    'announcement_embed_visible': { 'type': 'boolean', 'title': 'Announcement Embed Visible' },
    'announcement_embed_css': { 'type': 'string', 'title': 'Announcement Embed CSS' },
    'announcement_embed_link': { 'type': 'string', 'title': 'Announcement Embed Link' },
    'automatic_reports': { 'type': 'boolean', 'title': 'Automatic Reports' },
    'status_page_group_id': { 'type': 'integer', 'title': 'Status Page Group ID' },
    'subscribable': { 'type': 'boolean', 'title': 'Subscribable' },
    'hide_from_search_engines': { 'type': 'boolean', 'title': 'Hide from Search Engines' },
    'password_enabled': { 'type': 'boolean', 'title': 'Password Enabled' },
    'history': { 'type': 'integer', 'title': 'History Days' },
    'aggregate_state': { 'type': 'string', 'title': 'Aggregate State' },
    'design': { 'type': 'string', 'title': 'Design' },
    'theme': { 'type': 'string', 'title': 'Theme' },
    'layout': { 'type': 'string', 'title': 'Layout' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'updated_at': { 'type': 'string', 'title': 'Updated At' }
};

module.exports = {

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Status Pages', value: 'result' });
        }

        let url = 'https://uptime.betterstack.com/api/v2/status-pages';
        let statusPages = [];

        // Paginate through all pages
        while (url) {
            const { data } = await context.httpRequest({
                method: 'GET',
                url: url,
                headers: {
                    'Authorization': `Bearer ${context.auth.apiKey}`
                }
            });

            // Add attributes to each status page with id
            if (data.data && Array.isArray(data.data)) {
                statusPages = statusPages.concat(
                    data.data.map(item => ({ ...item.attributes, id: item.id }))
                );
            }

            // Follow pagination
            url = data.pagination && data.pagination.next ? data.pagination.next : null;
        }

        return lib.sendArrayOutput({ context, records: statusPages, outputType });
    }
};
