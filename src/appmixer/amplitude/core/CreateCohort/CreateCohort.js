'use strict';

module.exports = {
    async receive(context) {

        const { name, description, id_type, members, action } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        if (!id_type) {
            throw new context.CancelError('Id Type is required!');
        }

        if (!members) {
            throw new context.CancelError('Members is required!');
        }

        if (!action) {
            throw new context.CancelError('Action is required!');
        }

        // Parse members if it's a string (textarea input)
        let membersList;
        if (typeof members === 'string') {
            membersList = members.split('\n').filter(item => item.trim());
        } else if (Array.isArray(members)) {
            membersList = members;
        } else {
            throw new context.CancelError('Members must be a list of identifiers!');
        }

        // https://developers.amplitude.com/docs/behavioral-cohorts-api#upload-cohort
        const payload = {
            name,
            [id_type]: membersList,
            action
        };

        if (description) {
            payload.description = description;
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://amplitude.com/api/3/cohorts/upload',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(context.auth.apiKey + ':' + context.auth.secretKey).toString('base64')}`
            },
            data: payload
        });

        return context.sendJson(data, 'out');
    }
};
