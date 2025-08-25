'use strict';

module.exports = {
    async receive(context) {
        const { firstName, familyName, emails, phones, notes } = context.messages.in.content;

        if (!firstName) {
            throw new context.CancelError('First name is required!');
        }

        const emailAddresses = emails?.ADD.map(email => ({
            value: email.value,
            displayName: email.displayName ?? undefined,
            type: email.type ?? undefined
        }));

        const phoneNumbers = phones?.ADD.map(phone => ({
            value: phone.value,
            type: phone.type ?? undefined
        }));

        // https://developers.google.com/people/api/rest/v1/people/createContact
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://people.googleapis.com/v1/people:createContact',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: {
                personFields: 'addresses,ageRanges,biographies,birthdays,calendarUrls,clientData,coverPhotos,emailAddresses,events,externalIds,genders,imClients,interests,locales,locations,memberships,metadata,miscKeywords,names,nicknames,occupations,organizations,phoneNumbers,photos,relations,sipAddresses,skills,urls,userDefined'
            },
            data: {
                names: [
                    { givenName: firstName, familyName }
                ],
                biographies: [
                    { contentType: 'TEXT_PLAIN', value: notes }
                ],
                emailAddresses, phoneNumbers
            }
        });

        const betterResponse = {
            id: data.resourceName.split('/')[1] || data.resourceName,
            etag: data.etag,
            updateTime: data.metadata?.sources?.[0]?.updateTime || undefined,
            displayName: data.names?.[0]?.displayName || undefined,
            givenName: data.names?.[0]?.givenName || undefined,
            displayNameLastFirst: data.names?.[0]?.displayNameLastFirst || undefined,
            unstructuredName: data.names?.[0]?.unstructuredName || undefined,
            photoUrl: data.photos?.[0]?.url || undefined,
            memberships: data.memberships
        };

        return context.sendJson(betterResponse, 'out');
    }
};
