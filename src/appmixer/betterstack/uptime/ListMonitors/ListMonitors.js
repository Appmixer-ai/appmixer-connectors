'use strict';

const lib = require('../../lib');

const BASE_URL = 'https://uptime.betterstack.com/api/v2';

const SCHEMA = {
    id: { type: 'string', title: 'Monitor ID' },
    pronounceable_name: { type: 'string', title: 'Monitor Name' },
    url: { type: 'string', title: 'URL' },
    monitor_type: { type: 'string', title: 'Monitor Type' },
    status: { type: 'string', title: 'Status' },
    paused: { type: 'boolean', title: 'Paused' },
    check_frequency: { type: 'integer', title: 'Check Frequency (s)' },
    http_method: { type: 'string', title: 'HTTP Method' },
    required_keyword: { type: 'string', title: 'Required Keyword' },
    request_timeout: { type: 'integer', title: 'Request Timeout (s)' },
    recovery_period: { type: 'integer', title: 'Recovery Period (s)' },
    confirmation_period: { type: 'integer', title: 'Confirmation Period (s)' },
    verify_ssl: { type: 'boolean', title: 'Verify SSL' },
    follow_redirects: { type: 'boolean', title: 'Follow Redirects' },
    email: { type: 'boolean', title: 'Email Notifications' },
    sms: { type: 'boolean', title: 'SMS Notifications' },
    call: { type: 'boolean', title: 'Call Notifications' },
    push: { type: 'boolean', title: 'Push Notifications' },
    last_checked_at: { type: 'string', title: 'Last Checked At' },
    created_at: { type: 'string', title: 'Created At' },
    updated_at: { type: 'string', title: 'Updated At' }
};

module.exports = {
    async receive(context) {
        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Monitors', value: 'result' });
        }

        // Paginate through all monitors
        const monitors = [];
        let url = `${BASE_URL}/monitors`;

        while (url) {
            const { data } = await context.httpRequest({
                method: 'GET',
                url,
                headers: {
                    'Authorization': `Bearer ${context.auth.apiKey}`
                }
            });

            const page = (data.data || []).map((monitor) => ({ id: monitor.id, ...monitor.attributes }));
            monitors.push(...page);

            // Follow pagination link if available
            url = data.pagination && data.pagination.next ? data.pagination.next : null;
        }

        return lib.sendArrayOutput({ context, outputType, records: monitors });
    }
};
