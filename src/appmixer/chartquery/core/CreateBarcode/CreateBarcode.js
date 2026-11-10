'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { data, type, format } = context.messages.in.content;

        if (!data) {
            throw new context.CancelError('Data is required!');
        }

        const response = await lib.makeRequest({
            context,
            path: '/v1/barcode',
            params: {
                data: data,
                type: type || 'code128',
                format: format || 'svg',
                share: 'true'
            }
        });

        return context.sendJson(response || {}, 'out');
    }
};
