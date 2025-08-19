'use strict';

module.exports = {
    async receive(context) {
        const { contactGroupId, addContacts, removeContacts } = context.messages.in.content;

        if (!contactGroupId) {
            throw new context.CancelError('Contact Group ID is required!');
        }

        const normalize = (ids) => ids?.split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .map(id => id.startsWith('people/') ? id : 'people/' + id);

        // https://developers.google.com/people/api/rest/v1/contactGroups.members/modify
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://people.googleapis.com/v1/contactGroups/${contactGroupId}/members:modify`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: {
                resourceNamesToAdd: normalize(addContacts),
                resourceNamesToRemove: normalize(removeContacts)
            }
        });

        return context.sendJson(data, 'out');
    }
};
