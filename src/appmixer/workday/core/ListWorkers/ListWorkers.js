'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'descriptor'],
    properties: {
        id: { type: 'string', title: 'Worker ID', example: '3aa5550b7fe348b98d7b5741afc65534' },
        descriptor: { type: 'string', title: 'Name', example: 'Logan McNeil' },
        href: { type: 'string', title: 'URL', example: 'https://wd2-impl-services1.workday.com/api/common/v1/acme/workers/3aa5550b7fe348b98d7b5741afc65534' },
        workerId: { type: 'string', title: 'Employee ID', example: '21001' },
        businessTitle: { type: 'string', title: 'Business Title', example: 'Vice President, Human Resources' },
        isManager: { type: 'boolean', title: 'Is Manager', example: true },
        primaryWorkEmail: { type: 'string', title: 'Primary Work Email', example: 'lmcneil@workday.net' },
        primaryWorkPhone: { type: 'string', title: 'Primary Work Phone', example: '+1 (925) 951-9000' },
        primarySupervisoryOrganization: {
            type: 'object',
            title: 'Primary Supervisory Organization',
            properties: {
                id: { type: 'string', title: 'Primary Supervisory Organization.ID', example: '0d2d6a1c8e5c4d6b9a6c5e8f2b1a3c4d' },
                descriptor: { type: 'string', title: 'Primary Supervisory Organization.Name', example: 'Human Resources' },
                href: { type: 'string', title: 'Primary Supervisory Organization.URL', example: 'https://wd2-impl-services1.workday.com/api/common/v1/acme/supervisoryOrganizations/0d2d6a1c8e5c4d6b9a6c5e8f2b1a3c4d' }
            }
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Workers', value: 'result' });
        }

        const { data } = await lib.getCollection(context, '/workers');
        return lib.sendArrayOutput({ context, records: data, outputType });
    }
};
