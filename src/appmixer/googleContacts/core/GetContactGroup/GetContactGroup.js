'use strict';

module.exports = {
    async receive(context) {
        const { groupId, maxMembers } = context.messages.in.content;

        // https://developers.google.com/people/api/rest/v1/contactGroups/get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://people.googleapis.com/v1/contactGroups/${groupId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: {
                maxMembers
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
