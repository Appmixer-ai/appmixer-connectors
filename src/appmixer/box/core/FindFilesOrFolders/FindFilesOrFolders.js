'use strict';

const lib = require('../../lib');

const schema = {
    'type': { 'type': 'string', 'title': 'Type' },
    'id': { 'type': 'string', 'title': 'Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'created_at': { 'type': 'string', 'title': 'Created At' },
    'modified_at': { 'type': 'string', 'title': 'Modified At' },
    'size': { 'type': 'integer', 'title': 'Size' },
    'description': { 'type': 'string', 'title': 'Description' },
    'path_collection': {
        'type': 'object',
        'properties': {
            'total_count': { 'type': 'integer', 'title': 'Path Collection.Total Count' },
            'entries': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'type': { 'type': 'string', 'title': 'Path Collection.Entries.Type' },
                        'id': { 'type': 'string', 'title': 'Path Collection.Entries.Id' },
                        'name': { 'type': 'string', 'title': 'Path Collection.Entries.Name' }
                    }
                },
                'title': 'Path Collection.Entries'
            }
        },
        'title': 'Path Collection'
    },
    'created_by': {
        'type': 'object',
        'properties': {
            'type': { 'type': 'string', 'title': 'Created By.Type' },
            'id': { 'type': 'string', 'title': 'Created By.Id' },
            'name': { 'type': 'string', 'title': 'Created By.Name' },
            'login': { 'type': 'string', 'title': 'Created By.Login' }
        },
        'title': 'Created By'
    },
    'modified_by': {
        'type': 'object',
        'properties': {
            'type': { 'type': 'string', 'title': 'Modified By.Type' },
            'id': { 'type': 'string', 'title': 'Modified By.Id' },
            'name': { 'type': 'string', 'title': 'Modified By.Name' },
            'login': { 'type': 'string', 'title': 'Modified By.Login' }
        },
        'title': 'Modified By'
    },
    'owned_by': {
        'type': 'object',
        'properties': {
            'type': { 'type': 'string', 'title': 'Owned By.Type' },
            'id': { 'type': 'string', 'title': 'Owned By.Id' },
            'name': { 'type': 'string', 'title': 'Owned By.Name' },
            'login': { 'type': 'string', 'title': 'Owned By.Login' }
        },
        'title': 'Owned By'
    },
    'shared_link': {
        'type': 'object',
        'properties': {
            'url': { 'type': 'string', 'title': 'Shared Link.Url' },
            'download_url': { 'type': 'string', 'title': 'Shared Link.Download Url' }
        },
        'title': 'Shared Link'
    }
};

module.exports = {

    async receive(context) {

        const {
            query,
            type,
            ancestorFolderIds,
            contentTypes,
            fields,
            outputType,
            exactMatch
        } = context.messages.in.content;

        if (!query) {
            throw new context.CancelError('Query is required!');
        }

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Entries' });
        }

        const params = {
            query
        };

        if (type) {
            params.type = type;
        }

        if (ancestorFolderIds) {
            params.ancestor_folder_ids = ancestorFolderIds;
        }

        if (contentTypes) {
            // Box API expects content_types as a comma-separated string, not an array
            const contentTypesArray = lib.normalizeMultiselectInput(contentTypes, context, 'Content Types');
            params.content_types = contentTypesArray.join(',');
        }

        if (fields) {
            params.fields = fields;
        }

        // https://developer.box.com/reference/get-search/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.box.com/2.0/search',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: {
                ...params,
                limit: 200
            }
        });

        let records = data.entries || [];

        // Apply client-side exact match filtering if enabled
        // Box Search API uses tokenized/fuzzy matching by default
        if (exactMatch) {
            records = records.filter(item => item.name === query);
        }

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
