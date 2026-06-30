'use strict';

const lib = require('../../lib');
const { fhirRequest, extractResources } = require('../../commons');

const schema = {
    'resourceType': { 'type': 'string', 'title': 'Resource Type' },
    'id': { 'type': 'string', 'title': 'Patient ID' },
    'identifier': { 'type': 'array', 'title': 'Identifier' },
    'active': { 'type': 'boolean', 'title': 'Active' },
    'name': { 'type': 'array', 'title': 'Name' },
    'telecom': { 'type': 'array', 'title': 'Telecom' },
    'gender': { 'type': 'string', 'title': 'Gender' },
    'birthDate': { 'type': 'string', 'title': 'Birth Date' },
    'address': { 'type': 'array', 'title': 'Address' },
    'maritalStatus': { 'type': 'object', 'title': 'Marital Status' }
};

module.exports = {
    async receive(context) {

        const { family, given, birthdate, identifier, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Patients' });
        }

        const params = {};
        if (family) params.family = family;
        if (given) params.given = given;
        if (birthdate) params.birthdate = birthdate;
        if (identifier) params.identifier = identifier;

        if (Object.keys(params).length === 0) {
            throw new context.CancelError('Provide at least one search criterion (family name, given name, birth date or identifier).');
        }

        const bundle = await fhirRequest(context, { resource: 'Patient', params });
        const records = extractResources(bundle);

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
