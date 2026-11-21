'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { datasourceId } = context.messages.in.content;

        if (!datasourceId) {
            throw new context.CancelError('Data Source ID is required!');
        }

        const { data } = await lib.apiRequest(context, { path: '/datasources/' + lib.encodeId(datasourceId) });

        return context.sendJson(lib.mapDataSource(data.datasource), 'out');
    }
};
