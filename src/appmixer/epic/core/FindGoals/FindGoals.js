'use strict';

const { runPatientSearch } = require('../../commons');

const schema = {
    'resourceType': { 'type': 'string', 'title': 'Resource Type' },
    'id': { 'type': 'string', 'title': 'Goal ID' },
    'lifecycleStatus': { 'type': 'string', 'title': 'Lifecycle Status' },
    'achievementStatus': { 'type': 'object', 'title': 'Achievement Status' },
    'description': { 'type': 'object', 'title': 'Description' },
    'subject': { 'type': 'object', 'title': 'Subject' },
    'target': { 'type': 'array', 'title': 'Target' },
    'startDate': { 'type': 'string', 'title': 'Start Date' }
};

module.exports = {
    async receive(context) {

        const { patient } = context.messages.in.content;

        if (!context.properties.generateOutputPortOptions && !patient) {
            throw new context.CancelError('Patient ID is required!');
        }

        return runPatientSearch(context, {
            resourceType: 'Goal',
            label: 'Goals',
            schema
        });
    }
};
