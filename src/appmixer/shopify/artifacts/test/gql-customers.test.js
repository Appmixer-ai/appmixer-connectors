const assert = require('assert');
const customers = require('../../gql-customers');

// A customer as the GraphQL Admin API 2026-10 returned it (trimmed).
const NODE = {
    id: 'gid://shopify/Customer/27599103066193',
    firstName: 'Jane',
    lastName: 'Doe',
    note: 'Loyal',
    tags: ['vip', 'wholesale'],
    state: 'ENABLED',
    taxExempt: false,
    taxExemptions: ['EU_REVERSE_CHARGE_EXEMPTION_RULE'],
    verifiedEmail: true,
    multipassIdentifier: null,
    createdAt: '2026-10-02T14:35:54Z',
    updatedAt: '2026-10-02T14:35:55Z',
    numberOfOrders: '3',
    amountSpent: { amount: '199.9', currencyCode: 'USD' },
    lastOrder: { id: 'gid://shopify/Order/450789469', name: '#1001' },
    defaultEmailAddress: { emailAddress: 'jane@example.com', marketingState: 'SUBSCRIBED', marketingOptInLevel: 'SINGLE_OPT_IN', marketingUpdatedAt: '2026-10-02T14:35:54Z' },
    defaultPhoneNumber: { phoneNumber: '+420777123456', marketingState: 'NOT_SUBSCRIBED', marketingOptInLevel: 'SINGLE_OPT_IN', marketingUpdatedAt: null },
    defaultAddress: { id: 'gid://shopify/MailingAddress/38339205005393?model_name=CustomerAddress', firstName: 'Jane', lastName: 'Doe', city: 'Prague', country: 'Czech Republic', countryCodeV2: 'CZ', zip: '170 00', address1: 'Havanska 155' },
    addressesV2: { nodes: [
        { id: 'gid://shopify/MailingAddress/38339205005393?model_name=CustomerAddress', firstName: 'Jane', lastName: 'Doe', city: 'Prague', country: 'Czech Republic', countryCodeV2: 'CZ', zip: '170 00', address1: 'Havanska 155' }
    ] }
};

// Records every GraphQL call and answers from the supplied handler.
function mockRun(handler) {

    const calls = [];
    const run = async (query, variables) => {
        calls.push({ query, variables });
        return handler(query, variables, calls.length - 1);
    };
    return { run, calls };
}

