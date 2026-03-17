'use strict';

const api = require('../../api');
const lib = require('../../lib');

const schema = {
    id: { type: 'integer', title: 'Work Item ID' },
    rev: { type: 'integer', title: 'Revision' },
    url: { type: 'string', title: 'API URL' },
    'fields.System.Title': { type: 'string', title: 'Title' },
    'fields.System.State': { type: 'string', title: 'State' },
    'fields.System.WorkItemType': { type: 'string', title: 'Work Item Type' },
    'fields.System.TeamProject': { type: 'string', title: 'Project' },
    'fields.System.AreaPath': { type: 'string', title: 'Area Path' },
    'fields.System.AssignedTo': { type: 'object', title: 'Assigned To' },
    'fields.System.Description': { type: 'string', title: 'Description' },
    'fields.System.Tags': { type: 'string', title: 'Tags' },
    'fields.Microsoft.VSTS.Common.Priority': { type: 'integer', title: 'Priority' },
    'fields.System.CreatedDate': { type: 'string', title: 'Created Date' },
    'fields.System.ChangedDate': { type: 'string', title: 'Changed Date' }
};

module.exports = {

    async receive(context) {

        const { organization, project, wiqlQuery, outputType = 'array' } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Work Items', value: 'result' });
        }

        if (!organization) {
            throw new context.CancelError('Organization is required!');
        }
        if (!project) {
            throw new context.CancelError('Project is required!');
        }
        if (!wiqlQuery) {
            throw new context.CancelError('WIQL Query is required!');
        }

        const data = await api.FindWorkItems.execute(context, { organization, project, wiqlQuery });
        const workItems = data.value || [];

        if (workItems.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: workItems });
    }
};
