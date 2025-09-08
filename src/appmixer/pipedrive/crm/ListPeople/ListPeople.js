'use strict';
const commons = require('../../pipedrive-commons');
const searchOutput = require('../../searchOutput');

// Schema for a single person item
const personSchema = {
    id: {
        type: 'number',
        title: 'Person Id'
    },
    name: {
        type: 'string',
        title: 'Person Name'
    },
    first_name: {
        type: 'string',
        title: 'First Name'
    },
    last_name: {
        type: 'string',
        title: 'Last Name'
    },
    owner_id: {
        type: 'number',
        title: 'Owner Id'
    },
    org_id: {
        type: 'number',
        title: 'Org Id'
    },
    add_time: {
        type: 'string',
        title: 'Add Time'
    },
    update_time: {
        type: 'string',
        title: 'Update Time'
    },
    emails: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                value: {
                    type: 'string',
                    title: 'Emails.Value'
                },
                primary: {
                    type: 'boolean',
                    title: 'Emails.Primary'
                },
                label: {
                    type: 'string',
                    title: 'Emails.Label'
                }
            }
        },
        title: 'Emails'
    },
    phones: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                value: {
                    type: 'string',
                    title: 'Phones.Value'
                },
                primary: {
                    type: 'boolean',
                    title: 'Phones.Primary'
                },
                label: {
                    type: 'string',
                    title: 'Phones.Label'
                }
            }
        },
        title: 'Phones'
    },
    is_deleted: {
        type: 'boolean',
        title: 'Is Deleted'
    },
    visible_to: {
        type: 'number',
        title: 'Visible To'
    },
    label_ids: {
        type: 'array',
        items: {
            type: 'number'
        },
        title: 'Label Ids'
    },
    picture_id: {
        type: 'number',
        title: 'Picture Id'
    },
    custom_fields: {
        type: 'object',
        properties: {},
        title: 'Custom Fields'
    },
    notes: {
        type: 'string',
        title: 'Notes'
    },
    im: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                value: {
                    type: 'string',
                    title: 'Im.Value'
                },
                primary: {
                    type: 'boolean',
                    title: 'Im.Primary'
                },
                label: {
                    type: 'string',
                    title: 'Im.Label'
                }
            }
        },
        title: 'Im'
    },
    birthday: {
        type: 'string',
        title: 'Birthday'
    },
    job_title: {
        type: 'string',
        title: 'Job Title'
    },
    postal_address: {
        type: 'object',
        properties: {
            value: {
                type: 'string',
                title: 'Postal Address.Value'
            },
            country: {
                type: 'string',
                title: 'Postal Address.Country'
            },
            admin_area_level_1: {
                type: 'string',
                title: 'Postal Address.Admin Area Level 1'
            },
            admin_area_level_2: {
                type: 'string',
                title: 'Postal Address.Admin Area Level 2'
            },
            locality: {
                type: 'string',
                title: 'Postal Address.Locality'
            },
            sublocality: {
                type: 'string',
                title: 'Postal Address.Sublocality'
            },
            route: {
                type: 'string',
                title: 'Postal Address.Route'
            },
            street_number: {
                type: 'string',
                title: 'Postal Address.Street Number'
            },
            postal_code: {
                type: 'string',
                title: 'Postal Address.Postal Code'
            }
        },
        title: 'Postal Address'
    }
};

/**
 * ListPeople
 * @extends {Component}
 */
module.exports = {

    receive(context) {

        let { filterId, isSource, generateOutputPortOptions, outputType } = context.properties;

        // Generate output port schema dynamically based on the outputType
        if (generateOutputPortOptions) {
            return this.getOutputPortOptions(context, outputType, personSchema, { label: 'Persons' });
        }

        const peopleApi = commons.getPromisifiedClient(context.auth.apiKey, 'Persons');
        const options = {
            'filter_id': filterId,
            'user_id': 0 // list all persons
        };

        return peopleApi.getAllAsync(options)
            .then(response => {
                if (response.success === false) {
                    throw new context.CancelError(response.formattedError);
                }
                if (isSource && Array.isArray(response.data)) {
                    return context.sendJson(response.data.map(person => person.toObject()), 'out');
                }
                return searchOutput.sendArrayOutput({
                    context,
                    outputPortName: 'out',
                    outputType,
                    records: response.data
                });
            });
    },

    getOutputPortOptions(context, outputType, itemSchema, { label }) {

        if (outputType === 'object' || outputType === 'first') {
            const options = Object.keys(itemSchema)
                .reduce((res, field) => {
                    const schema = itemSchema[field];
                    const { title: label, ...schemaWithoutTitle } = schema;

                    res.push({
                        label,
                        value: field,
                        schema: schemaWithoutTitle
                    });
                    return res;
                }, [{
                    label: 'Current Item Index',
                    value: 'index',
                    schema: { type: 'integer' }
                }, {
                    label: 'Items Count',
                    value: 'count',
                    schema: { type: 'integer' }
                }]);

            return context.sendJson(options, 'out');
        }

        if (outputType === 'array') {
            return context.sendJson([{
                label: 'Items Count',
                value: 'count',
                schema: { type: 'integer' }
            }, {
                label: label,
                value: 'records',
                schema: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: itemSchema
                    }
                }
            }], 'out');
        }

        if (outputType === 'file') {
            return context.sendJson([
                { label: 'File ID', value: 'fileId', schema: { type: 'string', format: 'appmixer-file-id' } },
                { label: 'Items Count', value: 'count', schema: { type: 'integer' } }
            ], 'out');
        }
    }
};
