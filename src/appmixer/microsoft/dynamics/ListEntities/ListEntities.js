'use strict';

const { sendArrayOutput } = require('../../microsoft-commons');

module.exports = {

    async receive(context) {

        const { userFacingOnly = true, outputType } = context.messages.in.content;

        const resource = context.resource || context.auth.resource;
        const url = `${resource}/api/data/v9.2/EntityDefinitions`
            + '?$select=LogicalName,DisplayName,EntitySetName,PrimaryIdAttribute,'
            + 'PrimaryNameAttribute,IsCustomEntity,IsIntersect,IsPrivate,IsLogicalEntity';

        const options = {
            url,
            headers: {
                Authorization: `Bearer ${context.auth?.accessToken || context.accessToken}`,
                accept: 'application/json'
            }
        };

        context.log({ step: 'Making request', options });
        const { data } = await context.httpRequest(options);

        let entities = data.value;

        if (userFacingOnly) {
            // Keep only entities a user would normally work with: drop M:N join tables (IsIntersect),
            // internal entities (IsPrivate), virtual/logical entities (IsLogicalEntity) and entities
            // without a friendly display name (those are system/internal).
            entities = entities.filter(item =>
                !item.IsIntersect
                && !item.IsPrivate
                && !item.IsLogicalEntity
                && item.DisplayName?.UserLocalizedLabel?.Label);
        }

        const records = entities
            .map(item => ({
                logicalName: item.LogicalName,
                displayName: item.DisplayName?.UserLocalizedLabel?.Label || item.LogicalName,
                entitySetName: item.EntitySetName,
                primaryIdAttribute: item.PrimaryIdAttribute,
                primaryNameAttribute: item.PrimaryNameAttribute,
                isCustomEntity: item.IsCustomEntity
            }))
            .sort((a, b) => a.displayName.localeCompare(b.displayName));

        if (records.length === 0) {
            return context.sendJson({ message: 'No entities returned.' }, 'emptyResult');
        }

        return sendArrayOutput({ context, outputType, records });
    }
};
