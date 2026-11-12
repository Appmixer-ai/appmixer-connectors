'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {

    async receive(context) {

        const {
            fromObjectType,
            fromObjectId,
            toObjectType,
            toObjectId,
            associationTypeId,
            associationCategory = 'HUBSPOT_DEFINED'
        } = context.messages.in.content;

        if (!fromObjectType) {
            throw new context.CancelError('From Object Type is required!');
        }
        if (!fromObjectId) {
            throw new context.CancelError('From Record ID is required!');
        }
        if (!toObjectType) {
            throw new context.CancelError('To Object Type is required!');
        }
        if (!toObjectId) {
            throw new context.CancelError('To Record ID is required!');
        }

        const from = `${encodeURIComponent(fromObjectType)}/${encodeURIComponent(fromObjectId)}`;
        const to = `${encodeURIComponent(toObjectType)}/${encodeURIComponent(toObjectId)}`;
        const hs = new Hubspot(context.auth.accessToken, context.config, context.httpRequest);

        // https://developers.hubspot.com/docs/api-reference/crm-associations-v4/guide
        let typeId = '';
        let category = '';
        if (associationTypeId === undefined || associationTypeId === null || associationTypeId === '') {
            // Default (unlabeled) association.
            await hs.call('put', `crm/v4/objects/${from}/associations/default/${to}`);
        } else {
            typeId = Number(associationTypeId);
            if (!Number.isInteger(typeId)) {
                throw new context.CancelError('Association Type ID must be a whole number.');
            }
            category = associationCategory || 'HUBSPOT_DEFINED';
            await hs.call('put', `crm/v4/objects/${from}/associations/${to}`, [
                { associationCategory: category, associationTypeId: typeId }
            ]);
        }

        return context.sendJson({
            fromObjectType,
            fromObjectId: String(fromObjectId),
            toObjectType,
            toObjectId: String(toObjectId),
            associationCategory: category,
            associationTypeId: typeId === '' ? '' : String(typeId)
        }, 'out');
    }
};
