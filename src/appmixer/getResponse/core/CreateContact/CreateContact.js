'use strict';

/**
 * Values of the "Custom Field Value" expression field as an array of strings.
 * The Designer stores the rows as { AND: [{ customFieldValue_item: 'red' }, ...] }.
 * Rows stored with the former default levels ({ OR: [{ AND: [...] }] }) and plain arrays are accepted too.
 * @param {object|Array|string} value
 * @returns {string[]}
 */
function getCustomFieldValues(value) {

    if (value === undefined || value === null || value === '') {
        return [];
    }
    if (Array.isArray(value)) {
        return value.filter(item => item !== undefined && item !== null && item !== '').map(String);
    }
    if (typeof value !== 'object') {
        return [String(value)];
    }

    const groups = Array.isArray(value.OR) ? value.OR : [value];
    return groups
        .flatMap(group => (Array.isArray(group?.AND) ? group.AND : []))
        .map(row => row?.customFieldValue_item)
        .filter(item => item !== undefined && item !== null && item !== '')
        .map(String);
}

module.exports = {
    async receive(context) {
        const {
            email,
            name,
            campaignId,
            dayOfCycle,
            ipAddress,
            note,
            scoring,
            customFieldId,
            customFieldValue,
            tagId
        } = context.messages.in.content;

        // Validate required inputs
        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required!');
        }

        // Build request body
        const body = {
            email,
            campaign: {
                campaignId
            }
        };

        // Add optional fields if provided
        if (name) {
            body.name = name;
        }

        if (dayOfCycle !== undefined && dayOfCycle !== null) {
            body.dayOfCycle = dayOfCycle;
        }

        if (ipAddress) {
            body.ipAddress = ipAddress;
        }

        if (note) {
            body.note = note;
        }

        if (scoring !== undefined && scoring !== null) {
            body.scoring = scoring;
        }

        const customFieldValues = getCustomFieldValues(customFieldValue);
        if (customFieldId && customFieldValues.length) {
            body.customFieldValues = [
                {
                    customFieldId,
                    value: customFieldValues
                }
            ];
        }

        if (tagId) {
            body.tags = [
                {
                    tagId
                }
            ];
        }

        // https://apireference.getresponse.com/#contacts
        // GetResponse returns 202 Accepted with no body — the new contact's URL is
        // in the Location response header (e.g. https://api.getresponse.com/v3/contacts/{contactId}).
        // We extract contactId from that header so the user doesn't need to query for it.
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.getresponse.com/v3/contacts',
            headers: {
                'X-Auth-Token': `api-key ${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: body
        });

        const location = response.headers && (response.headers.location || response.headers.Location);
        const contactId = location ? location.split('/').pop() : null;

        await context.log({
            step: 'created',
            status: response.status,
            location,
            contactId
        });

        return context.sendJson({
            contactId,
            email,
            name: name || null,
            campaignId
        }, 'out');
    }
};
