'use strict';
const { trimUndefined } = require('../../helpers');
const ActiveCampaign = require('../../ActiveCampaign');

module.exports = {

    async receive(context) {
        if (!context.messages.in.content.email) {
            throw new context.CancelError('Email is required');
        }

        if (!context.messages.in.content.firstName) {
            throw new context.CancelError('First name is required');
        }

        if (!context.messages.in.content.lastName) {
            throw new context.CancelError('Last name is required');
        }

        if (!context.messages.in.content.phone) {
            throw new context.CancelError('Phone is required');
        }


        const {
            email,
            firstName,
            lastName,
            phone,
            customFields = {}
        } = context.messages.in.content;

        const { auth } = context;
        const ac = new ActiveCampaign(auth.url, auth.apiKey, context);

        const payload = {
            contact: trimUndefined(
                {
                    email,
                    firstName,
                    lastName,
                    phone
                }
            )
        };

        const customFieldsValues = customFields.AND || [];
        const fieldValues = [];
        if (customFieldsValues.length > 0) {
            customFieldsValues.forEach(customField => {
                fieldValues.push({ field: customField.field, value: customField.value });
            });
            payload.contact.fieldValues = fieldValues;
        }

        const { data } = await ac.call('post', 'contacts', payload);
        const { contact } = data;

        const customFieldsPayload = fieldValues.reduce((acc, field) => {
            acc[`customField_${field.field}`] = field.value;
            return acc;
        }, {});

        const contactResponseModified = {
            ...contact,
            createdDate: new Date(contact.cdate).toISOString(),
            ...customFieldsPayload
        };

        delete contactResponseModified.cdate;
        delete contactResponseModified.links;

        return context.sendJson(contactResponseModified, 'contact');
    }
};
