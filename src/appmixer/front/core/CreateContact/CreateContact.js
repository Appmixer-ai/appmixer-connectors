
'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const {
            name,
            description,
            avatar_url,
            is_spammer,
            links,
            handles,
            groups,
            custom_fields
        } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required.');
        }

        const contactData = { name };

        if (description) contactData.description = description;
        if (avatar_url) contactData.avatar_url = avatar_url;
        if (typeof is_spammer === 'boolean') contactData.is_spammer = is_spammer;
        if (links && Array.isArray(links)) contactData.links = links;
        if (handles && Array.isArray(handles)) contactData.handles = handles;
        if (groups && Array.isArray(groups)) contactData.group_names = groups;
        if (custom_fields && typeof custom_fields === 'object') contactData.custom_fields = custom_fields;

        // https://dev.frontapp.com/reference
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api2.frontapp.com/contacts',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: contactData
        });

        return context.sendJson(data, 'out');
    }
};
