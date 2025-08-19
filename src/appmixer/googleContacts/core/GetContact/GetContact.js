'use strict';

module.exports = {
    async receive(context) {
        let { contactId } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required!');
        }
        // Accept either raw id (c123...) or resource name (people/c123...)
        if (typeof contactId === 'string' && contactId.startsWith('people/')) {
            contactId = contactId.split('/')[1];
        }

        // https://developers.google.com/people/api/rest/v1/people/get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://people.googleapis.com/v1/people/${contactId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: {
                personFields: 'addresses,ageRanges,biographies,birthdays,calendarUrls,clientData,coverPhotos,emailAddresses,events,externalIds,genders,imClients,interests,locales,locations,memberships,metadata,miscKeywords,names,nicknames,occupations,organizations,phoneNumbers,photos,relations,sipAddresses,skills,urls,userDefined'
            }
        });

        const betterResponse = {
            id: data.resourceName.split('/')[1],
            etag: data.etag,
            updateTime: data.metadata.sources[0].updateTime,
            displayName: data.names[0].displayName,
            givenName: data.names[0].givenName,
            displayNameLastFirst: data.names[0].displayNameLastFirst,
            unstructuredName: data.names[0].unstructuredName,
            photoUrl: data.photos[0].url,
            memberships: data.memberships
        };

        return context.sendJson(betterResponse, 'out');
    }
};
