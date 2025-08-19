const personSchema = {
    id: { type: 'string', title: 'Contact ID' },
    etag: { type: 'string', title: 'ETag' },
    updateTime: { type: 'string', title: 'Update Time' },
    displayName: { type: 'string', title: 'Display Name' },
    givenName: { type: 'string', title: 'First Name' },
    displayNameLastFirst: { type: 'string', title: 'Display Name Last First' },
    unstructuredName: { type: 'string', title: 'Unstructured Name' },
    photoUrl: { type: 'string', title: 'Photo URL' },
    memberships: {
        type: 'array',
        title: 'Memberships',
        items: {
            type: 'object',
            properties: {
                metadata: {
                    type: 'object',
                    properties: {
                        source: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', title: 'Memberships.Metadata.Source.Type' },
                                id: { type: 'string', title: 'Memberships.Metadata.Source.ID' }
                            }
                        }
                    }
                },
                contactGroupMembership: {
                    type: 'object',
                    properties: {
                        contactGroupId: { type: 'string', title: 'Memberships.ContactGroupMembership.Contact Group ID' },
                        contactGroupResourceName: { type: 'string', title: 'Memberships.ContactGroupMembership.Contact Group Resource Name' }
                    }
                }
            }
        }
    }
};

const otherPersonSchema = {
    id: { type: 'string', title: 'Contact ID' },
    etag: { type: 'string', title: 'ETag' },
    updateTime: { type: 'string', title: 'Update Time' },
    photoUrl: { type: 'string', title: 'Photo URL' },
    emailAddresses: {
        type: 'array',
        title: 'Email Addresses',
        items: {
            type: 'object',
            properties: {
                metadata: {
                    type: 'object',
                    properties: {
                        primary: { type: 'boolean', title: 'Email Addresses.Primary' },
                        source: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', title: 'Email Addresses.Source.Type' },
                                id: { type: 'string', title: 'Email Addresses.Source.ID' }
                            }
                        },
                        sourcePrimary: { type: 'boolean', title: 'Email Addresses.Source Primary' }
                    }
                },
                value: { type: 'string', title: 'Email Addresses.Value' }
            }
        }
    }
};

const contactGroupSchema = {
    'id': { 'type': 'string', 'title': 'Contact Group ID' },
    'etag': { 'type': 'string', 'title': 'ETag' },
    'updateTime': { 'type': 'string', 'title': 'Update Time' },
    'groupType': { 'type': 'string', 'title': 'Group Type' },
    'name': { 'type': 'string', 'title': 'Name' },
    'formattedName': { 'type': 'string', 'title': 'Formatted Name' }
};

module.exports = {
    personSchema,
    contactGroupSchema,
    otherPersonSchema
};
