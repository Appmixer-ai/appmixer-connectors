'use strict';
const ActiveCampaign = require('../../ActiveCampaign');
const { trimUndefined } = require('../../helpers');

module.exports = {

    async receive(context) {
        if (!context.messages.in.content.contactId) {
            throw new context.CancelError('Contact is required');
        }

        if (!context.messages.in.content.title) {
            throw new context.CancelError('Title is required');
        }

        if (!context.messages.in.content.owner) {
            throw new context.CancelError('Owner is required');
        }

        if (!context.messages.in.content.stage) {
            throw new context.CancelError('Stage is required');
        }

        if (!context.messages.in.content.value) {
            throw new context.CancelError('Deal amount is required');
        }

        if (!context.messages.in.content.currency) {
            throw new context.CancelError('Currency is required');
        }


        const {
            contactId,
            title,
            description,
            value,
            currency,
            owner,
            stage,
            status,
            customFields = {}
        } = context.messages.in.content;

        const { auth } = context;
        const ac = new ActiveCampaign(auth.url, auth.apiKey, context);

        const payload = {
            deal: trimUndefined(
                {
                    contact: contactId,
                    title,
                    description,
                    currency: currency ? currency.toLowerCase() : currency,
                    value: value * 100,
                    owner,
                    stage,
                    status
                }
            )
        };

        const customFieldsValues = customFields.AND || [];
        const fieldValues = [];
        if (customFieldsValues.length > 0) {
            customFieldsValues.forEach(customField => {
                fieldValues.push({ customFieldId: customField.field, fieldValue: customField.value });
            });
            payload.deal.fields = fieldValues;
        }

        const { data } = await ac.call('post', 'deals', payload);

        const { deal } = data;

        const customFieldsPayload = fieldValues.reduce((acc, field) => {
            acc[`customField_${field.customFieldId}`] = field.fieldValue;
            return acc;
        }, {});

        const dealResponseModified = {
            ...deal,
            value: deal.value / 100,
            createdDate: new Date(deal.cdate).toISOString(),
            ...customFieldsPayload
        };

        delete dealResponseModified.cdate;
        delete dealResponseModified.links;

        return context.sendJson(dealResponseModified, 'deal');
    }
};
