'use strict';

// CreateContact: Tags and Sales Accounts come from expression inspector fields with levels ["AND"].
// The Designer stores them as { AND: [{ tags_item: 'vip' }] }, the in-port schema types them as object (#1408).

const assert = require('assert');
const component = require('../../core/CreateContact/CreateContact');

function mockContext(content) {

    const context = {
        auth: { domain: 'acme-123.myfreshworks.com/crm/sales', apiKey: 'test-key' },
        messages: { in: { content } },
        requests: [],
        sent: [],
        httpRequest: async (options) => {
            context.requests.push(options);
            return { status: 200, data: { contact: { id: 1, first_name: content.first_name } } };
        },
        sendJson: async (data, port) => context.sent.push({ data, port })
    };
    return context;
}

describe('freshsales.CreateContact', () => {

    it('sends tags and sales accounts from the expression fields', async () => {

        const context = mockContext({
            first_name: 'Jane',
            tags: { AND: [{ tags_item: 'vip' }, { tags_item: ' prospect ' }, { tags_item: '' }] },
            sales_accounts: { AND: [{ sales_accounts_item: '402000012345' }, { sales_accounts_item: '7' }] }
        });

        await component.receive(context);

        const { contact } = context.requests[0].data;
        assert.deepStrictEqual(contact.tags, ['vip', 'prospect']);
        assert.deepStrictEqual(contact.sales_accounts, [
            { id: 402000012345, is_primary: true },
            { id: 7, is_primary: false }
        ]);
        assert.deepStrictEqual(context.sent, [{ data: { id: 1, first_name: 'Jane' }, port: 'out' }]);
    });

    it('accepts plain arrays', async () => {

        const context = mockContext({ first_name: 'Jane', tags: ['vip'], sales_accounts: [12] });

        await component.receive(context);

        const { contact } = context.requests[0].data;
        assert.deepStrictEqual(contact.tags, ['vip']);
        assert.deepStrictEqual(contact.sales_accounts, [{ id: 12, is_primary: true }]);
    });

    it('omits empty fields', async () => {

        const context = mockContext({ first_name: 'Jane', tags: { AND: [{ tags_item: '' }] }, sales_accounts: { AND: [] } });

        await component.receive(context);

        const { contact } = context.requests[0].data;
        assert.strictEqual('tags' in contact, false);
        assert.strictEqual('sales_accounts' in contact, false);
    });
});
