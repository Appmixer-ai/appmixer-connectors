'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'company_id':{ 'type':'string','title':'Company Id' },'name':{ 'type':'string','title':'Name' },'custom_attributes':{ 'type':'object','properties':{},'title':'Custom Attributes' } };

module.exports = {

    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Companies' });
        }

        let url = 'https://api.intercom.io/companies';
        let method = 'GET';
        let data = undefined;

        if (query) {
            // For search, use the search endpoint
            url = 'https://api.intercom.io/companies/search';
            method = 'POST';
            
            // Handle both simple string query and complex query object
            if (typeof query === 'string') {
                data = {
                    query: {
                        operator: 'OR',
                        value: [
                            {
                                field: 'name',
                                operator: '~',
                                value: query
                            },
                            {
                                field: 'company_id',
                                operator: '~',
                                value: query
                            }
                        ]
                    }
                };
            } else {
                // Handle structured query object
                data = {
                    query: query
                };
            }
        }

        try {
            // https://developers.intercom.com/reference#list-all-companies
            const response = await context.httpRequest({
                method: method,
                url: url,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Content-Type': 'application/json',
                    'Intercom-Version': '2.14'
                },
                data: data
            });

            const records = response.data.data || [];
            return lib.sendArrayOutput({ context, records, outputType });
        } catch (error) {
            // Log the error for debugging
            context.log('error', 'FindCompanies API request failed', { 
                error: error.message, 
                status: error.response?.status,
                data: error.response?.data,
                url: url,
                method: method,
                queryData: data
            });
            throw error;
        }
    }
};