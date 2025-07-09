'use strict';

module.exports = {
    async receive(context) {
        const { name } = context.messages.in.content;

        // https://developers.google.com/people/api/rest/v1/contactGroups/create
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://people.googleapis.com/v1/contactGroups',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: {
                contactGroup: {
                    name
                }
            }
        });

        const betterResponse = {
            id: data.resourceName.split('/')[1],
            etag: data.etag,
            updateTime: data.metadata.updateTime,
            groupType: data.groupType,
            name: data.name,
            formattedName: data.formattedName
        };

        return context.sendJson(betterResponse, 'out');
    }
};
