'use strict';

const { runPatientSearch } = require('../../commons');

const schema = {
    'resourceType': { 'type': 'string', 'title': 'Resource Type' },
    'id': { 'type': 'string', 'title': 'Procedure ID' },
    'status': { 'type': 'string', 'title': 'Status' },
    'code': { 'type': 'object', 'title': 'Code' },
    'subject': { 'type': 'object', 'title': 'Subject' },
    'performedDateTime': { 'type': 'string', 'title': 'Performed Date' },
    'performedPeriod': { 'type': 'object', 'title': 'Performed Period' },
    'category': { 'type': 'object', 'title': 'Category' },
    'reasonCode': { 'type': 'array', 'title': 'Reason Code' }
};

module.exports = {
    async receive(context) {

        const { patient } = context.messages.in.content;

        if (!context.properties.generateOutputPortOptions && !patient) {
            throw new context.CancelError('Patient ID is required!');
        }

        return runPatientSearch(context, {
            resourceType: 'Procedure',
            label: 'Procedures',
            schema
        });
    }
};
