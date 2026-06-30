'use strict';

const lib = require('./lib');

// Epic on FHIR R4. The public Epic sandbox base URL is used by default. A
// different organisation endpoint can be supplied via the instance config
// (`config.epicFhirBaseUrl`) without changing component code.
const FHIR_BASE_URL = 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4';

// OAuth2 (SMART on FHIR) endpoints for the Epic sandbox.
const OAUTH_BASE_URL = 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2';

function getFhirBaseUrl(context) {

    const fromConfig = context.config && context.config.epicFhirBaseUrl;
    return (fromConfig || FHIR_BASE_URL).replace(/\/+$/, '');
}

// Perform a FHIR request against the configured base URL using the OAuth2
// access token. `resource` is the path after the base URL, e.g.
// `Patient/123` or `Condition`.
async function fhirRequest(context, { method = 'GET', resource, params } = {}) {

    const response = await context.httpRequest({
        method,
        url: `${getFhirBaseUrl(context)}/${resource}`,
        headers: {
            'Authorization': `Bearer ${context.auth.accessToken}`,
            'Accept': 'application/fhir+json'
        },
        params
    });

    return response.data;
}

// Extract the resources from a FHIR searchset Bundle, skipping OperationOutcome
// and other non-resource entries.
function extractResources(bundle) {

    if (!bundle || !Array.isArray(bundle.entry)) {
        return [];
    }

    return bundle.entry
        .map(entry => entry && entry.resource)
        .filter(resource => resource && resource.resourceType && resource.resourceType !== 'OperationOutcome');
}

// Shared behaviour for the patient-anchored Find components. Every clinical
// resource in this connector is searched by patient and returned as a set, so
// the logic only differs by resource type, the inspector label, the item
// schema (for the variable picker) and any fixed extra search params (e.g. the
// Observation category).
async function runPatientSearch(context, { resourceType, label, schema, extraParams = {} }) {

    const { patient, outputType } = context.messages.in.content;

    if (context.properties.generateOutputPortOptions) {
        return lib.getOutputPortOptions(context, outputType, schema, { label });
    }

    if (!patient) {
        throw new context.CancelError('Patient ID is required!');
    }

    const bundle = await fhirRequest(context, {
        resource: resourceType,
        params: { patient, ...extraParams }
    });

    const records = extractResources(bundle);

    if (records.length === 0) {
        return context.sendJson({}, 'notFound');
    }

    return lib.sendArrayOutput({ context, records, outputType });
}

module.exports = {
    FHIR_BASE_URL,
    OAUTH_BASE_URL,
    getFhirBaseUrl,
    fhirRequest,
    extractResources,
    runPatientSearch
};
