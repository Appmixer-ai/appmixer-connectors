'use strict';

const _ = require('lodash');

const TTL_OUTPORT = 60 * 60 * 1000; // 1 hour for outports cache
const TTL_INSPECTOR = 60 * 60 * 1000; // 1 hour for inspector
/** Same entities as in other IPaaSes. Same set as in some components' inspectors. */
const DEFAULT_ENTITIES = [
    { label: 'Account', value: 'account' },
    { label: 'Campaign', value: 'campaign' },
    { label: 'Campaign Response', value: 'campaignresponse' },
    { label: 'Contact', value: 'contact' },
    { label: 'Incident', value: 'incident' },
    { label: 'Lead', value: 'lead' }
];

/** Dynamically generates Output Port options based on selected Entity. */
async function getOutputPortOptions(context) {

    const { logicalName = 'lead', outputType = 'object' } = context.messages.in.content;
    const resource = context.resource || context.auth.resource;
    const cacheKey = 'ms-dynamics-' + resource + '-' + logicalName + '-' + outputType + '-outport';

    if (!logicalName || !outputType || !resource) {
        throw new context.CancelError('Required properties are missing.');
    }

    if (outputType === 'file') {
        // No need for lock or to call the API.
        return [{ label: 'File ID', value: 'fileId' }];
    }

    let lock;
    try {
        lock = await context.lock(context.flowId, { retryDelay: 500 });

        const outPortCached = await context.staticCache.get(cacheKey);
        if (outPortCached) {
            return outPortCached;
        }

        const headers = {
            Accept: 'application/json',
            Authorization: `Bearer ${context.auth?.accessToken || context.accessToken}`
        };
        const urlPathAttributes = `${resource}/api/data/v9.2/EntityDefinitions(LogicalName='${logicalName}')/Attributes`;
        const optionsAttributes = {
            url: `${urlPathAttributes}?$select=LogicalName,AttributeType,DisplayName`,
            headers
        };
            // Getting all the fields from the entity.
            // Note that we are probably returning more fields than we need.
            // The default set typically includes all attributes that are used on the entity's main form,
            // plus some system attributes. However, the exact composition of the default set can vary and is not documented.
        const { data } = await context.httpRequest(optionsAttributes);

        let outPort;

        if (outputType === 'object') {

            // Convert to output port options.
            outPort = data.value.map(item => {
                let label = `${item.DisplayName?.UserLocalizedLabel?.Label} (${item.LogicalName})`;
                let value = item.LogicalName;

                if (item.AttributeType === 'Lookup') {
                    value = `_${item.LogicalName}_value`;
                }
                if (!item.DisplayName?.UserLocalizedLabel?.Label) {
                    label = item.LogicalName;
                }

                return { label, value };
            });
        } else if (outputType === 'array') {

            // Extract key, type and title from the response.
            const properties = data.value.reduce((acc, item) => {
                const property = getSchemaProperties(item.LogicalName, item.AttributeType);
                const title = `${item.DisplayName?.UserLocalizedLabel?.Label} (${item.LogicalName})`;

                let key = item.LogicalName;
                if (item.AttributeType === 'Lookup') {
                    key = `_${item.LogicalName}_value`;
                }

                acc[key] = { type: property.type, title };
                return acc;
            }, {});

            outPort = [
                {
                    label: 'Result', value: 'result',
                    schema: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties
                        }
                    }
                }
            ];
        } else {
            throw new context.CancelError('Unsupported output type.');
        }

        // Caching the result. Cached for the same time as the inspector.
        await context.staticCache.set(cacheKey, outPort, context.config?.listOutportCacheTTL || TTL_OUTPORT);

        return outPort;
    } finally {
        lock?.unlock();
    }
}

function getSchemaProperties(logicalName, attributeType) {

    const property = {};

    if (logicalName.startsWith('emailaddress')) {
        property.format = 'email';
    }

    switch (attributeType) {
        case 'Integer':
            property.type = 'number';
            break;
        case 'Boolean':
            property.type = 'boolean';
            break;
        case 'Uniqueidentifier':
            // Must be UUID otherwise the API will return an error:
            // Microsoft.OData.ODataException: Cannot convert the literal 'leadid-leadid' to the expected type 'Edm.Guid'.
            // ---> System.FormatException: Guid should contain 32 digits with 4 dashes (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
            property.type = 'string';
            property.format = 'uuid';
            break;

        default:
            property.type = 'string';
            break;
    }

    return property;
}

function getInspectorType(attributeType) {

    switch (attributeType) {
        case 'Integer':
            return 'number';
        case 'Money':
            return 'number';
        case 'DateTime':
            return 'date-time';
        case 'Boolean':
            return 'toggle';
        case 'Picklist':
        case 'Status':
            return 'select';

        default:
            // Double, Memo, String, Uniqueidentifier
            return 'text';
    }
}

