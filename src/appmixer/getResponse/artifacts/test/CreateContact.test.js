'use strict';

// CreateContact: Custom Field Value comes from an expression inspector field with levels ["AND"].
// The Designer stores it as { AND: [{ customFieldValue_item: 'red' }] }, the in-port schema types it as object (#1408).

const assert = require('assert');
const component = require('../../core/CreateContact/CreateContact');

function mockContext(content) {

    const context = {
        auth: { apiKey: 'test-key' },
        messages: { in: { content } },
        requests: [],
        sent: [],
        CancelError: class CancelError extends Error {},
        log: async () => {},
        httpRequest: async (options) => {
            context.requests.push(options);
            return { status: 202, headers: { location: 'https://api.getresponse.com/v3/contacts/abc123' } };
        },
        sendJson: async (data, port) => context.sent.push({ data, port })
    };
    return context;
}

const base = { email: 'jane@example.com', campaignId: 'cmp1', customFieldId: 'cf1' };

describe('getResponse.CreateContact', () => {

    it('sends the custom field values from the expression field', async () => {

        const context = mockContext({
            ...base,
            customFieldValue: { AND: [{ customFieldValue_item: 'red' }, { customFieldValue_item: 'blue' }] }
        });

        await component.receive(context);

        assert.deepStrictEqual(context.requests[0].data.customFieldValues, [{ customFieldId: 'cf1', value: ['red', 'blue'] }]);
        assert.strictEqual(context.sent[0].data.contactId, 'abc123');
    });

    it('accepts rows stored with the former OR > AND levels', async () => {

        const context = mockContext({
            ...base,
            customFieldValue: { OR: [{ AND: [{ customFieldValue_item: 'red' }] }, { AND: [{ customFieldValue_item: 'green' }] }] }
        });

        await component.receive(context);

        assert.deepStrictEqual(context.requests[0].data.customFieldValues, [{ customFieldId: 'cf1', value: ['red', 'green'] }]);
    });

    it('accepts a plain array and a single string', async () => {

        let context = mockContext({ ...base, customFieldValue: ['red'] });
        await component.receive(context);
        assert.deepStrictEqual(context.requests[0].data.customFieldValues, [{ customFieldId: 'cf1', value: ['red'] }]);

        context = mockContext({ ...base, customFieldValue: 'red' });
        await component.receive(context);
        assert.deepStrictEqual(context.requests[0].data.customFieldValues, [{ customFieldId: 'cf1', value: ['red'] }]);
    });

    it('omits customFieldValues when no value is set', async () => {

        const context = mockContext({ ...base, customFieldValue: { AND: [{ customFieldValue_item: '' }] } });

        await component.receive(context);

        assert.strictEqual('customFieldValues' in context.requests[0].data, false);
    });
});
