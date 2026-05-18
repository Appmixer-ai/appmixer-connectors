'use strict';

const lib = require('../lib');

module.exports = {

    receive: async function(context) {

        const models = await lib.listModels(context);
        return context.sendJson({ models }, 'out');
    },

    toSelectOptions(out) {
        return out.models.map(model => ({ label: model.id, value: model.id }));
    }
};
