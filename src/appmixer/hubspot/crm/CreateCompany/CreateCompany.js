'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {

    async receive(context) {

        const {
            domain,
            name,
            clearbit_company_name, // eslint-disable-line camelcase
            numberofemployees,
            hs_employee_range, // eslint-disable-line camelcase
            industry,
            clearbit_company_sector, // eslint-disable-line camelcase
            clearbit_company_industry_group, // eslint-disable-line camelcase
            clearbit_company_sub_industry, // eslint-disable-line camelcase
            last_pageview_at, // eslint-disable-line camelcase
            pageviews_current_day, // eslint-disable-line camelcase
            pageviews_current_month, // eslint-disable-line camelcase
            pageviews_current_week, // eslint-disable-line camelcase
            change_pageviews_week_over_week // eslint-disable-line camelcase
        } = context.messages.in.content;

        if (!domain) {
            throw new Error('Company domain is required');
        }

        const { auth } = context;
        const hs = new Hubspot(auth.accessToken, context.config);

        // Support for additional properties (for flexibility)
        const additionalPropertiesArray = context.messages.in.content.additionalProperties?.AND || [];
        const additionalProperties = additionalPropertiesArray.reduce((acc, field) => {
            acc[field.name] = field.value;
            return acc;
        }, {});

        /* eslint-disable camelcase */
        const payload = {
            properties: {
                domain: domain,
                name: name || clearbit_company_name || '',
                clearbit_company_name: clearbit_company_name || name || '',
                numberofemployees: numberofemployees || '',
                hs_employee_range: hs_employee_range || '',
                industry: industry || '',
                clearbit_company_sector: clearbit_company_sector || '',
                clearbit_company_industry_group: clearbit_company_industry_group || '',
                clearbit_company_sub_industry: clearbit_company_sub_industry || '',
                last_pageview_at: last_pageview_at || '',
                pageviews_current_day: pageviews_current_day || '',
                pageviews_current_month: pageviews_current_month || '',
                pageviews_current_week: pageviews_current_week || '',
                change_pageviews_week_over_week: change_pageviews_week_over_week || '',
                ...additionalProperties
            }
        };
        /* eslint-enable camelcase */

        const { data } = await hs.call('post', 'crm/v3/objects/companies', payload);

        return context.sendJson({
            id: data.id,
            domain: data.properties.domain || '',
            name: data.properties.name || '',
            clearbit_company_name: data.properties.clearbit_company_name || '',
            numberofemployees: data.properties.numberofemployees || '',
            hs_employee_range: data.properties.hs_employee_range || '',
            industry: data.properties.industry || '',
            clearbit_company_sector: data.properties.clearbit_company_sector || '',
            clearbit_company_industry_group: data.properties.clearbit_company_industry_group || '',
            clearbit_company_sub_industry: data.properties.clearbit_company_sub_industry || '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        }, 'out');
    }
};

