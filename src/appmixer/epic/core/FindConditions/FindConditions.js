'use strict';

const { runPatientSearch } = require('../../commons');

const schema = {
    'resourceType': { 'type': 'string', 'title': 'Resource Type' },
    'id': { 'type': 'string', 'title': 'Condition ID' },
    'clinicalStatus': { 'type': 'object', 'title': 'Clinical Status' },
    'verificationStatus': { 'type': 'object', 'title': 'Verification Status' },
    'category': { 'type': 'array', 'title': 'Category' },
    'code': { 'type': 'object', 'title': 'Code' },
    'subject': { 'type': 'object', 'title': 'Subject' },
    'onsetDateTime': { 'type': 'string', 'title': 'Onset Date' },
    'recordedDate': { 'type': 'string', 'title': 'Recorded Date' }
};

module.exports = {
    async receive(context) {

        const { patient } = context.messages.in.content;

        if (!context.properties.generateOutputPortOptions && !patient) {
            throw new context.CancelError('Patient ID is required!');
        }

        return runPatientSearch(context, {
            resourceType: 'Condition',
            label: 'Conditions',
            schema
        });
    }
};
