'use strict';

const lib = require('../../lib');

const schema = {
    'contactId': { 'type': 'string', 'title': 'Contact Id' },
    'href': { 'type': 'string', 'title': 'Href' },
    'name': { 'type': 'string', 'title': 'Name' },
    'email': { 'type': 'string', 'title': 'Email' },
    'note': { 'type': ['string', 'null'], 'title': 'Note' },
    'state': { 'type': 'string', 'title': 'State' },
    'dayOfCycle': { 'type': ['string', 'number'], 'title': 'Day Of Cycle' },
    'changedOn': { 'type': 'string', 'title': 'Changed On' },
    'timeZone': { 'type': 'string', 'title': 'Time Zone' },
    'campaign': { 'type': 'object', 'properties': { 'campaignId': { 'type': 'string', 'title': 'Campaign.Campaign Id' }, 'href': { 'type': 'string', 'title': 'Campaign.Href' }, 'name': { 'type': 'string', 'title': 'Campaign.Name' } }, 'title': 'Campaign' },
    'ipAddress': { 'type': 'string', 'title': 'Ip Address' },
    'activities': { 'type': 'string', 'title': 'Activities' },
    'createdOn': { 'type': 'string', 'title': 'Created On' },
    'origin': { 'type': 'string', 'title': 'Origin' },
    'scoring': { 'type': ['number', 'null'], 'title': 'Scoring' },
    'engagementScore': { 'type': 'number', 'title': 'Engagement Score' },
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

        // Set limit to maximum of 1000 per API documentation
        params.limit = 1000;

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

        // GetResponse API v3 returns contacts in _embedded.contacts array
        let contacts = [];
        const embedded = response.data && response.data['_embedded'];
        if (embedded && Array.isArray(embedded.contacts)) {
            contacts = embedded.contacts;
        } else if (Array.isArray(response.data)) {
            // Fallback for direct array response
            contacts = response.data;
        }

        if (contacts.length === 0 && outputType !== 'array') {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records: contacts, outputType });
    }
};
