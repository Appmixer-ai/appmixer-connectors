'use strict';

const { runPatientSearch } = require('../../commons');

const schema = {
    'resourceType': { 'type': 'string', 'title': 'Resource Type' },
    'id': { 'type': 'string', 'title': 'Observation ID' },
    'status': { 'type': 'string', 'title': 'Status' },
    'category': { 'type': 'array', 'title': 'Category' },
    'code': { 'type': 'object', 'title': 'Code' },
    'subject': { 'type': 'object', 'title': 'Subject' },
    'effectiveDateTime': { 'type': 'string', 'title': 'Effective Date' },
    'valueQuantity': { 'type': 'object', 'title': 'Value Quantity' },
    'component': { 'type': 'array', 'title': 'Components' }
};

module.exports = {
    async receive(context) {

        const { patient } = context.messages.in.content;

        if (!context.properties.generateOutputPortOptions && !patient) {
            throw new context.CancelError('Patient ID is required!');
        }

        return runPatientSearch(context, {
            resourceType: 'Observation',
            label: 'Vital Signs',
            schema,
            extraParams: { category: 'vital-signs' }
        });
    }
};
