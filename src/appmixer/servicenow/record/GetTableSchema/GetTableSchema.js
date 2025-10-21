'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { tableName } = context.messages.in.content;

        const columns = await lib.getColumns(context, { tableName });

        return context.sendJson(columns, 'out');
    }
};
