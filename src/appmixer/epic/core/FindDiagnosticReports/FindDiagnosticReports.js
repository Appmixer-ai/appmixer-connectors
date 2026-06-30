'use strict';

const { runPatientSearch } = require('../../commons');

const schema = {
    'resourceType': { 'type': 'string', 'title': 'Resource Type' },
    'id': { 'type': 'string', 'title': 'Diagnostic Report ID' },
    'status': { 'type': 'string', 'title': 'Status' },
    'category': { 'type': 'array', 'title': 'Category' },
    'code': { 'type': 'object', 'title': 'Code' },
    'subject': { 'type': 'object', 'title': 'Subject' },
    'effectiveDateTime': { 'type': 'string', 'title': 'Effective Date' },
    'issued': { 'type': 'string', 'title': 'Issued' },
    'result': { 'type': 'array', 'title': 'Result' },
    'conclusion': { 'type': 'string', 'title': 'Conclusion' },
    'presentedForm': { 'type': 'array', 'title': 'Presented Form' }
};

module.exports = {
    async receive(context) {

        const { patient } = context.messages.in.content;

        if (!context.properties.generateOutputPortOptions && !patient) {
            throw new context.CancelError('Patient ID is required!');
        }

        return runPatientSearch(context, {
            resourceType: 'DiagnosticReport',
            label: 'Diagnostic Reports',
            schema
        });
    }
};
