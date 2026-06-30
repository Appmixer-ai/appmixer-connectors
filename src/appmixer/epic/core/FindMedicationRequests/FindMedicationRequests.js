'use strict';

const { runPatientSearch } = require('../../commons');

const schema = {
    'resourceType': { 'type': 'string', 'title': 'Resource Type' },
    'id': { 'type': 'string', 'title': 'Medication Request ID' },
    'status': { 'type': 'string', 'title': 'Status' },
    'intent': { 'type': 'string', 'title': 'Intent' },
    'medicationReference': { 'type': 'object', 'title': 'Medication Reference' },
    'medicationCodeableConcept': { 'type': 'object', 'title': 'Medication' },
    'subject': { 'type': 'object', 'title': 'Subject' },
    'authoredOn': { 'type': 'string', 'title': 'Authored On' },
    'requester': { 'type': 'object', 'title': 'Requester' },
    'dosageInstruction': { 'type': 'array', 'title': 'Dosage Instruction' }
};

module.exports = {
    async receive(context) {

        const { patient } = context.messages.in.content;

        if (!context.properties.generateOutputPortOptions && !patient) {
            throw new context.CancelError('Patient ID is required!');
        }

        return runPatientSearch(context, {
            resourceType: 'MedicationRequest',
            label: 'Medication Requests',
            schema
        });
    }
};
