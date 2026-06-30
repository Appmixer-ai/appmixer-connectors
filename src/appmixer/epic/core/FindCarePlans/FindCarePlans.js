'use strict';

const { runPatientSearch } = require('../../commons');

const schema = {
    'resourceType': { 'type': 'string', 'title': 'Resource Type' },
    'id': { 'type': 'string', 'title': 'Care Plan ID' },
    'status': { 'type': 'string', 'title': 'Status' },
    'intent': { 'type': 'string', 'title': 'Intent' },
    'category': { 'type': 'array', 'title': 'Category' },
    'title': { 'type': 'string', 'title': 'Title' },
    'description': { 'type': 'string', 'title': 'Description' },
    'subject': { 'type': 'object', 'title': 'Subject' },
    'period': { 'type': 'object', 'title': 'Period' }
};

module.exports = {
    async receive(context) {

        const { patient } = context.messages.in.content;

        if (!context.properties.generateOutputPortOptions && !patient) {
            throw new context.CancelError('Patient ID is required!');
        }

        return runPatientSearch(context, {
            resourceType: 'CarePlan',
            label: 'Care Plans',
            schema
        });
    }
};
