'use strict';

const lib = require('../../lib');

const schema = {
  'campaign_id': { 'type': 'string', 'title': 'Campaign Id' },
  'name': { 'type': 'string', 'title': 'Name' },
  'status': { 'type': 'string', 'title': 'Status' },
  'created_at': { 'type': 'string', 'title': 'Created At' },
  'updated_at': { 'type': 'string', 'title': 'Updated At' }
};

module.exports = {
  async receive(context) {

    const { name, status, updatedAfter, outputType } = context.messages.in.content;

    if (context.properties.generateOutputPortOptions) {
      return lib.getOutputPortOptions(context, outputType, schema, { label: 'Campaigns', value: 'campaigns' });
    }

    // https://v3.developer.constantcontact.com/api_reference/index.html#!/Email_Campaigns/listEmailCampaigns
    const params = {};

    if (name) {
      params.name = name;
    }

    if (status) {
      params.status = status;
    }

    if (updatedAfter) {
      params.updated_after = updatedAfter;
    }

    const { data } = await context.httpRequest({
      method: 'GET',
      url: 'https://api.cc.email/v3/email_campaigns',
      headers: {
        'Authorization': `Bearer ${context.auth.accessToken}`
      },
      params
    });

    const records = data.campaigns || [];

    if (records.length === 0) {
      return context.sendJson({}, 'notFound');
    }

    return lib.sendArrayOutput({ context, records, outputType });
  }
};
