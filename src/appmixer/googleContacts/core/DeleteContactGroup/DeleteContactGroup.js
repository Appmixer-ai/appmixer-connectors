'use strict';

module.exports = {
    async receive(context) {
        const { groupId } = context.messages.in.content;

        // https://developers.google.com/people/api/rest/v1/contactGroups/delete
        const { data } = await context.httpRequest({
            method: 'DELETE',
            url: `https://people.googleapis.com/v1/contactGroups/${groupId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
