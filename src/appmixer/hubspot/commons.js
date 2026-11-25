'use strict';
const pathModule = require('path');

// HubSpot property names of the fields hard-coded in the Create*/Update* inspectors — excluded from the
// "additional properties" dropdowns so they are not offered twice.
const INSPECTOR_FIELDS_CONTACT = ['email', 'firstname', 'lastname', 'phone', 'website', 'company', 'address', 'city', 'state', 'zip'];
const INSPECTOR_FIELDS_DEAL = ['dealname', 'dealstage', 'pipeline', 'hubspot_owner_id', 'closedate', 'amount'];
const INSPECTOR_FIELDS_COMPANY = ['domain', 'name', 'numberofemployees', 'industry', 'phone', 'website', 'city', 'state', 'country', 'address', 'zip', 'description', 'annualrevenue'];
const INSPECTOR_FIELDS_TICKET = ['subject', 'content', 'hs_pipeline', 'hs_pipeline_stage', 'hs_ticket_priority', 'hubspot_owner_id'];

module.exports = {

    /**
     *
     * @param context
     * @param outputPortName
     * @param {('array'|'file'|'object')} outputType
     * @param records
     * @returns {Promise<void>}
     */
    async sendArrayOutput({ context, outputPortName = 'out', outputType = 'array', records = [] }) {
        if (outputType === 'object') {
            // One by one.
            await context.sendArray(records, outputPortName);
        } else if (outputType === 'array') {
            // All at once.
            await context.sendJson({ array: records }, outputPortName);
        } else if (outputType === 'file') {

            // Into CSV file.
            const csvString = toCsv(records);

            let buffer = Buffer.from(csvString, 'utf8');
            const componentName = context.flowDescriptor[context.componentId].label || context.componentId;
            const fileName = `${context.config.outputFilePrefix || 'hubspot-export'}-${componentName}.csv`;
            const savedFile = await context.saveFileStream(pathModule.normalize(fileName), buffer);

            await context.log({ step: 'File was saved', fileName, fileId: savedFile.fileId });
            await context.sendJson({ fileId: savedFile.fileId }, outputPortName);
        } else {
            throw new context.CancelError('Unsupported outputType ' + outputType);
        }
    },

    INSPECTOR_FIELDS_CONTACT,
    INSPECTOR_FIELDS_DEAL,
    INSPECTOR_FIELDS_COMPANY,
    INSPECTOR_FIELDS_TICKET,
    // Former names of the lists above. Get*Properties versions published before the rename import them, and
    // instances keep serving those component snapshots next to this (newer) shared file.
    WATCHED_PROPERTIES_CONTACT: INSPECTOR_FIELDS_CONTACT,
    WATCHED_PROPERTIES_DEAL: INSPECTOR_FIELDS_DEAL,
    WATCHED_PROPERTIES_COMPANY: INSPECTOR_FIELDS_COMPANY,

    // Default propertyChange subscriptions routes.js registers for an OWN HubSpot app (appId + apiKey). They do
    // NOT decide what the triggers receive: with AuthHub the shared app's subscriptions are configured manually
    // in its HubSpot webhook settings. Subscriptions are app-wide (every installed portal) and capped at 1000
    // per app, so the defaults stay small — triggers add what they need through listener params
    // (see routes.js propertyChangeSubscriptions()).
    DEFAULT_SUBSCRIBED_PROPERTIES_CONTACT: ['email', 'firstname', 'lastname', 'phone', 'website', 'company', 'address', 'city', 'state', 'zip'],
    DEFAULT_SUBSCRIBED_PROPERTIES_DEAL: ['dealname', 'dealstage', 'pipeline', 'hubspot_owner_id', 'closedate', 'amount'],

    /**
     * True when a propertyChange webhook event changed at least one of the `watched` properties.
     * Checks every property routes.js collected for the object in the batch (`propertyNames`),
     * not only the last one. An empty `watched` list, or an event without property info, passes.
     */
    eventChangedWatchedProperty(event, watched) {

        if (!watched.length) {
            return true;
        }
        const changed = event.propertyNames || (event.propertyName ? [event.propertyName] : []);
        if (!changed.length) {
            return true;
        }
        return changed.some(name => watched.includes(name));
    },

    /**
     * Normalizes a list of record IDs given as an array, a comma separated string or a single ID
     * (a variable from another component) into an array of non-empty strings.
     */
    parseIdList(value) {

        if (value === undefined || value === null || value === '') {
            return [];
        }
        const items = Array.isArray(value) ? value : String(value).split(',');
        return items
            .map(item => (item && typeof item === 'object' ? item.id : item))
            .map(item => (item === undefined || item === null ? '' : String(item).trim()))
            .filter(Boolean);
    },

    /**
     * Builds the `associations` array of a CRM create request: every ID linked with the default
     * (HUBSPOT_DEFINED) association type of its target object.
     * @param {Array<{ ids: string[], associationTypeId: number }>} targets
     */
    buildAssociations(targets) {

        const associations = [];
        for (const { ids, associationTypeId } of targets) {
            for (const id of ids) {
                associations.push({
                    to: { id },
                    types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId }]
                });
            }
        }
        return associations;
    },

    /** Turns the "additional properties" expression input ({ AND: [{ name, value }] }) into an object. */
    additionalPropertiesToObject(additionalProperties) {

        const fields = additionalProperties?.AND || [];
        return fields.reduce((acc, field) => {
            if (field?.name) {
                acc[field.name] = field.value;
            }
            return acc;
        }, {});
    },

    async getObjectProperties(context, hubspot, objectType, output = 'all') {

        // Default cache TTL set to 1 minute as property definitions rarely change
        // Can be configured via context.config.objectPropertiesCacheTTL if needed
        const objectPropertiesCacheTTL = context.config.objectPropertiesCacheTTL || (60 * 1000);
        // Use hub_id from context to differentiate between different HubSpot portals/users.
        const portalId = context.auth?.profileInfo?.hub_id || 'default';
        const cacheKeyPrefix = 'hubspot_properties_' + objectType + '_' + portalId;
        let lock;
        try {
            lock = await context.lock(`hubspot_properties_${objectType}`);
            const cached = await context.staticCache.get(cacheKeyPrefix + '_' + output);
            if (cached) {
                return cached;
            }

            // Get all properties from HubSpot.
            const { data } = await hubspot.call('get', `crm/v3/properties/${objectType}`);
            // Custom fields should have `[custom]` in the label
            data.results.forEach(property => {
                if (property.createdUserId) {
                    property.label = `${property.label} [custom]`;
                }
            });
            const properties = data.results.map(property => property.name);

            // Save to cache both versions: triggers and actions.
            await context.staticCache.set(cacheKeyPrefix + '_all', data.results, objectPropertiesCacheTTL);
            await context.staticCache.set(cacheKeyPrefix + '_names', properties, objectPropertiesCacheTTL);

            // For triggers return array of names: ['email', 'firstname', ...]
            if (output === 'names') {
                return properties;
            }

            // For actions return array of objects: [{ name: 'email', type: 'string', ... }, ...]
            return data.results;
        } finally {
            await lock?.unlock();
        }
    }
};

// One CSV cell per RFC 4180: null/undefined → empty, objects → JSON, and a value
// holding a comma, a double quote or a line break is quoted with inner quotes doubled.
const csvCell = (value) => {
    if (value == null) return '';
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};

const toCsv = (records) => {
    if (!records.length) return '';
    // Cells are taken by header column, not Object.values(record), so a record with
    // a different key order or a missing key stays under the right header.
    const columns = Object.keys(records[0]);
    const rows = records.map(record => columns.map(column => csvCell(record[column])).join(','));
    return [columns.map(csvCell).join(','), ...rows].join('\n');
};
