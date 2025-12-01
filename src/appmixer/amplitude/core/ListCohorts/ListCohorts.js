'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Cohorts', value: 'cohorts' });
        }

        const isEU = context.auth.isEU === 'true';

        // https://amplitude.com/docs/apis/analytics/behavioral-cohorts#get-all-cohorts
        const credentials = `${context.auth.apiKey}:${context.auth.secretKey}`;
        const encoded = Buffer.from(credentials).toString('base64');

        const { data } = await context.httpRequest({
            method: 'GET',
            url: isEU ? 'https://analytics.eu.amplitude.com/api/3/cohorts' : 'https://amplitude.com/api/3/cohorts',
            headers: {
                'Authorization': `Basic ${encoded}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const { cohorts } = data || [];

        return lib.sendArrayOutput({ context, records: cohorts, outputType });
    }
};

const schema = {
    'id': { 'type': 'string', 'title': 'Cohort ID' },
    'appId': { 'type': 'string', 'title': 'Project ID (App ID)' },
    'archived': { 'type': 'boolean', 'title': 'Archived' },
    'definition': { 'type': 'object', 'title': 'Definition' },
    'description': { 'type': 'string', 'title': 'Description' },
    'finished': { 'type': 'boolean', 'title': 'Finished' },
    'name': { 'type': 'string', 'title': 'Name' },
    'published': { 'type': 'boolean', 'title': 'Published' },
    'type': { 'type': 'string', 'title': 'Type' },
    'lastMod': { 'type': 'number', 'title': 'Last Modified' },
    'createdAt': { 'type': 'number', 'title': 'Created At' },
    'lastComputed': { 'type': 'number', 'title': 'Last Computed' },
    'hidden': { 'type': 'boolean', 'title': 'Hidden' },
    'metadata': { 'type': 'object', 'title': 'Metadata' },
    'view_count': { 'type': 'number', 'title': 'View Count' },
    'popularity': { 'type': 'number', 'title': 'Popularity' },
    'last_viewed': { 'type': 'number', 'title': 'Last Viewed' },
    'chart_id': { 'type': 'string', 'title': 'Chart Id' },
    'edit_id': { 'type': 'string', 'title': 'Edit Id' },
    'is_predictive': { 'type': 'boolean', 'title': 'Is Predictive' },
    'include_data_app_types': { 'type': 'array', 'title': 'Include Data App Types' },
    'is_official_content': { 'type': 'boolean', 'title': 'Is Official Content' },
    'location_id': { 'type': 'string', 'title': 'Location Id' },
    'shortcut_ids': { 'type': 'array', 'title': 'Shortcut Ids' },
    'per_app_metadata': { 'type': 'object', 'title': 'Per App Metadata' },
    'cohort_definition_type': { 'type': 'string', 'title': 'Cohort Definition Type' },
    'cohort_output_type': { 'type': 'string', 'title': 'Cohort Output Type' },
    'is_generated_content': { 'type': 'boolean', 'title': 'Is Generated Content' },
    'owners': { 'type': 'array', 'title': 'Owners' },
    'viewers': { 'type': 'array', 'title': 'Viewers' },
    'size': { 'type': 'number', 'title': 'Size' }
};
