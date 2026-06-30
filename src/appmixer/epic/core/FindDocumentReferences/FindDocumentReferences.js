'use strict';

const { runPatientSearch } = require('../../commons');

const schema = {
    'resourceType': { 'type': 'string', 'title': 'Resource Type' },
    'id': { 'type': 'string', 'title': 'Document Reference ID' },
    'status': { 'type': 'string', 'title': 'Status' },
    'docStatus': { 'type': 'string', 'title': 'Doc Status' },
    'type': { 'type': 'object', 'title': 'Type' },
    'category': { 'type': 'array', 'title': 'Category' },
    'subject': { 'type': 'object', 'title': 'Subject' },
    'date': { 'type': 'string', 'title': 'Date' },
    'description': { 'type': 'string', 'title': 'Description' },
    'content': { 'type': 'array', 'title': 'Content' }
};

module.exports = {
    async receive(context) {

        const { patient } = context.messages.in.content;

        if (!context.properties.generateOutputPortOptions && !patient) {
            throw new context.CancelError('Patient ID is required!');
        }

        return runPatientSearch(context, {
            resourceType: 'DocumentReference',
            label: 'Documents',
            schema
        });
    }
};
