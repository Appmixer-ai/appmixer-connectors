'use strict';
const { XMLBuilder } = require('fast-xml-parser');

function parseInputJSON(context, jsonString) {
    try {
        return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    } catch (e) {
        throw new context.CancelError(`The input JSON is invalid: ${jsonString}`);
    }
}

module.exports = {

    async receive(context) {

        const {
            json,
            arrayNodeName,
            attributeNamePrefix,
            attributesGroupName,
            cdataPropName,
            commentPropName,
            format,
            ignoreAttributes,
            indentBy,
            preserveOrder,
            processEntities,
            stopNodes,
            suppressBooleanAttributes,
            suppressEmptyNode,
            suppressUnpairedNode,
            textNodeName,
            unpairedTags
        } = context.messages.in.content;

        const options = {
            arrayNodeName,
            attributeNamePrefix,
            attributesGroupName,
            cdataPropName,
            commentPropName,
            format,
            ignoreAttributes,
            indentBy: format ? (indentBy != null ? ' '.repeat(indentBy) : '  ') : undefined,
            preserveOrder,
            processEntities,
            stopNodes: (stopNodes || '').split(',').map(path => path.trim()),
            suppressBooleanAttributes,
            suppressEmptyNode,
            suppressUnpairedNode,
            textNodeName: textNodeName || '',
            unpairedTags: (unpairedTags || '').split(',').map(tag => tag.trim())
        };

        const builder = new XMLBuilder(options);

        const input = parseInputJSON(context, json);
        if (input === null || input === undefined) {
            // An unset or null JSON input gives an empty XML. fast-xml-parser 5.12.0 throws a
            // TypeError on it, where 5.7.3 returned ''.
            return context.sendJson({ xml: '' }, 'out');
        }

        const xml = builder.build(input);

        return context.sendJson({ xml }, 'out');
    }
};
