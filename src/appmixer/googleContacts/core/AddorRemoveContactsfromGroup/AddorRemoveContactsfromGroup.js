'use strict';

module.exports = {
    async receive(context) {
        const { contactGroupId, addContacts, removeContacts } = context.messages.in.content;

        // https://developers.google.com/people/api/rest/v1/contactGroups.members/modify
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://people.googleapis.com/v1/contactGroups/${contactGroupId}/members:modify`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: {
                resourceNamesToAdd: addContacts?.split(',').map(contactId => 'people/' + contactId),
                resourceNamesToRemove: removeContacts?.split(',').map(contactId => 'people/' + contactId)
            }
        });

        return context.sendJson(data, 'out');
    }
};
