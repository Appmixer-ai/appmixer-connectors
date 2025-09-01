'use strict';

const lib = require('../../lib.generated');
const { personSchema } = require('../../schemas');

module.exports = {
    async receive(context) {
        const { sortOrder, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, personSchema, { label: 'Connections', value: 'result' });
        }

        // https://developers.google.com/people/api/rest/v1/people/get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://people.googleapis.com/v1/people/me/connections',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: {
                sortOrder,
                personFields: 'addresses,ageRanges,biographies,birthdays,calendarUrls,clientData,coverPhotos,emailAddresses,events,externalIds,genders,imClients,interests,locales,locations,memberships,metadata,miscKeywords,names,nicknames,occupations,organizations,phoneNumbers,photos,relations,sipAddresses,skills,urls,userDefined'
            }
        });

        let records = [];
        if (Array.isArray(data.connections) && data.connections?.length) {
            records = data.connections.map((contact) => {
                return {
                    id: contact.resourceName.split('/')[1] || contact.resourceName,
                    etag: contact.etag,
                    updateTime: contact.metadata?.sources?.[0]?.updateTime || undefined,
                    displayName: contact.names?.[0]?.displayName || undefined,
                    givenName: contact.names?.[0]?.givenName || undefined,
                    displayNameLastFirst: contact.names?.[0]?.displayNameLastFirst || undefined,
                    unstructuredName: contact.names?.[0]?.unstructuredName || undefined,
                    photoUrl: contact.photos?.[0]?.url || undefined,
                    memberships: contact.memberships
                };
            });
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
