'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {

    async receive(context) {

        const { domain, name } = context.messages.in.content;

        if (!domain) {
            throw new context.CancelError('Company domain is required!');
        }

        const { auth } = context;
        const hs = new Hubspot(auth.accessToken, context.config);

        // Build search filters
        const filters = [{
            propertyName: 'domain',
            operator: 'EQ',
            value: domain
        }];

        // Add name filter if provided
        if (name) {
            filters.push({
                propertyName: 'name',
                operator: 'CONTAINS_TOKEN',
                value: name
            });
        }

        const payload = {
            filterGroups: [{ filters }],
            sorts: [{ propertyName: 'name', direction: 'ASCENDING' }],
            properties: ['domain', 'name', 'numberofemployees', 'industry', 'hs_employee_range'],
            limit: 100
        };

        const { data } = await hs.call('post', 'crm/v3/objects/companies/search', payload);

        const { results = [] } = data;

        // Return empty array if no companies found (graceful handling)
        if (results.length === 0) {
            return context.sendJson({ companies: [], found: false, domain }, 'out');
        }

        // Return found companies
        return context.sendJson({
            companies: results.map(company => ({
                id: company.id,
                domain: company.properties.domain || '',
                name: company.properties.name || '',
                numberofemployees: company.properties.numberofemployees || '',
                industry: company.properties.industry || '',
                hs_employee_range: company.properties.hs_employee_range || ''
            })),
            found: true,
            count: results.length
        }, 'out');
    }
};

