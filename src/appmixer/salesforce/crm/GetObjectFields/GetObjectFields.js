const commons = require('../lib');

module.exports = {

    async receive(context) {

        const { objectName, fieldName } = context.messages.in.content;

        const fields = await commons.api.getObjectFields(context, {
            objectName,
            cache: context.properties.variableFetch || false
        });

        if (fieldName) {
            const singleField = fields.find(field => field.name === fieldName);
            if (singleField) {
                return context.sendJson({ fields: [singleField] }, 'out');
            }
        }

        return context.sendJson({ fields }, 'out');
    }
};
