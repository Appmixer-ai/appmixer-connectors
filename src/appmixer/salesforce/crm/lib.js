const SalesforceAPI = require('jsforce');
const pathModule = require('path');
const crypto = require('crypto');
const DEFAULT_API_VERSION = '58.0';

/**
 * Stable cache key for cached dynamic-source (dropdown) calls.
 * @param {Object} obj - anything JSON-serializable that identifies the call
 * @return {string}
 */
function getSourceCacheKey(obj) {
    return 'salesforce_source_' + crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

module.exports = {

    // Expects standardized outputType: 'object', 'array', 'file'
    async sendArrayOutput({ context, outputPortName = 'out', outputType = 'array', records = [] }) {
        if (outputType === 'object') {
            // One by one.
            await context.sendArray(records, outputPortName);
        } else if (outputType === 'array') {
            // All at once.
            await context.sendJson({ result: records }, outputPortName);
        } else if (outputType === 'file') {

            // Into CSV file.
            const csvString = toCsv(records);

            let buffer = Buffer.from(csvString, 'utf8');
            const componentName = context.flowDescriptor[context.componentId].label || context.componentId;
            const fileName = `${context.config.outputFilePrefix || 'salesforce-objects-export'}-${componentName}.csv`;
            const savedFile = await context.saveFileStream(pathModule.normalize(fileName), buffer);

            await context.log({ step: 'File was saved', fileName, fileId: savedFile.fileId });
            await context.sendJson({ fileId: savedFile.fileId }, outputPortName);
        } else {
            throw new context.CancelError('Unsupported outputType ' + outputType);
        }
    },

    /**
     * Get new SalesforceAPI
     * @param context - Appmixer context object.
     * @returns {*}
     */
    getSalesforceAPI(context) {

        const instanceUrl = context.profileInfo.instanceUrl;
        const accessToken = context.auth.accessToken;
        const version = context.config.apiVersion || DEFAULT_API_VERSION;

        return new SalesforceAPI.Connection({
            instanceUrl,
            accessToken,
            version
        });
    },

    Date: SalesforceAPI.Date,

    /**
     * Fetch all Account records via the jsforce SDK.
     * @param {Object} context
     * @return {Promise<Array>}
     */
    listAccounts(context) {

        const client = this.getSalesforceAPI(context);
        return client.sobject('Account').find();
    },

    /**
     * Shared cache wrapper for dynamic-source (dropdown) calls, so repeated
     * inspector openings do not burn the Salesforce request quota. Keyed by
     * the access token — a token refresh naturally invalidates the cache.
     * @param {Object} context
     * @param {Object} params - { resource, ttlConfigKey, fetch }
     * @return {Promise<*>} the fetch() result, possibly served from cache
     */
    async cachedSource(context, { resource, ttlConfigKey, fetch }) {

        const key = getSourceCacheKey({ resource, token: context.auth.accessToken });
        let lock;
        try {
            lock = await context.lock(key);
            const cached = await context.staticCache.get(key);
            if (cached) return cached;

            const result = await fetch();
            const ttl = (ttlConfigKey && context.config[ttlConfigKey]) || (5 * 60 * 1000);
            await context.staticCache.set(key, result, ttl);
            return result;
        } finally {
            lock?.unlock();
        }
    },

    /**
     * Cached variant of listAccounts for dynamic-source (dropdown) calls.
     * @param {Object} context
     * @return {Promise<Array>}
     */
    listAccountsCached(context) {

        return this.cachedSource(context, {
            resource: 'accounts',
            ttlConfigKey: 'listAccountsCacheTTL',
            fetch: () => this.listAccounts(context)
        });
    },

    /**
     * Fetch the single newest record of an sObject via the jsforce SDK, ordered by
     * CreatedDate descending. Shared by the New* triggers' test() methods so the emitted
     * record goes through the exact same SDK query path as tick() (minus the `since`
     * baseline filter, which would suppress output on a fresh poll).
     * @param {Object} context - Appmixer context object.
     * @param {string} objectName - Salesforce sObject name (e.g. 'Lead').
     * @return {Promise<Object|null>} the newest record or null when none exist.
     */
    async findLatestSObject(context, objectName) {

        const client = this.getSalesforceAPI(context);
        const res = await client.sobject(objectName)
            .find({})
            .sort({ CreatedDate: -1 })
            .limit(1);
        return (Array.isArray(res) && res.length) ? res[0] : null;
    },

    /**
     * Salesforce has a weird datetime format '2017-04-28T16:18:47.000+0000', but AJV
     * schema validator does not buy that, so let's reformat to ISO.
     * @param {string} date
     * @return {string}
     */
    formatDate(date) {

        if (!date) {
            return date;
        }
        return new Date(date).toISOString();
    },

    /**
     * Go through certain record fields and apply format function.
     * @param {Object} record - salesforce record - contact, ...
     * @param {Array} fields - array with field names to be formatted
     * @param {function} formatFunc
     * @return {Object} record
     */
    formatFields(record, fields, formatFunc) {

        fields.forEach(field => {
            record[field] = formatFunc(record[field]);
        });
        return record;
    },

    /**
     * Escape a value so it can be safely embedded in a SOQL string literal.
     * Backslashes must be escaped first — a trailing backslash in the value
     * would otherwise escape the literal's closing quote and let the rest of
     * the query be injected into the string.
     * @param {*} value
     * @return {string}
     */
    escapeSoql(value) {

        return String(value).replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
    },

    /**
     * Escape a value so it can be safely embedded in a SOQL LIKE pattern.
     * On top of the quote escaping, the LIKE wildcards % (any sequence) and
     * _ (any single character) must be escaped too, so that user input is
     * matched literally — the caller then adds its own wildcards around the
     * escaped value (e.g. `'%' + escapeSoqlLike(v) + '%'` for a contains
     * match). Note that SOQL only supports LIKE on text fields; using it on
     * an ID, number or date field makes Salesforce reject the query.
     * @param {*} value
     * @return {string}
     */
    escapeSoqlLike(value) {

        return this.escapeSoql(value).replace(/([%_])/g, '\\$1');
    },

    /**
     * Validate that a value is a safe Salesforce API identifier (object or
     * field name) before interpolating it into a SOQL query. Salesforce API
     * names start with a letter and contain only letters, digits and
     * underscores, so this rejects SOQL injection and relationship paths like
     * `Owner.Name` (which the diff logic could not handle anyway).
     * @param {*} value
     * @param {string} label - human readable name used in the error message
     * @return {string} the validated identifier
     */
    assertSafeIdentifier(value, label) {

        if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(String(value))) {
            throw new Error(`Invalid ${label}: "${value}". Only Salesforce API names (letters, digits and underscores) are supported.`);
        }
        return value;
    },

    /**
     * Common Salesforce datetime fields present on standard objects. Used to
     * reformat values to ISO before emitting (Salesforce returns a non-ISO
     * datetime format that the AJV schema validator rejects).
     */
    COMMON_DATE_FIELDS: [
        'CreatedDate',
        'LastModifiedDate',
        'SystemModstamp',
        'LastViewedDate',
        'LastReferencedDate',
        'LastActivityDate',
        'EmailBouncedDate',
        'LastCURequestDate',
        'LastCUUpdateDate',
        'CloseDate',
        'ConvertedDate'
    ],

    /**
     * Reformat the common Salesforce datetime fields of a record to ISO. Only
     * fields actually present (and truthy) on the record are touched.
     * @param {Object} record
     * @return {Object} record
     */
    formatSalesforceDates(record) {

        this.COMMON_DATE_FIELDS.forEach(field => {
            if (record[field]) {
                record[field] = this.formatDate(record[field]);
            }
        });
        return record;
    },

    /**
     * Standard Contact fields selected by the Get Contacts components. Kept as an
     * explicit list (instead of FIELDS(ALL)) so the SOQL query is not bound by the
     * 200 record limit Salesforce imposes on FIELDS(ALL) queries, and so the output
     * shape stays predictable for the variable picker.
     */
    CONTACT_FIELDS: [
        'Id',
        'AccountId',
        'FirstName',
        'LastName',
        'Name',
        'Salutation',
        'Title',
        'Department',
        'Email',
        'Phone',
        'MobilePhone',
        'HomePhone',
        'Fax',
        'MailingStreet',
        'MailingCity',
        'MailingState',
        'MailingPostalCode',
        'MailingCountry',
        'OwnerId',
        'LeadSource',
        'Description',
        'CreatedDate',
        'LastModifiedDate'
    ],

    /**
     * Run a SOQL query and return every matching record, following Salesforce's
     * query pagination (nextRecordsUrl) until the whole result set is fetched.
     * @param {Object} context
     * @param {string} soql
     * @return {Promise<Array>}
     */
    async queryAll(context, soql) {

        const records = [];
        let { data } = await this.api.salesForceRq(context, {
            action: `query?q=${encodeURIComponent(soql)}`
        });
        records.push(...((data && data.records) || []));

        // nextRecordsUrl looks like /services/data/vXX.0/query/01g...-2000; rebuild
        // the action relative to the data service so salesForceRq can reissue it
        // with the configured API version.
        while (data && data.done === false && data.nextRecordsUrl) {
            const action = 'query' + data.nextRecordsUrl.split('/query')[1];
            ({ data } = await this.api.salesForceRq(context, { action }));
            records.push(...((data && data.records) || []));
        }

        return records;
    },

    /**
     * Fetch all Campaign records.
     * @param {Object} context
     * @return {Promise<Array>}
     */
    async listCampaigns(context) {

        const client = this.getSalesforceAPI(context);
        const records = await client.sobject('Campaign')
            .find({}, { Id: 1, Name: 1, IsActive: 1, Status: 1, Type: 1, StartDate: 1, EndDate: 1 })
            .sort({ Name: 1 });
        // Strip the SDK's `attributes` envelope — it is not part of the declared
        // output and its JSON (with commas) corrupts the CSV file mode.
        return (records || []).map(({ attributes, ...rest }) => rest);
    },

    /**
     * Cached variant of listCampaigns for dynamic-source (dropdown) calls.
     * @param {Object} context
     * @return {Promise<Array>}
     */
    listCampaignsCached(context) {

        return this.cachedSource(context, {
            resource: 'campaigns',
            ttlConfigKey: 'listCampaignsCacheTTL',
            fetch: () => this.listCampaigns(context)
        });
    },

    /**
     * Fetch Contact records (with the standard CONTACT_FIELDS) matching an
     * optional SOQL WHERE clause, newest first, with datetime fields reformatted
     * to ISO. The caller is responsible for building a safe WHERE clause.
     * `extraFields` lets a caller add validated field names to the SELECT list
     * (e.g. the filtered custom field, so its value appears in the output).
     * @param {Object} context
     * @param {Object} params - { where, extraFields }
     * @return {Promise<Array>}
     */
    async findContacts(context, { where, extraFields = [] } = {}) {

        const fields = [...this.CONTACT_FIELDS];
        extraFields.forEach(field => {
            if (field && !fields.includes(field)) {
                fields.push(this.assertSafeIdentifier(field, 'field name'));
            }
        });
        let soql = `SELECT ${fields.join(', ')} FROM Contact`;
        if (where) {
            soql += ` WHERE ${where}`;
        }
        soql += ' ORDER BY LastModifiedDate DESC';

        const records = await this.queryAll(context, soql);
        // Strip the REST envelope's `attributes` object — it is not part of the
        // declared output and its JSON (with commas) corrupts the CSV file mode.
        return records.map(record => {
            // eslint-disable-next-line no-unused-vars
            const { attributes, ...rest } = record;
            return this.formatSalesforceDates(rest);
        });
    },

    /**
     * Emit the output port options for the Get Contacts components based on the
     * chosen outputType (mirrors the pattern used by Query and ListObjects).
     * @param {Object} context
     * @param {string} outputType
     */
    getContactOutputPortOptions(context, outputType) {

        if (outputType === 'object') {
            const output = this.CONTACT_FIELDS.map(field => ({ label: field, value: field }));
            return context.sendJson(output, 'out');
        } else if (outputType === 'array') {
            return context.sendJson([{ label: 'Result', value: 'result' }], 'out');
        } else {
            // file
            return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
        }
    },

    /**
     * Build the initial { recordId: fieldValue } map of a monitored field, used
     * by a status/field-change trigger's start() to seed known state.
     * Optionally scoped to a single record.
     * @param {Object} context
     * @param {Object} params - { objectName, fieldName, recordId }
     * @return {Promise<Object>}
     */
    async getFieldValueMap(context, { objectName, fieldName, recordId }) {

        this.assertSafeIdentifier(objectName, 'object name');
        this.assertSafeIdentifier(fieldName, 'field name');
        const where = recordId ? ` WHERE Id = '${this.escapeSoql(recordId)}'` : '';
        const soql = `SELECT Id,${fieldName} FROM ${objectName}${where}`;
        const { data } = await this.api.salesForceRq(context, {
            method: 'GET',
            action: `query?q=${encodeURIComponent(soql)}`
        });

        const map = {};
        ((data && data.records) || []).forEach(record => {
            map[record['Id']] = record[fieldName];
        });
        return map;
    },

    /**
     * Fetch full records of an object modified since the given date, newest
     * first. Optionally scoped to a single record.
     * @param {Object} context
     * @param {Object} params - { objectName, since, recordId, limit }
     * @return {Promise<Array>}
     */
    async getModifiedRecords(context, { objectName, since, recordId, limit = 200 }) {

        this.assertSafeIdentifier(objectName, 'object name');
        // The query below selects all fields via SOQL FIELDS(ALL), which
        // Salesforce only allows as a *bounded* query: it requires a LIMIT of
        // at most 200 (and rejects nextRecordsUrl-style pagination). Requesting
        // more than 200 makes the API reject the query outright, so the limit is
        // capped at 200 here. Records are ordered newest-first so the most
        // recent changes in a tick window are never the ones dropped.
        let where = `LastModifiedDate >= ${this.Date.toDateTimeLiteral(since)}`;
        if (recordId) {
            where += ` AND Id = '${this.escapeSoql(recordId)}'`;
        }
        const soql = `SELECT FIELDS(ALL) FROM ${objectName} WHERE ${where} ORDER BY LastModifiedDate DESC LIMIT ${limit}`;
        const { data } = await this.api.salesForceRq(context, {
            method: 'GET',
            action: `query?q=${encodeURIComponent(soql)}`
        });

        return (data && data.records) || [];
    },

    /**
     * Fetch the single most recently modified record of an object. Optionally
     * scoped to a single record. Used by trigger test() methods to emit one
     * realistic item for Flow Test Mode.
     * @param {Object} context
     * @param {Object} params - { objectName, recordId }
     * @return {Promise<Object|null>}
     */
    async getLatestRecord(context, { objectName, recordId }) {

        this.assertSafeIdentifier(objectName, 'object name');
        const where = recordId ? ` WHERE Id = '${this.escapeSoql(recordId)}'` : '';
        const soql = `SELECT FIELDS(ALL) FROM ${objectName}${where} ORDER BY LastModifiedDate DESC LIMIT 1`;
        const { data } = await this.api.salesForceRq(context, {
            method: 'GET',
            action: `query?q=${encodeURIComponent(soql)}`
        });

        return ((data && data.records) || [])[0] || null;
    },

    /**
     * Shared start() for status/field-change triggers: seed the known value of
     * the monitored field for every (optionally a single) record.
     */
    async runFieldChangeStart(context, { objectName, fieldName, recordId }) {

        const known = await this.getFieldValueMap(context, { objectName, fieldName, recordId });
        await context.saveState({ known });
    },

    /**
     * Shared tick() for status/field-change triggers: emit each modified record
     * whose monitored field value changed since the previous tick.
     */
    async runFieldChangeTick(context, { objectName, fieldName, recordId, outputPortName }) {

        const since = new Date();
        const lastSince = context.state.since || since;

        const records = await this.getModifiedRecords(context, {
            objectName,
            since: lastSince,
            recordId
        });

        const known = context.state.known || {};
        const newKnown = { ...known };
        const triggered = [];

        records.forEach(record => {
            const id = record['Id'];
            const prev = known[id];
            const curr = record[fieldName];
            // Only emit when we knew a previous value and it actually changed.
            if (prev !== undefined && prev !== curr) {
                triggered.push(record);
            }
            newKnown[id] = curr;
        });

        await Promise.all(triggered.map(record => {
            return context.sendJson(this.formatSalesforceDates(record), outputPortName);
        }));

        await context.saveState({ known: newKnown, since });
    },

    // Record Updated trigger -----------------------------------------------------------------

    /**
     * Conditions of the Record Updated trigger. 'changed' and 'changedTo' read the
     * object's Field History (old and new value of every change); 'equals' and
     * 'notEquals' compare the current value of records modified since the last poll.
     */
    RECORD_UPDATED_OPERATORS: ['changedTo', 'changed', 'equals', 'notEquals'],
    RECORD_UPDATED_HISTORY_OPERATORS: ['changedTo', 'changed'],

    // Changes processed in one tick; the rest is picked up by the next tick, in order.
    RECORD_UPDATED_MAX_PER_TICK: 2000,

    // Ids remembered by the Equals / Does not equal conditions to emit a record only once
    // while its field keeps the value.
    RECORD_UPDATED_MAX_EMITTED: 1000,

    // A poll only reads changes older than this, so that a change whose transaction commits
    // a few seconds after its timestamp is not skipped by the watermark.
    RECORD_UPDATED_LAG_MS: 30 * 1000,

    // Records fetched per sObject Collections request (the API allows 2000).
    RECORD_UPDATED_FETCH_CHUNK: 200,

    // Ids per "Id IN (...)" filter query, keeps the query URL short.
    RECORD_UPDATED_FILTER_CHUNK: 100,

    /**
     * Read and validate the Record Updated trigger properties.
     * @param {Object} context
     * @return {{objectName: string, fieldName: string, operator: string, value: string, where: string, since: string}}
     */
    getRecordUpdatedConfig(context) {

        const { objectName, fieldName, value, where, since } = context.properties;
        const operator = context.properties.operator || 'changedTo';
        if (!objectName) {
            throw new context.CancelError('Object Name is required!');
        }
        if (!fieldName) {
            throw new context.CancelError('Field Name is required!');
        }
        if (!this.RECORD_UPDATED_OPERATORS.includes(operator)) {
            throw new context.CancelError(`Unsupported condition: ${operator}.`);
        }
        if (operator !== 'changed' && (value === undefined || value === null || value === '')) {
            throw new context.CancelError('Value is required for this condition!');
        }
        try {
            this.assertSafeIdentifier(objectName, 'object name');
            this.assertSafeIdentifier(fieldName, 'field name');
        } catch (err) {
            throw new context.CancelError(err.message);
        }
        if (since && isNaN(new Date(since).getTime())) {
            throw new context.CancelError(`Invalid Start From date: ${since}.`);
        }
        return {
            objectName,
            fieldName,
            operator,
            value: value === undefined || value === null ? '' : String(value),
            where: where && String(where).trim() ? String(where).trim() : '',
            since: since || ''
        };
    },

    /**
     * Whether the condition is evaluated on Field History (old and new value).
     * @param {string} operator
     * @return {boolean}
     */
    isHistoryOperator(operator) {

        return this.RECORD_UPDATED_HISTORY_OPERATORS.includes(operator);
    },

    /**
     * Compare a Salesforce field value with the value of the condition: as text, trimmed and
     * case-insensitive (picklist API values, true/false, numbers). An empty condition value
     * matches an empty field.
     * @param {*} actual
     * @param {*} expected
     * @return {boolean}
     */
    valueMatches(actual, expected) {

        const normalize = (v) => (v === undefined || v === null ? '' : String(v)).trim().toLowerCase();
        return normalize(actual) === normalize(expected);
    },

    /**
     * Whether the current value of a field meets an Equals / Does not equal condition.
     * @param {Object} config - getRecordUpdatedConfig() result
     * @param {*} actual
     * @return {boolean}
     */
    currentValueMatches(config, actual) {

        const equal = this.valueMatches(actual, config.value);
        return config.operator === 'notEquals' ? !equal : equal;
    },

    /**
     * A date as a SOQL datetime literal, in whole seconds (Salesforce keeps record and history
     * timestamps in whole seconds).
     * @param {Date|string} date
     * @return {string} e.g. 2026-11-23T17:43:12Z
     */
    toSoqlSecond(date) {

        return new Date(date).toISOString().slice(0, 19) + 'Z';
    },

    /**
     * Values of the Field column of the History object that belong to a field. A standard
     * lookup (OwnerId) is tracked under the relationship name (Owner).
     * @param {string} fieldName
     * @return {Array<string>}
     */
    historyFieldNames(fieldName) {

        const names = [fieldName];
        if (!fieldName.endsWith('__c') && /^.+Id$/.test(fieldName)) {
            names.push(fieldName.slice(0, -2));
        }
        return names;
    },

    /**
     * The History object Salesforce keeps for an object: CaseHistory, AccountHistory, …,
     * OpportunityFieldHistory for Opportunity, <Name>__History for a custom object.
     * @param {string} objectName
     * @return {string}
     */
    historyObjectName(objectName) {

        if (objectName === 'Opportunity') {
            return 'OpportunityFieldHistory';
        }
        if (objectName.endsWith('__c')) {
            return objectName.slice(0, -3) + '__History';
        }
        return objectName + 'History';
    },

    /**
     * Check that Field History Tracking is on for the field and find the History object and
     * its field that points to the record. Throws a CancelError that says what to do when it
     * is not.
     * @param {Object} context
     * @param {Object} config - getRecordUpdatedConfig() result
     * @return {Promise<{historyObject: string, parentField: string}>}
     */
    async resolveHistorySource(context, { objectName, fieldName }) {

        const soql = 'SELECT QualifiedApiName, IsFieldHistoryTracked FROM FieldDefinition' +
            ` WHERE EntityDefinition.QualifiedApiName = '${this.escapeSoql(objectName)}'` +
            ` AND QualifiedApiName = '${this.escapeSoql(fieldName)}'`;
        const [definition] = await this.queryAll(context, soql);
        if (!definition) {
            throw new context.CancelError(`Field ${fieldName} was not found on ${objectName}.`);
        }
        const hint = 'Enable it in Salesforce Setup (Object Manager > ' + objectName +
            ' > Fields & Relationships > Set History Tracking) or use the Equals / Does not equal condition.';
        if (!definition.IsFieldHistoryTracked) {
            throw new context.CancelError(
                `The Changes and Changes to conditions need Field History Tracking on ${objectName}.${fieldName}, which is off. ${hint}`
            );
        }

        const historyObject = this.historyObjectName(objectName);
        let fields;
        try {
            fields = await this.describeFieldsCached(context, historyObject);
        } catch (err) {
            if (err.response && [400, 404].includes(err.response.status)) {
                throw new context.CancelError(
                    `Field history of ${objectName} cannot be read through the API (${historyObject} is not available). ${hint}`
                );
            }
            throw err;
        }
        const parent = fields.find(field => field.name === 'ParentId') ||
            fields.find(field => {
                return field.type === 'reference' &&
                    field.name !== 'CreatedById' &&
                    (field.referenceTo || []).includes(objectName);
            });
        if (!parent) {
            throw new context.CancelError(`Cannot find the record reference on ${historyObject}.`);
        }
        return { historyObject, parentField: parent.name };
    },

    /**
     * SOQL of Field History rows of the watched field in a time window.
     * @param {Object} params
     * @return {string}
     */
    buildHistorySoql({ historyObject, parentField, fieldName, from, to, descending = false, limit }) {

        const fields = this.historyFieldNames(fieldName).map(name => `'${this.escapeSoql(name)}'`).join(', ');
        const conditions = [`Field IN (${fields})`];
        if (from) conditions.push(`CreatedDate >= ${this.toSoqlSecond(from)}`);
        if (to) conditions.push(`CreatedDate <= ${this.toSoqlSecond(to)}`);
        const direction = descending ? 'DESC' : 'ASC';
        let soql = `SELECT Id, ${parentField}, Field, DataType, OldValue, NewValue, CreatedDate FROM ${historyObject}` +
            ` WHERE ${conditions.join(' AND ')} ORDER BY CreatedDate ${direction}, Id ${direction}`;
        if (limit) soql += ` LIMIT ${limit}`;
        return soql;
    },

    /**
     * SOQL of records modified in a time window, with the watched field: no FIELDS(ALL), so
     * the result pages and is not capped at 200.
     * @param {Object} params
     * @return {string}
     */
    buildModifiedSoql({ objectName, fieldName, where, from, to, descending = false, limit }) {

        const conditions = [];
        if (from) conditions.push(`SystemModstamp >= ${this.toSoqlSecond(from)}`);
        if (to) conditions.push(`SystemModstamp <= ${this.toSoqlSecond(to)}`);
        if (where) conditions.push(`(${where})`);
        const select = fieldName === 'SystemModstamp' ? 'Id, SystemModstamp' : `Id, SystemModstamp, ${fieldName}`;
        const direction = descending ? 'DESC' : 'ASC';
        let soql = `SELECT ${select} FROM ${objectName}`;
        if (conditions.length) soql += ` WHERE ${conditions.join(' AND ')}`;
        soql += ` ORDER BY SystemModstamp ${direction}, Id ${direction}`;
        if (limit) soql += ` LIMIT ${limit}`;
        return soql;
    },

    /**
     * Run a SOQL query and yield its result page by page (following nextRecordsUrl), so a
     * caller can stop reading early.
     * @param {Object} context
     * @param {string} soql
     */
    async *queryPages(context, soql) {

        let { data } = await this.api.salesForceRq(context, {
            action: `query?q=${encodeURIComponent(soql)}`
        });
        yield (data && data.records) || [];
        while (data && data.done === false && data.nextRecordsUrl) {
            const action = 'query' + data.nextRecordsUrl.split('/query')[1];
            ({ data } = await this.api.salesForceRq(context, { action }));
            yield (data && data.records) || [];
        }
    },

    /**
     * Read the rows after the watermark, oldest first: rows at the watermark second that were
     * already processed are skipped; reading stops after about maxRows rows, never in the
     * middle of a second, so the next tick continues exactly where this one stopped.
     * @param {Object} context
     * @param {Object} params - { soql, timestampField, watermark, seen, maxRows }
     * @return {Promise<Array>}
     */
    async readAfterWatermark(context, { soql, timestampField, watermark, seen = [], maxRows }) {

        const seenIds = new Set(seen);
        const rows = [];
        for await (const page of this.queryPages(context, soql)) {
            for (const row of page) {
                const second = this.toSoqlSecond(row[timestampField]);
                if (second === watermark && seenIds.has(row.Id)) {
                    continue;
                }
                if (rows.length >= maxRows && second !== this.toSoqlSecond(rows[rows.length - 1][timestampField])) {
                    return rows;
                }
                rows.push(row);
            }
        }
        return rows;
    },

    /**
     * The watermark after processing rows: the second of the last row and the ids processed
     * at that second (kept so rows with an equal timestamp are neither lost nor repeated).
     * @param {Object} state - { watermark, seen }
     * @param {Array} rows - processed rows, oldest first
     * @param {string} timestampField
     * @return {{watermark: string, seen: Array<string>}}
     */
    advanceWatermark({ watermark, seen = [] }, rows, timestampField) {

        if (!rows.length) {
            return { watermark, seen };
        }
        const last = this.toSoqlSecond(rows[rows.length - 1][timestampField]);
        const ids = last === watermark ? new Set(seen) : new Set();
        rows.forEach(row => {
            if (this.toSoqlSecond(row[timestampField]) === last) ids.add(row.Id);
        });
        return { watermark: last, seen: Array.from(ids) };
    },

    /**
     * Group Field History rows into changes: one change of a field on a record at one moment
     * (a lookup change writes two rows, the id and the name).
     * @param {Array} rows
     * @param {string} parentField
     * @return {Array<{recordId: string, changedDate: string, rows: Array}>}
     */
    groupHistoryRows(rows, parentField) {

        const groups = new Map();
        rows.forEach(row => {
            const key = row[parentField] + '|' + this.toSoqlSecond(row.CreatedDate);
            if (!groups.has(key)) {
                groups.set(key, { recordId: row[parentField], changedDate: row.CreatedDate, rows: [] });
            }
            groups.get(key).rows.push(row);
        });
        return Array.from(groups.values());
    },

    /**
     * The old and new value of a change when it meets a Changes / Changes to condition,
     * null when it does not.
     * @param {Object} config - getRecordUpdatedConfig() result
     * @param {Object} change - groupHistoryRows() item
     * @return {{oldValue: *, newValue: *}|null}
     */
    historyChangeMatches(config, change) {

        let row;
        if (config.operator === 'changedTo') {
            row = change.rows.find(r => this.valueMatches(r.NewValue, config.value) &&
                !this.valueMatches(r.OldValue, config.value));
        } else {
            row = change.rows.find(r => r.DataType !== 'EntityId') || change.rows[0];
        }
        if (!row) {
            return null;
        }
        return {
            oldValue: row.OldValue === undefined ? null : row.OldValue,
            newValue: row.NewValue === undefined ? null : row.NewValue
        };
    },

    /**
     * Keep only the ids of records that meet the additional SOQL filter.
     * @param {Object} context
     * @param {Object} params - { objectName, where, ids }
     * @return {Promise<Set<string>>}
     */
    async filterIdsByWhere(context, { objectName, where, ids }) {

        const unique = Array.from(new Set(ids));
        if (!where) {
            return new Set(unique);
        }
        const result = new Set();
        for (let i = 0; i < unique.length; i += this.RECORD_UPDATED_FILTER_CHUNK) {
            const chunk = unique.slice(i, i + this.RECORD_UPDATED_FILTER_CHUNK);
            const list = chunk.map(id => `'${this.escapeSoql(id)}'`).join(', ');
            const records = await this.queryAll(context, `SELECT Id FROM ${objectName} WHERE Id IN (${list}) AND (${where})`);
            records.forEach(record => result.add(record.Id));
        }
        return result;
    },

    /**
     * The describe fields of an object, cached per access token (TTL objectPropertiesCacheTTL,
     * default 5 minutes) so a poll does not describe the object every minute.
     * @param {Object} context
     * @param {string} objectName
     * @return {Promise<Array>}
     */
    describeFieldsCached(context, objectName) {

        return this.cachedSource(context, {
            resource: 'describe:' + objectName,
            ttlConfigKey: 'objectPropertiesCacheTTL',
            fetch: () => this.api.getObjectFields(context, { objectName })
        });
    },

    /**
     * Fetch whole records by id with sObject Collections (POST, so a long field list does not
     * hit the URL length limit). Date-time fields are reformatted to ISO; deleted records
     * are missing from the result.
     * @param {Object} context
     * @param {Object} params - { objectName, ids }
     * @return {Promise<Map<string, Object>>}
     */
    async fetchRecordsById(context, { objectName, ids }) {

        const records = new Map();
        const unique = Array.from(new Set(ids));
        if (!unique.length) {
            return records;
        }
        const described = await this.describeFieldsCached(context, objectName);
        // Binary and compound (address, geolocation) fields are left out; the parts of a
        // compound field are fields of their own.
        const fields = described.filter(field => !['base64', 'address', 'location'].includes(field.type));
        const fieldNames = fields.map(field => field.name);
        const dateTimeFields = fields.filter(field => field.type === 'datetime').map(field => field.name);

        for (let i = 0; i < unique.length; i += this.RECORD_UPDATED_FETCH_CHUNK) {
            const chunk = unique.slice(i, i + this.RECORD_UPDATED_FETCH_CHUNK);
            const { data } = await this.api.salesForceRq(context, {
                method: 'POST',
                action: `composite/sobjects/${objectName}`,
                data: JSON.stringify({ ids: chunk, fields: fieldNames }),
                headers: { 'Content-Type': 'application/json' }
            });
            (Array.isArray(data) ? data : []).forEach(record => {
                if (!record || !record.Id) return;
                // eslint-disable-next-line no-unused-vars
                const { attributes, ...rest } = record;
                dateTimeFields.forEach(field => {
                    if (rest[field]) rest[field] = this.formatDate(rest[field]);
                });
                records.set(rest.Id, rest);
            });
        }
        return records;
    },

    /**
     * start() of the Record Updated trigger: check the configuration (Field History Tracking
     * for Changes / Changes to) and set the watermark to now or to Start From.
     * @param {Object} context
     */
    async startRecordUpdated(context) {

        const config = this.getRecordUpdatedConfig(context);
        const state = { watermark: this.toSoqlSecond(config.since || new Date()), seen: [] };
        if (this.isHistoryOperator(config.operator)) {
            Object.assign(state, await this.resolveHistorySource(context, config));
        } else {
            state.emitted = [];
        }
        await context.saveState(state);
    },

    /**
     * tick() of the Record Updated trigger: emit the changes since the watermark, oldest
     * first, each once. The state holds only the watermark, the ids at the watermark second
     * and (Equals / Does not equal) a bounded list of emitted ids.
     * @param {Object} context
     * @param {string} outputPortName
     */
    async tickRecordUpdated(context, outputPortName = 'out') {

        const config = this.getRecordUpdatedConfig(context);
        const state = context.state || {};
        if (!state.watermark) {
            // No state (the flow was started before the component existed or the state was
            // cleared): start watching from now.
            return this.startRecordUpdated(context);
        }
        const to = new Date(Date.now() - this.RECORD_UPDATED_LAG_MS);

        if (this.isHistoryOperator(config.operator)) {
            const source = state.historyObject && state.parentField ?
                { historyObject: state.historyObject, parentField: state.parentField } :
                await this.resolveHistorySource(context, config);
            const rows = await this.readAfterWatermark(context, {
                soql: this.buildHistorySoql({ ...source, fieldName: config.fieldName, from: state.watermark, to }),
                timestampField: 'CreatedDate',
                watermark: state.watermark,
                seen: state.seen,
                maxRows: this.RECORD_UPDATED_MAX_PER_TICK
            });

            const changes = this.groupHistoryRows(rows, source.parentField)
                .map(change => ({ change, values: this.historyChangeMatches(config, change) }))
                .filter(item => item.values);
            const allowed = await this.filterIdsByWhere(context, {
                objectName: config.objectName,
                where: config.where,
                ids: changes.map(item => item.change.recordId)
            });
            const matching = changes.filter(item => allowed.has(item.change.recordId));
            const records = await this.fetchRecordsById(context, {
                objectName: config.objectName,
                ids: matching.map(item => item.change.recordId)
            });
            for (const item of matching) {
                const record = records.get(item.change.recordId);
                if (record) {
                    await context.sendJson({ ...record, ...item.values }, outputPortName);
                }
            }
            await context.saveState({
                ...source,
                ...this.advanceWatermark(state, rows, 'CreatedDate')
            });
            return;
        }

        const rows = await this.readAfterWatermark(context, {
            soql: this.buildModifiedSoql({ ...config, from: state.watermark, to }),
            timestampField: 'SystemModstamp',
            watermark: state.watermark,
            seen: state.seen,
            maxRows: this.RECORD_UPDATED_MAX_PER_TICK
        });
        // Insertion order = recency; re-inserting moves an id to the end.
        const emitted = new Set(Array.isArray(state.emitted) ? state.emitted : []);
        const toEmit = [];
        rows.forEach(row => {
            if (!this.currentValueMatches(config, row[config.fieldName])) {
                emitted.delete(row.Id);
                return;
            }
            if (emitted.has(row.Id)) {
                emitted.delete(row.Id);
                emitted.add(row.Id);
                return;
            }
            emitted.add(row.Id);
            toEmit.push(row);
        });
        const records = await this.fetchRecordsById(context, {
            objectName: config.objectName,
            ids: toEmit.map(row => row.Id)
        });
        for (const row of toEmit) {
            const record = records.get(row.Id);
            if (record) {
                await context.sendJson({ ...record, newValue: row[config.fieldName] }, outputPortName);
            }
        }
        const emittedList = Array.from(emitted);
        await context.saveState({
            ...this.advanceWatermark(state, rows, 'SystemModstamp'),
            emitted: emittedList.slice(Math.max(0, emittedList.length - this.RECORD_UPDATED_MAX_EMITTED))
        });
    },

    /**
     * Example for the Record Updated trigger's test(): the latest change (Changes / Changes to)
     * or the latest modified record (Equals / Does not equal) that meets the condition, in the
     * shape tick() emits. Read-only, no state.
     * @param {Object} context
     * @return {Promise<Object|null>} null when no recent change meets the condition
     */
    async findRecordUpdatedExample(context) {

        const config = this.getRecordUpdatedConfig(context);
        const sampleSize = 200;
        let recordId;
        let values;

        if (this.isHistoryOperator(config.operator)) {
            const source = await this.resolveHistorySource(context, config);
            const rows = await this.queryAll(context, this.buildHistorySoql({
                ...source,
                fieldName: config.fieldName,
                descending: true,
                limit: sampleSize
            }));
            const changes = this.groupHistoryRows(rows, source.parentField)
                .map(change => ({ change, values: this.historyChangeMatches(config, change) }))
                .filter(item => item.values);
            const allowed = await this.filterIdsByWhere(context, {
                objectName: config.objectName,
                where: config.where,
                ids: changes.map(item => item.change.recordId)
            });
            const latest = changes.find(item => allowed.has(item.change.recordId));
            if (latest) {
                recordId = latest.change.recordId;
                values = latest.values;
            }
        } else {
            const rows = await this.queryAll(context, this.buildModifiedSoql({
                ...config,
                descending: true,
                limit: sampleSize
            }));
            const latest = rows.find(row => this.currentValueMatches(config, row[config.fieldName]));
            if (latest) {
                recordId = latest.Id;
                values = { newValue: latest[config.fieldName] };
            }
        }

        const record = recordId &&
            (await this.fetchRecordsById(context, { objectName: config.objectName, ids: [recordId] })).get(recordId);
        return record ? { ...record, ...values } : null;
    },

    // API
    api: {
        async getObjectFields(context, { objectName, cache = false }) {
            let fields = [];

            if (!cache) {
                const { data } = await this.salesForceRq(context, { action: `sobjects/${objectName}/describe` });
                return data?.fields || [];
            }

            const objectPropertiesCacheTTL = context.config.objectPropertiesCacheTTL || (5 * 60 * 1000);
            const cacheKey = 'salesforce_properties_objectFields_' + objectName + '_' + context.auth.userId + context.auth.profileInfo.email;
            let lock;
            try {
                lock = await context.lock(cacheKey);
                const cached = await context.staticCache.get(cacheKey);
                if (cached) {
                    fields = cached;
                } else {
                    const { data } = await this.salesForceRq(context, { action: `sobjects/${objectName}/describe` });

                    fields = data?.fields || [];

                    await context.staticCache.set(cacheKey, fields, objectPropertiesCacheTTL);
                }
                return fields;
            } finally {
                lock?.unlock();
            }
        },

        async createObject(context, { objectName, json }) {
            const { data } = await this.salesForceRq(context, {
                method: 'POST',
                action: `sobjects/${objectName}`,
                data: JSON.stringify(json),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return data;
        },

        async salesForceRq(context, { method = 'GET', headers = {}, data, action, service = 'data' }) {

            const version = `v${context.config.apiVersion || DEFAULT_API_VERSION}`;

            return await context.httpRequest({
                method,
                url: `${context.profileInfo.instanceUrl}/services/${service}/${version}/${action}`,
                data,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    ...headers
                }
            });
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