function getGroup(logicalName, requiredLevel) {

    if (logicalName.startsWith('address1_')) {
        return 'address1';
    }
    if (logicalName.startsWith('address2_')) {
        return 'address2';
    }
    if (logicalName.startsWith('address3_')) {
        return 'address3';
    }

    switch (requiredLevel) {
        case 'ApplicationRequired':
        case 'Recommended':
            return 'main';

        default:
            return 'additional';
    }
}

function getGroups(objectName) {

    const groups = {
        main: {
            label: 'Main',
            index: 1
        },
        additional: {
            label: 'Additional',
            index: 2
        }
    };

    switch (objectName) {
        case 'account':
        case 'contact':
            // Contact entity has 3 addresses.
            groups.address3 = {
                label: 'Address 3',
                index: 5
            };
            // No break here.
        case 'lead':
            groups.address1 = {
                label: 'Address 1',
                index: 3
            };
            groups.address2 = {
                label: 'Address 2',
                index: 4
            };
            break;
        case 'campaign':
            // Campaign doesn't have address fields, just use main and additional groups
            break;

        default:
            break;
    }

    return groups;
}

/** Dynamically generates Inspector fields based on selected Entity. */
async function generateInspector(context, isValidFor) {

    const { objectName, rawJson, hideEntitySelection = false } = context.properties;

    // Shared "Object Name" typeahead. `text` (not `select`) so the user can also type any entity
    // logical name manually - the source only suggests the most common entities. See the
    // "List Entities" component for the full list.
    const objectNameInput = {
        label: 'Object Name',
        index: 1,
        type: 'text',
        defaultValue: objectName,
        source: {
            url: '/component/appmixer/microsoft/dynamics/CreateObjectRecord?outPort=out',
            data: {
                properties: {
                    listDefaultEntities: true
                }
            }
        },
        tooltip: 'The suggestions list only the most common entities. You can type any other '
            + 'entity logical name manually, or use the "List Entities" component to fetch the '
            + 'full list and bind its "Logical Name" output here.'
    };

    const required = ['objectName'];
    if (rawJson) {
        required.push('json');
    }
    let defaultSchema = {
        type: 'object',
        properties: {
            objectName: { type: 'string' },
            rawJson: { type: 'boolean' },
            json: { type: 'string' }
        },
        required
    };

    /** Default inspector fields: objectName, rawJson, json. */
    let defaultInputs = {
        objectName: objectNameInput,
        rawJson: {
            type: 'toggle',
            label: 'Input as raw JSON.',
            defaultValue: false,
            tooltip: 'Enable the toggle to set the input to raw JSON.',
            index: 2
        },
        json: {
            type: 'textarea',
            label: 'JSON',
            tooltip: 'The JSON representation of the object to create.',
            when: { eq: { './rawJson': true } },
            index: 3
        }
    };

    // Add ID field when updating an existing record.
    if (isValidFor === 'IsValidForUpdate') {
        defaultSchema.properties.id = { type: 'string' };
        defaultInputs.id = {
            type: 'text',
            label: 'ID',
            tooltip: 'The ID of the object to update.',
            index: 1
        };
        required.push('id');
    }

    // If the action is called with raw JSON input, return the default schema and inputs.
    // In this case there is no need to make API calls. Neither do we need to generate the inspector.
    if (rawJson || !objectName) {
        return { schema: defaultSchema, inputs: defaultInputs };
    }

    if (hideEntitySelection) {
        // Called from another component, eg: CreateLead. In this case we don't want to show the default fields.
        // Remove the default fields from the schema and inputs.
        defaultSchema = _.omit(defaultSchema, ['properties.objectName']);
        // Remove objectName from required.
        defaultSchema.required = _.without(defaultSchema.required, 'objectName');
        defaultInputs = _.omit(defaultInputs, ['objectName']);
    }

    const resource = context.resource || context.auth.resource;
    const cacheKey = 'ms-dynamics-' + resource + '-' + objectName + '-inspector-entitiy-selection-' + hideEntitySelection + '-' + isValidFor;

    let lock;
    try {
        lock = await context.lock(context.flowId, { retryDelay: 500 });

        const inPortCached = await context.staticCache.get(cacheKey);
        if (inPortCached) {
            return inPortCached;
        }

        // Generating inspector for the selected entity using the metadata APIs.
        const { schema, fieldsInputs } = await getSchemaAndInputs(context, defaultSchema, objectName, isValidFor || 'IsValidForCreate');
        const inputs = { ...defaultInputs, ...fieldsInputs };
        const inPort = { schema, inputs, groups: getGroups(objectName) };

        // Caching the inspector for 10 minutes. Primarily to speed up flow loading.
        // Cannot cache the inspector for longer because the metadata can change.
        await context.staticCache.set(cacheKey, inPort, context.config?.listInspectorCacheTTL || TTL_INSPECTOR);

        return inPort;
    } finally {
        lock?.unlock();
    }
}

