'use strict';

const lib = require('../../lib.generated');
const schema = { 'id':{ 'type':'string','title':'Id' },'subject':{ 'type':'string','title':'Subject' },'status':{ 'type':'string','title':'Status' } };

module.exports = {

    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Conversations' });
        }

        let url = 'https://api.intercom.io/conversations';
        let method = 'GET';
        let data = undefined;

        if (query) {
            // For search, use the search endpoint
            url = 'https://api.intercom.io/conversations/search';
            method = 'POST';
            
            // Handle both simple string query and complex query object
            if (typeof query === 'string') {
                data = {
                    query: {
                        operator: 'OR',
                        value: [
                            {
                                field: 'subject',
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
            // https://developers.intercom.com/reference#list-all-conversations
            const response = await context.httpRequest({
                method: method,
                url: url,
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Intercom-Version': '2.14'
                },
                data: data
            });

            const records = response.data.conversations || [];
            return lib.sendArrayOutput({ context, records, outputType });
        } catch (error) {
            // Log the error for debugging
            context.log('error', 'FindConversations API request failed', {
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
