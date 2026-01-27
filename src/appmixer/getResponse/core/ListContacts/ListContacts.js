'use strict';

const lib = require('../../lib');

const schema = {
    'contactId': { 'type': 'string', 'title': 'Contact Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'email': { 'type': 'string', 'title': 'Email' },
    'state': { 'type': 'string', 'title': 'State' },
    'dayOfCycle': { 'type': 'number', 'title': 'Day Of Cycle' },
    'campaign': { 'type': 'object', 'properties': { 'campaignId': { 'type': 'string', 'title': 'Campaign.Campaign Id' } }, 'title': 'Campaign' },
    'ipAddress': { 'type': 'string', 'title': 'Ip Address' },
    'createdOn': { 'type': 'string', 'title': 'Created On' },
    'origin': { 'type': 'string', 'title': 'Origin' },
    'scoring': { 'type': 'number', 'title': 'Scoring' },
    'customFieldValues': { 'type': 'array', 'items': { 'type': 'object', 'properties': { 'customFieldId': { 'type': 'string', 'title': 'Custom Field Values.Custom Field Id' }, 'value': { 'type': 'array', 'items': { 'type': 'string' }, 'title': 'Custom Field Values.Value' } } }, 'title': 'Custom Field Values' },
    'tags': { 'type': 'array', 'items': { 'type': 'object', 'properties': { 'tagId': { 'type': 'string', 'title': 'Tags.Tag Id' }, 'name': { 'type': 'string', 'title': 'Tags.Name' } } }, 'title': 'Tags' }
};

module.exports = {
    async receive(context) {

        const {
            email,
            name,
            campaignId,
            state,
            createdOnFrom,
            createdOnTo,
            sortBy,
            sortOrder,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Contacts', value: 'contacts' });
        }

        // Build query parameters
        const params = {};

        if (email) {
            params['query[email]'] = email;
        }
        if (name) {
            params['query[name]'] = name;
        }
        if (campaignId) {
            params['query[campaignId]'] = campaignId;
        }
        if (state) {
            params['query[state]'] = state;
        }
        if (createdOnFrom) {
            params['query[createdOn][from]'] = createdOnFrom;
        }
        if (createdOnTo) {
            params['query[createdOn][to]'] = createdOnTo;
        }
        if (sortBy) {
            params['sort[' + sortBy + ']'] = sortOrder || 'asc';
        }

        // Retrieve contacts from getResponse API
        // https://apireference.getresponse.com/#contacts
        const response = await context.httpRequest({
            method: 'GET',
            url: 'https://api.getresponse.com/v3/contacts',
            headers: {
                'X-Auth-Token': `api-key ${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            params
        });

        // GetResponse API returns contacts directly as an array
        const contacts = Array.isArray(response.data) ? response.data : [];

        if (contacts.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: contacts, outputType });
    }
};
