'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'descriptor'],
    properties: {
        id: { type: 'string', title: 'Worker ID', example: '3aa5550b7fe348b98d7b5741afc65534' },
        descriptor: { type: 'string', title: 'Name', example: 'Logan McNeil' },
        workerId: { type: 'string', title: 'Employee ID', example: '21001' },
        prehireId: { type: 'string', title: 'Pre-Hire ID', example: 'APPLICANT-6-151' },
        workerType: {
            type: 'object',
            title: 'Worker Type',
            properties: {
                id: { type: 'string', title: 'Worker Type.ID', example: 'd588c41a446c11de98360015c5e6daf6' },
                descriptor: { type: 'string', title: 'Worker Type.Name', example: 'Employee' },
                href: { type: 'string', title: 'Worker Type.URL', example: 'https://wd2-impl-services1.workday.com/api/staffing/v6/acme/values/workerTypes/d588c41a446c11de98360015c5e6daf6' }
            }
        },
        person: {
            type: 'object',
            title: 'Person',
            properties: {
                id: { type: 'string', title: 'Person.ID', example: '4f1b2c3d4e5f4a6b8c7d9e0f1a2b3c4d' },
                email: { type: 'string', title: 'Person.Email', example: 'lmcneil@workday.net' },
                phone: { type: 'string', title: 'Person.Phone', example: '+1 (925) 951-9000' }
            }
        },
        primaryJob: {
            type: 'object',
            title: 'Primary Job',
            properties: {
                id: { type: 'string', title: 'Primary Job.ID', example: 'a8a5e7f4c5fb4b8e9d0c1f2a3b4c5d6e' },
                descriptor: { type: 'string', title: 'Primary Job.Name', example: 'P-00001 Vice President, Human Resources - Logan McNeil' },
                Position_ID: { type: 'string', title: 'Primary Job.Position ID', example: 'P-00001' },
                businessTitle: { type: 'string', title: 'Primary Job.Business Title', example: 'Vice President, Human Resources' },
                supervisoryOrganization: {
                    type: 'object',
                    title: 'Primary Job.Supervisory Organization',
                    properties: {
                        id: { type: 'string', title: 'Primary Job.Supervisory Organization.ID', example: '0d2d6a1c8e5c4d6b9a6c5e8f2b1a3c4d' },
                        descriptor: { type: 'string', title: 'Primary Job.Supervisory Organization.Name', example: 'Human Resources' },
                        Organization_Reference_ID: { type: 'string', title: 'Primary Job.Supervisory Organization.Reference ID', example: 'SUPERVISORY_Human_Resources' }
                    }
                },
                location: {
                    type: 'object',
                    title: 'Primary Job.Location',
                    properties: {
                        id: { type: 'string', title: 'Primary Job.Location.ID', example: '6cb77610a8a543aea2d6bc10457e35d4' },
                        descriptor: { type: 'string', title: 'Primary Job.Location.Name', example: 'San Francisco' },
                        Location_ID: { type: 'string', title: 'Primary Job.Location.Location ID', example: 'San_Francisco_site' },
                        country: {
                            type: 'object',
                            title: 'Primary Job.Location.Country',
                            properties: {
                                descriptor: { type: 'string', title: 'Primary Job.Location.Country.Name', example: 'United States of America' },
                                'ISO_3166-1_Alpha-3_Code': { type: 'string', title: 'Primary Job.Location.Country.ISO Code', example: 'USA' }
                            }
                        }
                    }
                },
                jobProfile: {
                    type: 'object',
                    title: 'Primary Job.Job Profile',
                    properties: {
                        id: { type: 'string', title: 'Primary Job.Job Profile.ID', example: '5d9b4c1a2e3f4a5b8c7d6e5f4a3b2c1d' },
                        descriptor: { type: 'string', title: 'Primary Job.Job Profile.Name', example: 'Vice President, Human Resources' },
                        Job_Profile_ID: { type: 'string', title: 'Primary Job.Job Profile.Job Profile ID', example: '30000' }
                    }
                },
                jobType: {
                    type: 'object',
                    title: 'Primary Job.Job Type',
                    properties: {
                        descriptor: { type: 'string', title: 'Primary Job.Job Type.Name', example: 'Primary' },
                        Job_Type_Name_ID: { type: 'string', title: 'Primary Job.Job Type.Job Type ID', example: 'Primary' }
                    }
                },
                workSpace: {
                    type: 'object',
                    title: 'Primary Job.Work Space',
                    properties: {
                        id: { type: 'string', title: 'Primary Job.Work Space.ID', example: '7e1f2a3b4c5d4e6f8a9b0c1d2e3f4a5b' },
                        descriptor: { type: 'string', title: 'Primary Job.Work Space.Name', example: 'Floor 3' },
                        Location_ID: { type: 'string', title: 'Primary Job.Work Space.Location ID', example: 'SF_Floor_3' },
                        locationChain: { type: 'string', title: 'Primary Job.Work Space.Location Chain', example: 'San Francisco > Floor 3' }
                    }
                }
            }
        },
        additionalJobs: {
            type: 'array',
            title: 'Additional Jobs',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', title: 'ID', example: 'b9c8d7e6f5a44b3c9d2e1f0a9b8c7d6e' },
                    descriptor: { type: 'string', title: 'Name', example: 'P-00417 HR Consultant - Logan McNeil' },
                    Position_ID: { type: 'string', title: 'Position ID', example: 'P-00417' },
                    businessTitle: { type: 'string', title: 'Business Title', example: 'HR Consultant' }
                }
            },
            example: [{
                id: 'b9c8d7e6f5a44b3c9d2e1f0a9b8c7d6e',
                descriptor: 'P-00417 HR Consultant - Logan McNeil',
                Position_ID: 'P-00417',
                businessTitle: 'HR Consultant'
            }]
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
            search,
            email,
            organizationId,
            locationId,
            includeTerminatedWorkers,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Workers', value: 'result' });
        }

        const records = await lib.listWorkers(context, {
            search,
            email,
            organizationId,
            locationId,
            includeTerminatedWorkers
        });
        if (records.length === 0) {
            return context.sendJson({ search, email, organizationId, locationId }, 'notFound');
        }
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
