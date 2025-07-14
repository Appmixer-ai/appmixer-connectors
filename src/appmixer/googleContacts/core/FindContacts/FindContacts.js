'use strict';

const lib = require('../../lib.generated');
const { personSchema } = require('../../schemas');

module.exports = {
    async receive(context) {
        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, personSchema, { label: 'results', value: 'result' });
        }

        // https://developers.google.com/people/api/rest/v1/people/searchContacts
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://people.googleapis.com/v1/people:searchContacts',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: {
                query,
                sources: 'READ_SOURCE_TYPE_CONTACT',
                readMask: 'addresses,ageRanges,biographies,birthdays,calendarUrls,clientData,coverPhotos,emailAddresses,events,externalIds,genders,imClients,interests,locales,locations,memberships,metadata,miscKeywords,names,nicknames,occupations,organizations,phoneNumbers,photos,relations,sipAddresses,skills,urls,userDefined'
            }
        });

        if (!Array.isArray(data.results) || !data.results.length) {
            return context.sendJson({}, 'notFound');
        }

        const records = data.results.map((contact) => {
            return {
                id: contact.person.resourceName.split('/')[1],
                etag: contact.person.etag,
                updateTime: contact.person.metadata.sources[0].updateTime,
                displayName: contact.person.names[0].displayName,
                givenName: contact.person.names[0].givenName,
                displayNameLastFirst: contact.person.names[0].displayNameLastFirst,
                unstructuredName: contact.person.names[0].unstructuredName,
                photoUrl: contact.person.photos[0].url,
                memberships: contact.person.memberships
            };
        });

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
