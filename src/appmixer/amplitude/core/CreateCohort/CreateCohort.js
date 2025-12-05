'use strict';

module.exports = {
    async receive(context) {

        const { name, appId, idType, ids, owner, published } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        if (!appId) {
            throw new context.CancelError('App ID is required!');
        }

        if (!idType) {
            throw new context.CancelError('ID Type is required!');
        }

        if (!ids) {
            throw new context.CancelError('IDs is required!');
        }

        if (!owner) {
            throw new context.CancelError('Owner is required!');
        }

        if (published === undefined || published === null) {
            throw new context.CancelError('Published is required!');
        }

        // Parse ids if it's a string (textarea input)
        let idsList;
        if (typeof ids === 'string') {
            idsList = ids.split(',').map(item => item.trim()).filter(item => item);
        } else {
            throw new context.CancelError('IDs must be a list of identifiers!');
        }

        // API expects snake_case parameter names
        const payload = {
            name,
            app_id: appId,
            id_type: idType,
            ids: idsList,
            owner,
            published
        };

        const isEU = context.auth.isEU === 'true';

        const { data } = await context.httpRequest({
            method: 'POST',
            url: isEU ? 'https://analytics.eu.amplitude.com/api/3/cohorts/upload' : 'https://amplitude.com/api/3/cohorts/upload',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(context.auth.apiKey + ':' + context.auth.secretKey).toString('base64')}`
            },
            data: payload
        });

        // The API returns cohort details in cohortsById object keyed by cohort ID
        const cohortId = data.cohortId;
        const cohortDetails = data.cohortsById && data.cohortsById[cohortId] ? data.cohortsById[cohortId] : {};

        const transformedResponse = {
            cohortId,
            ...cohortDetails
        };

        return context.sendJson(transformedResponse, 'out');
    }
};
