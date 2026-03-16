'use strict';

const lib = require('../lib');
const ZohoClient = require('../../ZohoClient');

const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'api_name': { 'type': 'string', 'title': 'Api Name' },
    'display_name': { 'type': 'string', 'title': 'Display Name' },
    'singular_label': { 'type': 'string', 'title': 'Singular Label' },
    'plural_label': { 'type': 'string', 'title': 'Plural Label' },
    'description': { 'type': 'string', 'title': 'Description' },
    'created_time': { 'type': 'string', 'title': 'Created Time' },
    'modified_time': { 'type': 'string', 'title': 'Modified Time' },
    'created_by': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'string', 'title': 'Created By.Id' },
            'name': { 'type': 'string', 'title': 'Created By.Name' }
        },
        'title': 'Created By'
    },
    'modified_by': {
        'type': 'object',
        'properties': {
            'id': { 'type': 'string', 'title': 'Modified By.Id' },
            'name': { 'type': 'string', 'title': 'Modified By.Name' }
        },
        'title': 'Modified By'
    },
    'visibility': { 'type': 'boolean', 'title': 'Visibility' },
    'enable_record_duplicate_check': { 'type': 'boolean', 'title': 'Enable Record Duplicate Check' },
    'enable_shareable_link': { 'type': 'boolean', 'title': 'Enable Shareable Link' },
    'enable_kanban_view': { 'type': 'boolean', 'title': 'Enable Kanban View' },
    'enable_quick_entry': { 'type': 'boolean', 'title': 'Enable Quick Entry' }
};

module.exports = {

    async receive(context) {

        const { searchQuery, sortBy, sortOrder, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'CustomModules', value: 'custom_modules' });
        }

        const zc = new ZohoClient(context, context.profileInfo?.region);

        // https://www.zoho.com/crm/developer/docs/api/v3/custom-modules.html
        const response = await zc.request('GET', '/crm/v8/settings/modules', {
            // params: {
            //     fields: Object.keys(schema).join(',')
            // }
        });


        let records = response.modules || [];


        // Filter by search query if provided
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            records = records.filter(module =>
                module.api_name?.toLowerCase().includes(query) ||
                module.display_name?.toLowerCase().includes(query)
            );
        }

        // Sort records
        if (sortBy && records.length > 0) {
            records.sort((a, b) => {
                const aVal = a[sortBy];
                const bVal = b[sortBy];

                if (aVal === undefined || aVal === null) return 1;
                if (bVal === undefined || bVal === null) return -1;

                let comparison = 0;
                if (typeof aVal === 'string') {
                    comparison = aVal.localeCompare(bVal);
                } else {
                    comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                }

                return sortOrder === 'asc' ? comparison : -comparison;
            });
        }

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
