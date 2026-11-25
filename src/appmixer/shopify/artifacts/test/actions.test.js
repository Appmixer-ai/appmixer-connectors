'use strict';

const assert = require('assert');
const ORDER_SCHEMAS = require('../../item-schema-orders.json');
const STORE_SCHEMAS = require('../../item-schema-store.json');
const gqlOrders = require('../../gql-orders');
const gqlStore = require('../../gql-store');
const client = require('../../graphql-client');

const component = path => require(`../../${path}/component.json`);

// A runner answering GraphQL calls by operation name, recording them.
function runner(answers) {

    const calls = [];
    const run = async (query, variables) => {
        const name = query.match(/(?:query|mutation) (\w+)/)[1];
        calls.push({ name, variables });
        if (!answers[name]) throw new Error(`Unexpected ${name}`);
        return answers[name](variables);
    };
    return { run, calls };
}

describe('Shopify action components (4.1)', () => {

    describe('output schemas', () => {

        const ports = {
            'orders/MarkOrderAsPaid': ORDER_SCHEMAS.order,
            'orders/CreateRefund': ORDER_SCHEMAS.refund,
            'orders/CreateFulfillment': ORDER_SCHEMAS.fulfillment,
            'draftorders/CreateDraftOrder': STORE_SCHEMAS.draftOrder,
            'inventory/SetInventoryQuantity': STORE_SCHEMAS.inventoryLevel
        };
        for (const [path, schema] of Object.entries(ports)) {
            it(`should give ${path} the item schema`, () => {
                assert.deepStrictEqual(component(path).outPorts[0].schema, schema);
            });
        }

        for (const path of ['orders/CancelOrder', 'orders/UpdateFulfillmentTracking', 'draftorders/UpdateDraftOrder', 'draftorders/DeleteDraftOrder']) {
            it(`should give ${path} an out port without a schema (emits {})`, () => {
                assert.deepStrictEqual(component(path).outPorts, [{ name: 'out' }]);
            });
        }

        it('should only ask for scopes of the one consent', () => {
            const consent = require('../../core/MakeApiCall/component.json').auth.scope;
            for (const path of Object.keys(ports).concat(['orders/CancelOrder', 'orders/UpdateFulfillmentTracking',
                'draftorders/UpdateDraftOrder', 'draftorders/DeleteDraftOrder'])) {
                for (const scope of component(path).auth.scope) {
                    assert.ok(consent.includes(scope), `${path}: ${scope}`);
                }
            }
        });
    });

    describe('refundLineItems', () => {

        const refundable = [
            { id: 'gid://shopify/LineItem/1', refundableQuantity: 2 },
            { id: 'gid://shopify/LineItem/2', refundableQuantity: 0 }
        ];

        it('should refund everything refundable when no line items are given', () => {
            assert.deepStrictEqual(gqlOrders.refundLineItems([], refundable), [
                { lineItemId: 'gid://shopify/LineItem/1', quantity: 2, restockType: 'NO_RESTOCK' }
            ]);
        });

        it('should take numeric ids, default the quantity and validate the restock type', () => {
            assert.deepStrictEqual(gqlOrders.refundLineItems([{ lineItemId: '1', restockType: 'return' }], refundable), [
                { lineItemId: 'gid://shopify/LineItem/1', quantity: 2, restockType: 'RETURN' }
            ]);
            assert.deepStrictEqual(gqlOrders.refundLineItems([{ lineItemId: 'gid://shopify/LineItem/1', quantity: '1' }], refundable), [
                { lineItemId: 'gid://shopify/LineItem/1', quantity: 1, restockType: 'NO_RESTOCK' }
            ]);
            assert.throws(() => gqlOrders.refundLineItems([{ lineItemId: '9' }], refundable), /not a line item of the order/);
            assert.throws(() => gqlOrders.refundLineItems([{ lineItemId: '1', restockType: 'LATER' }], refundable), /restock type/);
            assert.throws(() => gqlOrders.refundLineItems([{ lineItemId: '1', quantity: 0 }], refundable), /positive whole number/);
        });
    });

    describe('fulfillmentLineItems', () => {

        const fulfillmentOrders = [
            { id: 'gid://shopify/FulfillmentOrder/10', status: 'CLOSED', lineItems: { nodes: [] } },
            { id: 'gid://shopify/FulfillmentOrder/11', status: 'OPEN', lineItems: { nodes: [
                { id: 'gid://shopify/FulfillmentOrderLineItem/21', remainingQuantity: 3, lineItem: { id: 'gid://shopify/LineItem/1' } },
                { id: 'gid://shopify/FulfillmentOrderLineItem/22', remainingQuantity: 1, lineItem: { id: 'gid://shopify/LineItem/2' } }
            ] } }
        ];

        it('should fulfill every open fulfillment order when no line items are given', () => {
            assert.deepStrictEqual(gqlOrders.fulfillmentLineItems(fulfillmentOrders, []), [
                { fulfillmentOrderId: 'gid://shopify/FulfillmentOrder/11' }
            ]);
        });

        it('should map order line items to fulfillment order line items', () => {
            assert.deepStrictEqual(gqlOrders.fulfillmentLineItems(fulfillmentOrders, [{ lineItemId: '1', quantity: 2 }]), [
                { fulfillmentOrderId: 'gid://shopify/FulfillmentOrder/11', fulfillmentOrderLineItems: [
                    { id: 'gid://shopify/FulfillmentOrderLineItem/21', quantity: 2 }
                ] }
            ]);
            assert.throws(() => gqlOrders.fulfillmentLineItems(fulfillmentOrders, [{ lineItemId: '3' }]), /nothing left to fulfill/);
            assert.throws(() => gqlOrders.fulfillmentLineItems([fulfillmentOrders[0]], []),
                /no open fulfillment orders/);
        });

        it('should build the tracking info from the filled fields only', () => {
            const tracking = gqlOrders.trackingInfo({ trackingNumber: ' 1Z ', trackingCompany: 'UPS', trackingUrl: '' });
            assert.deepStrictEqual(tracking, { number: '1Z', company: 'UPS' });
            assert.strictEqual(gqlOrders.trackingInfo({}), undefined);
        });
    });

    describe('Create Draft Order input', () => {

        it('should build DraftOrderInput from the inputs', () => {
            const inputs = {
                lineItems: { ADD: [
                    { itemType: 'variant', variantId: '62788973297745', quantity: '2' },
                    { itemType: 'custom', title: 'Gift wrap', price: 2.5, quantity: 1, taxable: false }
                ] },
                customerId: '27606881304657', email: 'jane@example.com', note: 'Quote', tags: 'b2b, e2e', taxExempt: true,
                shippingCountryCode: 'cz', shippingCity: 'Prague'
            };
            assert.strictEqual(gqlStore.draftNeedsCurrency(inputs), true);
            assert.deepStrictEqual(gqlStore.toDraftOrderInput(inputs, 'USD'), {
                lineItems: [
                    { quantity: 2, variantId: 'gid://shopify/ProductVariant/62788973297745' },
                    { quantity: 1, title: 'Gift wrap', originalUnitPriceWithCurrency: { amount: '2.5', currencyCode: 'USD' }, taxable: false }
                ],
                email: 'jane@example.com', note: 'Quote', tags: ['b2b', 'e2e'],
                purchasingEntity: { customerId: 'gid://shopify/Customer/27606881304657' },
                taxExempt: true,
                shippingAddress: { city: 'Prague', countryCode: 'CZ' }
            });
        });

        it('should leave everything out for an update without changes and reject incomplete items', () => {
            assert.deepStrictEqual(gqlStore.toDraftOrderInput({ id: '1', note: '' }), {});
            assert.throws(() => gqlStore.toDraftOrderInput({ lineItems: [{ itemType: 'custom', price: 1 }] }), /needs a title/);
            assert.throws(() => gqlStore.toDraftOrderInput({ lineItems: [{ itemType: 'variant' }] }), /choose a product variant/);
        });
    });

    describe('Set Inventory Quantity', () => {

        const level = { id: 'gid://shopify/InventoryLevel/5?inventory_item_id=7', item: { variants: { nodes: [] } } };

        it('should track the item, stock it at the primary location and set the quantity', async () => {
            const { run, calls } = runner({
                VariantInventoryItem: () => ({ productVariant: { inventoryItem: { id: 'gid://shopify/InventoryItem/7' } } }),
                InventoryItemLocations: () => ({ inventoryItem: { id: 'gid://shopify/InventoryItem/7', tracked: false, inventoryLevels: { nodes: [] } } }),
                PrimaryLocation: () => ({ location: { id: 'gid://shopify/Location/5' } }),
                TrackInventoryItem: () => ({ inventoryItemUpdate: { userErrors: [] } }),
                ActivateInventory: () => ({ inventoryActivate: { userErrors: [] } }),
                SetInventoryQuantities: () => ({ inventorySetQuantities: { userErrors: [] } }),
                InventoryLevelByItem: () => ({ inventoryItem: { inventoryLevel: level } })
            });
            const result = await gqlStore(run).setInventoryQuantity({
                item: 'gid://shopify/ProductVariant/3', quantity: 7, idempotencyKey: 'k'
            });
            assert.deepStrictEqual(calls.map(call => call.name), ['VariantInventoryItem', 'InventoryItemLocations',
                'PrimaryLocation', 'TrackInventoryItem', 'ActivateInventory', 'SetInventoryQuantities', 'InventoryLevelByItem']);
            assert.deepStrictEqual(calls[5].variables, {
                key: 'k',
                input: { name: 'available', reason: 'correction', quantities: [{
                    inventoryItemId: 'gid://shopify/InventoryItem/7', locationId: 'gid://shopify/Location/5', quantity: 7, changeFromQuantity: null
                }] }
            });
            assert.strictEqual(result.id, level.id);
        });

        it('should use the location the tracked item is stocked at', async () => {
            const { run, calls } = runner({
                InventoryItemLocations: () => ({ inventoryItem: { id: 'gid://shopify/InventoryItem/7', tracked: true,
                    inventoryLevels: { nodes: [{ location: { id: 'gid://shopify/Location/9' } }] } } }),
                SetInventoryQuantities: () => ({ inventorySetQuantities: { userErrors: [] } }),
                InventoryLevelByItem: () => ({ inventoryItem: { inventoryLevel: level } })
            });
            await gqlStore(run).setInventoryQuantity({ item: '7', quantity: 0, name: 'on_hand', idempotencyKey: 'k' });
            assert.deepStrictEqual(calls.map(call => call.name), ['InventoryItemLocations', 'SetInventoryQuantities', 'InventoryLevelByItem']);
            assert.strictEqual(calls[1].variables.input.quantities[0].locationId, 'gid://shopify/Location/9');
            assert.strictEqual(calls[1].variables.input.name, 'on_hand');
        });
    });

    describe('Create Refund', () => {

        it('should refund the suggested payments of every refundable line item', async () => {
            const { run, calls } = runner({
                RefundableLineItems: () => ({ order: { id: 'gid://shopify/Order/1', lineItems: { nodes: [{ id: 'gid://shopify/LineItem/2', refundableQuantity: 1 }] } } }),
                SuggestedRefund: () => ({ order: { suggestedRefund: { suggestedTransactions: [
                    { gateway: 'manual', amountSet: { shopMoney: { amount: '9.99' } }, parentTransaction: { id: 'gid://shopify/OrderTransaction/3' } }
                ] } } }),
                CreateRefund: () => ({ refundCreate: { refund: { id: 'gid://shopify/Refund/4' }, userErrors: [] } }),
                GetRefund: () => ({ refund: { id: 'gid://shopify/Refund/4', refundLineItems: { nodes: [] }, transactions: { nodes: [] }, orderAdjustments: { nodes: [] } } })
            });
            const refund = await gqlOrders(run).createRefund({ orderId: '1', refundPayment: true, note: 'Damaged', idempotencyKey: 'k' });
            assert.strictEqual(refund.id, 'gid://shopify/Refund/4');
            assert.deepStrictEqual(calls[2].variables, { key: 'k', input: {
                orderId: 'gid://shopify/Order/1', notify: false, note: 'Damaged',
                refundLineItems: [{ lineItemId: 'gid://shopify/LineItem/2', quantity: 1, restockType: 'NO_RESTOCK' }],
                transactions: [{ orderId: 'gid://shopify/Order/1', gateway: 'manual', kind: 'REFUND', amount: '9.99', parentId: 'gid://shopify/OrderTransaction/3' }]
            } });
        });
    });

    describe('idempotencyKey', () => {

        it('should give the same message and inputs the same key', () => {
            const context = { componentId: 'c1', messages: { in: { correlationId: 'run-1' } } };
            const key = client.idempotencyKey(context, { quantity: 1 });
            assert.match(key, /^[0-9a-f]{64}$/);
            assert.strictEqual(client.idempotencyKey(context, { quantity: 1 }), key);
            assert.notStrictEqual(client.idempotencyKey(context, { quantity: 2 }), key);
        });
    });
});
