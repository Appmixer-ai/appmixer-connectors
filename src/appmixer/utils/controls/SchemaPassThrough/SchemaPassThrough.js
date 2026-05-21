'use strict';

const SCHEMA_TYPES = ['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'];

module.exports = {

    async receive(context) {

        const { schema: schemaString, data } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return this.generateOutputPortSchema(context, schemaString);
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

    generateOutputPortSchema(context, schemaString) {

        let parsed;
        try {
            parsed = JSON.parse(schemaString);
        } catch (err) {
            return context.sendJson({}, 'out');
        }

        if (this.isJsonSchema(parsed)) {
            return context.sendJson(parsed, 'out');
        }

        const schema = this.inferSchema(parsed);
        if (parsed && typeof parsed === 'object') {
            schema.example = parsed;
        }
        return context.sendJson(schema, 'out');
    },

    isJsonSchema(value) {

        if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
        if (value.$schema) return true;
        if (typeof value.type !== 'string' || !SCHEMA_TYPES.includes(value.type)) return false;
        if (value.type === 'object' && value.properties) return true;
        if (value.type === 'array' && value.items) return true;
        return false;
    },

    inferSchema(value, key) {

        if (value === null) return { type: 'null', title: this.titleFromKey(key) };
        if (Array.isArray(value)) {
            return {
                type: 'array',
                title: this.titleFromKey(key),
                items: value.length > 0 ? this.inferSchema(value[0]) : {}
            };
        }
        if (typeof value === 'object') {
            const properties = {};
            for (const k of Object.keys(value)) {
                properties[k] = this.inferSchema(value[k], k);
            }
            const out = { type: 'object', properties };
            if (key) out.title = this.titleFromKey(key);
            return out;
        }
        switch (typeof value) {
            case 'string': return { type: 'string', title: this.titleFromKey(key) };
            case 'number': return { type: Number.isInteger(value) ? 'integer' : 'number', title: this.titleFromKey(key) };
            case 'boolean': return { type: 'boolean', title: this.titleFromKey(key) };
            default: return {};
        }
    },

    titleFromKey(key) {

        if (!key) return undefined;
        // snake_case / kebab-case / camelCase → Title Case
        return String(key)
            .replace(/[_-]+/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
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