async function getSchemaAndInputs(context, schema, logicalName, isValidFor) {

    const resource = context.resource || context.auth.resource;
    const headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${context.auth?.accessToken || context.accessToken}`
    };
    const urlPathAttributes = `${resource}/api/data/v9.2/EntityDefinitions(LogicalName='${logicalName}')/Attributes`;

    // Getting the fields from the entity.
    const optionsAttributes = {
        url: `${urlPathAttributes}?$filter=${isValidFor} eq true&$select=LogicalName,AttributeType,${isValidFor},SchemaName,DisplayName,Description,RequiredLevel,IsCustomAttribute`,
        headers
    };

    // Getting the options for picklist fields.
    const urlPickList = `${urlPathAttributes}/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options)`;
    const optionsPickList = {
        url: urlPickList,
        headers
    };

    // Getting the options for statuscode fields.
    const urlStatus = `${urlPathAttributes}/Microsoft.Dynamics.CRM.StatusAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options)`;
    const optionsStatus = {
        url: urlStatus,
        headers
    };

    // Getting targets for Lookup fields.
    const urlLookup = `${urlPathAttributes}/Microsoft.Dynamics.CRM.LookupAttributeMetadata?$select=LogicalName,Targets&$filter=${isValidFor} eq true`;
    const optionsLookup = {
        url: urlLookup,
        headers
    };

    // Getting DateTimeBehavior for DateTime fields.
    const urlDateTimeBehavior = `${urlPathAttributes}/Microsoft.Dynamics.CRM.DateTimeAttributeMetadata?$select=LogicalName,DateTimeBehavior`;
    const optionsDateTimeBehavior = {
        url: urlDateTimeBehavior,
        headers
    };

    // Getting the single-valued navigation property of each lookup's relationship. For a
    // polymorphic lookup (e.g. regardingobjectid) the @odata.bind property is target-specific
    // (regardingobjectid_campaign) — the bare logical name is not a valid navigation property,
    // so the bind is silently dropped and a required "regarding" object ends up missing.
    const urlRelationships = `${resource}/api/data/v9.2/EntityDefinitions(LogicalName='${logicalName}')/ManyToOneRelationships?$select=ReferencingAttribute,ReferencedEntity,ReferencingEntityNavigationPropertyName`;
    const optionsRelationships = {
        url: urlRelationships,
        headers
    };

    // Await for all requests to finish.
    const [
        { data },
        { data: dataPickList },
        { data: dataStatus },
        { data: dataLookup },
        { data: dataDateTimeBehavior },
        { data: dataRelationships }
    ] = await Promise.all([
        context.httpRequest(optionsAttributes),
        context.httpRequest(optionsPickList),
        context.httpRequest(optionsStatus),
        context.httpRequest(optionsLookup),
        context.httpRequest(optionsDateTimeBehavior),
        context.httpRequest(optionsRelationships)
    ]);

    // Map each lookup attribute + referenced entity to its single-valued navigation property,
    // e.g. relationshipNavProps['regardingobjectid']['campaign'] === 'regardingobjectid_campaign'.
    const relationshipNavProps = {};
    for (const rel of dataRelationships?.value || []) {
        const attr = rel.ReferencingAttribute;
        if (!attr) {
            continue;
        }
        if (!relationshipNavProps[attr]) {
            relationshipNavProps[attr] = {};
        }
        relationshipNavProps[attr][rel.ReferencedEntity] = rel.ReferencingEntityNavigationPropertyName;
    }

    let fieldsInputs = {};
    for (let i = 0; i < data.value.length; i++) {
        const item = data.value[i];

        /** Ignored fields. Each entity has different set of fields that are marked as ValidForCreate but are not actually valid
             *  or are difficult to implement. */
        const ignoredLogicalNames = {
            lead: ['entityimage', 'customerid', 'customeridtype', 'ownerid', 'owneridtype'],
            campaign: ['regardingobjectid', 'entityimage']
        };

        if (ignoredLogicalNames[logicalName]?.includes(item.LogicalName)) {
            continue;
        }

        // Field name used in inspector can be different from LogicalName (see Lookup fields).
        let fieldName = item.LogicalName;

        // Use the single-valued navigation property for lookup fields.
        // See: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/create-entity-web-api#associate-table-rows-on-create
        if (item.AttributeType === 'Lookup') {
            // Add Targets array to the item. ListLookupOptions resolves options from Targets[0].
            item.Targets = dataLookup?.value.find(x => x.LogicalName === item.LogicalName)?.Targets;
            const target = Array.isArray(item.Targets) ? item.Targets[0] : undefined;

            // The bind uses the lookup's single-valued navigation property. For a polymorphic
            // lookup (e.g. regardingobjectid) this is target-specific (regardingobjectid_campaign);
            // for a single-target lookup it is usually the logical name. Custom fields fall back to
            // SchemaName (e.g. msdyn_predictivescoreid -> msdyn_PredictiveScoreId). See:
            // https://stackoverflow.com/questions/43970292/an-undeclared-property-when-trying-to-create-record-via-web-api
            const navProperty = (target && relationshipNavProps[item.LogicalName]
                && relationshipNavProps[item.LogicalName][target])
                || (item.IsCustomAttribute ? item.SchemaName : item.LogicalName);

            // Workaround to support Lookup fields with dots in the name (| is restored to . at runtime).
            fieldName = `${navProperty}@odata|bind`;
        }

        // Add to required (non-lookup fields only). Lookup fields are exposed under a
        // target-specific navigation property name (e.g. regardingobjectid_campaign@odata|bind),
        // not their logical name, so requiring the bare logical name produces an unsatisfiable
        // schema. They are also frequently auto-populated by the Web API (transactioncurrencyid,
        // ownerid), and for polymorphic lookups we only expose one target variant — forcing it
        // would wrongly lock the user to that single target. So we never hard-require lookups.
        if (item.RequiredLevel?.Value === 'ApplicationRequired'
            && isValidFor === 'IsValidForCreate'
            && item.AttributeType !== 'Lookup') {
            schema.required.push(fieldName);
        }

        // Add to schema.
        schema.properties[fieldName] = getSchemaProperties(item.LogicalName, item.AttributeType);

        // Add to inspector fields.
        fieldsInputs[fieldName] = getInputs(item, i + 3);

        // Some DateTime fields are DateOnly, see: https://learn.microsoft.com/en-us/dynamics365/sales/developer/entities/lead#BKMK_EstimatedCloseDate
        if (item.AttributeType === 'DateTime') {
            const isDateOnly = dataDateTimeBehavior?.value.find(x => x.LogicalName === item.LogicalName)?.DateTimeBehavior.Value === 'DateOnly';
            if (isDateOnly) {
                fieldsInputs[fieldName].config = {
                    format: 'YYYY-MM-DD',
                    enableTime: false
                };
            }
        }

        // Add options for select. Picklist and Status fields.
        // See: https://www.alphabold.com/using-microsoft-dynamics-crm-api-to-get-status-reason-metadata-option/
        if (item.AttributeType === 'Picklist') {
            fieldsInputs[fieldName].options =
                    dataPickList?.value.find(x => x.LogicalName === item.LogicalName)?.OptionSet?.Options?.map(x => {
                        return { label: x.Label.UserLocalizedLabel.Label, value: String(x.Value) };
                    });
            // Reset option at the top.
            fieldsInputs[fieldName].options.unshift({ clearItem: true, content: '-- Clear selection --' });
        }
        if (item.AttributeType === 'Status') {
            fieldsInputs[fieldName].options =
                    dataStatus?.value.find(x => x.LogicalName === item.LogicalName)?.OptionSet?.Options?.map(x => {
                        return { label: x.Label.UserLocalizedLabel.Label, value: String(x.Value) };
                    });
            // Reset option at the top.
            fieldsInputs[fieldName].options.unshift({ clearItem: true, content: '-- Clear selection --' });
        }
    }

    return { schema, fieldsInputs };
}

function getInputs(item, index) {

    const label = `${item.DisplayName?.UserLocalizedLabel?.Label} (${item.LogicalName})`;
    const tooltip = item.Description?.UserLocalizedLabel?.Label;

    // Lookup fields. Call ListLookupOptions action to get the options.
    if (item.AttributeType === 'Lookup') {
        return {
            index,
            type: 'select',
            source: {
                url: '/component/appmixer/microsoft/dynamics/ListLookupOptions?outPort=out',
                data: {
                    messages: {
                        'in/targets': item.Targets,
                        'in/isSource': true
                    }
                }
            },
            label,
            tooltip,
            group: getGroup(item.LogicalName, item.RequiredLevel?.Value)
        };
    }

    // Non Lookup fields.
    return {
        index,
        type: getInspectorType(item.AttributeType),
        label,
        tooltip,
        group: getGroup(item.LogicalName, item.RequiredLevel?.Value)
    };
}

module.exports = {
    DEFAULT_ENTITIES,
    getOutputPortOptions,
    getSchemaProperties,
    getInspectorType,
    getGroups,
    generateInspector
};
