'use strict';

const lib = require('../../lib.generated');
const { otherPersonSchema } = require('../../schemas');

module.exports = {
    async receive(context) {
        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, otherPersonSchema, { label: 'Other Contacts', value: 'result' });
        }

        // https://developers.google.com/people/api/rest/v1/otherContacts/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://people.googleapis.com/v1/otherContacts',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: {
                readMask: 'emailAddresses,metadata,names,phoneNumbers,photos'
            }
        });

        let records = [];
        if (Array.isArray(data.otherContacts) && data.otherContacts?.length) {
            records = data.otherContacts.map((contact) => {
                return {
                    id: contact.resourceName.split('/')[1],
                    etag: contact.etag,
                    updateTime: contact.metadata.sources[0].updateTime,
                    photoUrl: contact.photos[0].url,
                    emailAddresses: contact.emailAddresses
                };
            });
        }

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