describe('Shopify GraphQL customers', () => {

    describe('toRestCustomer', () => {

        it('should map a GraphQL customer to the REST customer shape', () => {
            const customer = customers.toRestCustomer(NODE);
            assert.strictEqual(customer.id, 27599103066193);
            assert.strictEqual(customer.email, 'jane@example.com');
            assert.strictEqual(customer.first_name, 'Jane');
            assert.strictEqual(customer.phone, '+420777123456');
            assert.strictEqual(customer.state, 'enabled');
            assert.strictEqual(customer.tags, 'vip, wholesale');
            assert.strictEqual(customer.orders_count, 3);
            assert.strictEqual(customer.total_spent, '199.90');
            assert.strictEqual(customer.currency, 'USD');
            assert.strictEqual(customer.last_order_id, 450789469);
            assert.strictEqual(customer.last_order_name, '#1001');
            assert.strictEqual(customer.accepts_marketing, true);
            assert.strictEqual(customer.marketing_opt_in_level, 'single_opt_in');
            assert.deepStrictEqual(customer.email_marketing_consent, { state: 'subscribed', opt_in_level: 'single_opt_in', consent_updated_at: '2026-10-02T14:35:54Z' });
            assert.strictEqual(customer.addresses.length, 1);
            assert.strictEqual(customer.addresses[0].id, 38339205005393);
            assert.strictEqual(customer.addresses[0].customer_id, 27599103066193);
            assert.strictEqual(customer.addresses[0].default, true);
            assert.strictEqual(customer.default_address.country_code, 'CZ');
            assert.strictEqual(customer.admin_graphql_api_id, NODE.id);
        });

        it('should keep every field of the declared customer output port', () => {
            const { ITEM_SCHEMA } = require('../../customers/FindCustomers/FindCustomers');
            const customer = customers.toRestCustomer(NODE);
            for (const key of Object.keys(ITEM_SCHEMA.properties)) {
                assert.ok(key in customer, `missing ${key}`);
            }
        });
    });

    describe('toCustomerInput', () => {

        it('should translate the REST payload of Create Customer', () => {
            const input = customers.toCustomerInput({
                first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', phone: '', verified_email: true,
                accepts_marketing: true, note: '', tags: 'vip, wholesale', tax_exempt: false,
                tax_exemptions: ['EU_REVERSE_CHARGE_EXEMPTION_RULE'],
                metafields: [{ namespace: 'custom', key: 'level', value_type: 'integer', value: 3 }]
            });
            assert.deepStrictEqual(input, {
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane@example.com',
                tags: ['vip', 'wholesale'],
                taxExempt: false,
                taxExemptions: ['EU_REVERSE_CHARGE_EXEMPTION_RULE'],
                emailMarketingConsent: { marketingState: 'SUBSCRIBED', marketingOptInLevel: 'SINGLE_OPT_IN' },
                metafields: [{ namespace: 'custom', key: 'level', value: '3', type: 'number_integer' }]
            });
        });

        it('should leave out what an update does not change', () => {
            assert.deepStrictEqual(customers.toCustomerInput({ note: 'x', accepts_marketing: undefined, tax_exempt: undefined }), { note: 'x' });
        });
    });

    describe('API', () => {

        it('should get a customer by numeric id and answer 404 when it does not exist', async () => {
            const { run, calls } = mockRun((query, variables) => ({ customer: variables.id.endsWith('/1') ? NODE : null }));
            const api = customers(run);

            const customer = await api.get(1);
            assert.strictEqual(calls[0].variables.id, 'gid://shopify/Customer/1');
            assert.strictEqual(customer.email, 'jane@example.com');

            await assert.rejects(() => api.get(2), err => err.statusCode === 404);
        });

        it('should translate list parameters and return the next cursor', async () => {
            const { run, calls } = mockRun(() => ({ customers: { nodes: [NODE], pageInfo: { hasNextPage: true, endCursor: 'c1' } } }));
            const api = customers(run);

            const page = await api.list({ limit: 50, order: 'updated_at DESC', created_at_min: '2026-01-01' });
            assert.deepStrictEqual(calls[0].variables, {
                first: 50, after: null, query: 'created_at:>=\'2026-01-01\'', sortKey: 'UPDATED_AT', reverse: true
            });
            assert.strictEqual(page.length, 1);
            assert.deepStrictEqual(page.nextPageParameters, { limit: 50, order: 'updated_at DESC', created_at_min: '2026-01-01', after: 'c1' });
        });

        it('should sort a search by total spent locally', async () => {
            const cheap = { ...NODE, id: 'gid://shopify/Customer/1', amountSpent: { amount: '5.0', currencyCode: 'USD' } };
            const rich = { ...NODE, id: 'gid://shopify/Customer/2', amountSpent: { amount: '500.0', currencyCode: 'USD' } };
            const page = { customers: { nodes: [cheap, rich], pageInfo: { hasNextPage: false } } };
            const { run, calls } = mockRun(() => page);

            const result = await customers(run).search({ query: 'tag:vip', limit: 1, order: 'total_spent desc' });
            assert.strictEqual(calls[0].variables.sortKey, 'RELEVANCE');
            assert.strictEqual(calls[0].variables.first, 250);
            assert.deepStrictEqual(result.map(customer => customer.id), [2]);
        });

        it('should create the customer, then its address, and return the stored customer', async () => {
            const { run, calls } = mockRun(query => {
                if (query.includes('customerCreate')) return { customerCreate: { customer: { id: NODE.id }, userErrors: [] } };
                if (query.includes('customerAddressCreate')) return { customerAddressCreate: { address: { id: 'a' }, userErrors: [] } };
                return { customer: NODE };
            });

            const customer = await customers(run).create({
                first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com',
                addresses: [{
                    first_name: 'Jane', last_name: 'Doe', phone: '', address1: 'Havanska 155',
                    city: 'Prague', country: 'cz', province: '', zip: '17000'
                }]
            });

            assert.deepStrictEqual(calls[1].variables, {
                customerId: NODE.id,
                address: { firstName: 'Jane', lastName: 'Doe', address1: 'Havanska 155', city: 'Prague', countryCode: 'CZ', zip: '17000' },
                setAsDefault: true
            });
            assert.strictEqual(customer.id, 27599103066193);
        });

        it('should not create an address that carries only the name', async () => {
            const { run, calls } = mockRun(query => query.includes('customerCreate')
                ? { customerCreate: { customer: { id: NODE.id }, userErrors: [] } }
                : { customer: NODE });

            await customers(run).create({ first_name: 'Jane', last_name: 'Doe', addresses: [{ first_name: 'Jane', last_name: 'Doe', address1: '', city: '' }] });
            assert.ok(!calls.some(call => call.query.includes('customerAddressCreate')));
        });

        it('should reject a country name, which GraphQL does not accept', async () => {
            const { run } = mockRun(query => query.includes('customerCreate')
                ? { customerCreate: { customer: { id: NODE.id }, userErrors: [] } }
                : { customer: NODE });

            await assert.rejects(
                () => customers(run).create({ first_name: 'Jane', addresses: [{ address1: 'x', country: 'Czech Republic' }] }),
                err => err.statusCode === 422 && /two-letter ISO code/.test(err.message)
            );
        });

        it('should turn userErrors into a 422', async () => {
            const { run } = mockRun(() => ({ customerCreate: { customer: null, userErrors: [{ field: ['email'], message: 'Email has already been taken' }] } }));

            await assert.rejects(
                () => customers(run).create({ first_name: 'Jane', email: 'jane@example.com' }),
                err => err.statusCode === 422 && /email: Email has already been taken/.test(err.message)
            );
        });

        it('should count and delete by numeric id', async () => {
            const { run, calls } = mockRun(query => query.includes('customersCount')
                ? { customersCount: { count: 14 } }
                : { customerDelete: { deletedCustomerId: NODE.id, userErrors: [] } });
            const api = customers(run);

            assert.strictEqual(await api.count(), 14);
            assert.deepStrictEqual(await api.delete(27599103066193), {});
            assert.deepStrictEqual(calls[1].variables, { input: { id: NODE.id } });
        });
    });
});
