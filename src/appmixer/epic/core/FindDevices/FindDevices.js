'use strict';

const { runPatientSearch } = require('../../commons');

const schema = {
    'resourceType': { 'type': 'string', 'title': 'Resource Type' },
    'id': { 'type': 'string', 'title': 'Device ID' },
    'status': { 'type': 'string', 'title': 'Status' },
    'type': { 'type': 'object', 'title': 'Type' },
    'manufacturer': { 'type': 'string', 'title': 'Manufacturer' },
    'modelNumber': { 'type': 'string', 'title': 'Model Number' },
    'serialNumber': { 'type': 'string', 'title': 'Serial Number' },
    'patient': { 'type': 'object', 'title': 'Patient' },
    'deviceName': { 'type': 'array', 'title': 'Device Name' }
};

module.exports = {
    async receive(context) {

        const { patient } = context.messages.in.content;

        if (!context.properties.generateOutputPortOptions && !patient) {
            throw new context.CancelError('Patient ID is required!');
        }

        return runPatientSearch(context, {
            resourceType: 'Device',
            label: 'Devices',
            schema
        });
    }
};
