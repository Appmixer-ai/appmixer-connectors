const commons = require('../lib');

module.exports = {

    async receive(context) {

        const {
            id,
            objectName
        } = context.messages.in.content;

        const { data } = await commons.api.salesForceRq(context, {
            action: `sobjects/${objectName}/${id}`
        });

        return context.sendJson(data, 'out');
    }
};

