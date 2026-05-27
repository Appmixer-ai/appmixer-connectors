'use strict';

const SCHEMA_TYPES = ['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'];

module.exports = {

    async receive(context) {

        const { schema: schemaString, data } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return this.generateOutputPortOptions(context, schemaString);
        }

        let output;
        if (data !== undefined && data !== null && data !== '') {
            output = typeof data === 'string' ? this.tryParseJson(data) : data;
        } else {
            // No data wired — fall back to the example JSON from the schema field if it
            // wasn't a JSON Schema. Handy for testing the flow before upstream is wired.
            const parsed = this.tryParseJson(schemaString);
            output = this.isJsonSchema(parsed) ? {} : (parsed ?? {});
        }

        return context.sendJson(output, 'out');
    },

    generateOutputPortOptions(context, schemaString) {

        let parsed;
        try {
            parsed = JSON.parse(schemaString);
        } catch (err) {
            return context.sendJson([], 'out');
        }

        const schema = this.isJsonSchema(parsed) ? parsed : this.inferSchema(parsed);
        const options = [];
        this.schemaToOptions(schema, '', options);
        return context.sendJson(options, 'out');
    },

    isJsonSchema(value) {

        if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
        if (value.$schema) return true;
        if (typeof value.type !== 'string' || !SCHEMA_TYPES.includes(value.type)) return false;
        if (value.type === 'object' && value.properties) return true;
        if (value.type === 'array' && value.items) return true;
        return false;
    },

    inferSchema(value) {

        if (value === null) return { type: 'null' };
        if (Array.isArray(value)) {
            return {
                type: 'array',
                items: value.length > 0 ? this.inferSchema(value[0]) : {}
            };
        }
        if (typeof value === 'object') {
            const properties = {};
            for (const k of Object.keys(value)) {
                properties[k] = this.inferSchema(value[k]);
            }
            return { type: 'object', properties };
        }
        switch (typeof value) {
            case 'string': return { type: 'string', example: value };
            case 'number': return { type: Number.isInteger(value) ? 'integer' : 'number', example: value };
            case 'boolean': return { type: 'boolean', example: value };
            default: return {};
        }
    },

    // Mirror engine's createOutPortOptions: flat array with dotted paths,
    // arrays are pushed as one option carrying the full schema, primitives
    // and nested objects get individual entries.
    schemaToOptions(schema, parentPath, options) {

        if (!schema) return;

        if (schema.type === 'array') {
            options.push({
                label: this.titleFromPath(parentPath) || 'Items',
                value: parentPath || 'value',
                schema
            });
            return;
        }

        const properties = schema.properties;
        if (!properties) {
            if (parentPath === '') {
                options.push({
                    label: 'Value',
                    value: 'value',
                    schema
                });
            }
            return;
        }

        Object.keys(properties).forEach(prop => {
            const path = parentPath ? (parentPath + '.' + prop) : prop;
            const propSchema = properties[prop];
            if (propSchema.type !== 'array') {
                const option = { label: this.titleFromPath(path), value: path };
                if (propSchema.type) {
                    // For objects, only expose the type (no `properties`) — children are
                    // covered by separate flat dotted-path entries below; including
                    // `properties` would make the picker render duplicates.
                    option.schema = propSchema.type === 'object'
                        ? { type: 'object' }
                        : { type: propSchema.type, ...(propSchema.example !== undefined ? { example: propSchema.example } : {}) };
                }
                options.push(option);
            }
            this.schemaToOptions(propSchema, path, options);
        });
    },

    titleFromPath(path) {

        if (!path) return '';
        return String(path)
            .split('.')
            .map(seg => seg.charAt(0).toUpperCase() + seg.slice(1))
            .join('.');
    },

    tryParseJson(str) {

        if (typeof str !== 'string') return str;
        try {
            return JSON.parse(str);
        } catch (err) {
            return undefined;
        }
    }
};
