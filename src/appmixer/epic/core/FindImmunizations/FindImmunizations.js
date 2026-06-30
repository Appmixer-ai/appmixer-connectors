'use strict';

const { runPatientSearch } = require('../../commons');

const schema = {
    'resourceType': { 'type': 'string', 'title': 'Resource Type' },
    'id': { 'type': 'string', 'title': 'Immunization ID' },
    'status': { 'type': 'string', 'title': 'Status' },
    'vaccineCode': { 'type': 'object', 'title': 'Vaccine Code' },
    'patient': { 'type': 'object', 'title': 'Patient' },
    'occurrenceDateTime': { 'type': 'string', 'title': 'Occurrence Date' },
    'lotNumber': { 'type': 'string', 'title': 'Lot Number' },
    'site': { 'type': 'object', 'title': 'Site' },
    'route': { 'type': 'object', 'title': 'Route' }
};

module.exports = {
    async receive(context) {

        const { patient } = context.messages.in.content;

        if (!context.properties.generateOutputPortOptions && !patient) {
            throw new context.CancelError('Patient ID is required!');
        }

        return runPatientSearch(context, {
            resourceType: 'Immunization',
            label: 'Immunizations',
            schema
        });
    }
};
