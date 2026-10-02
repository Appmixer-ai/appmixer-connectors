const assert = require('assert');
const { ITEM_SCHEMA } = require('../../customers/FindCustomers/FindCustomers');

// The customer port of these components is a static copy of the Find Customers
// item schema; the triggers add the webhook topic. A field added to one place
// only would show up in some variable pickers and not in others.
const STATIC_PORTS = {
    CreateCustomer: [],
    GetCustomer: [],
    UpdateCustomer: [],
    NewCustomer: ['webhookTopic'],
    UpdatedCustomer: ['webhookTopic']
};

describe('Shopify customer output schema', () => {

    it('should export ITEM_SCHEMA as a JSON Schema object', () => {
        assert.strictEqual(ITEM_SCHEMA.type, 'object');
        assert.deepStrictEqual(ITEM_SCHEMA.required, ['id']);
        assert.ok(Object.keys(ITEM_SCHEMA.properties).length > 0);
    });

    for (const [name, extra] of Object.entries(STATIC_PORTS)) {

        it(`should give ${name} the same customer properties as Find Customers`, () => {
            const component = require(`../../customers/${name}/component.json`);
            const port = component.outPorts.find(p => p.name === 'customer');

            assert.strictEqual(port.source, undefined);
            const properties = { ...port.schema.properties };
            for (const key of extra) {
                assert.ok(properties[key], `${name} lacks ${key}`);
                delete properties[key];
            }
            assert.deepStrictEqual(properties, ITEM_SCHEMA.properties);
        });
    }
});
