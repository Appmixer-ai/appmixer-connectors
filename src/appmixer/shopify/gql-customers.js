'use strict';

// Customers on the GraphQL Admin API, returned in the REST customer shape the
// customer components and their users' flows were built on.

const client = require('./graphql-client');

const CUSTOMER_FIELDS = `
    id firstName lastName note tags state taxExempt taxExemptions verifiedEmail multipassIdentifier
    createdAt updatedAt numberOfOrders
    amountSpent { amount currencyCode }
    lastOrder { id name }
    defaultEmailAddress { emailAddress marketingState marketingOptInLevel marketingUpdatedAt }
    defaultPhoneNumber { phoneNumber marketingState marketingOptInLevel marketingUpdatedAt }
    defaultAddress { ${client.ADDRESS_FIELDS} }
    addressesV2(first: 50) { nodes { ${client.ADDRESS_FIELDS} } }`;

const GET_CUSTOMER = `query GetCustomer($id: ID!) {
    customer(id: $id) { ${CUSTOMER_FIELDS} }
}`;

const LIST_CUSTOMERS = `query ListCustomers($first: Int!, $after: String, $query: String, $sortKey: CustomerSortKeys, $reverse: Boolean) {
    customers(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
        nodes { ${CUSTOMER_FIELDS} }
        pageInfo { hasNextPage endCursor }
    }
}`;

const COUNT_CUSTOMERS = `query CountCustomers($query: String) {
    customersCount(query: $query, limit: null) { count }
}`;

const CREATE_CUSTOMER = `mutation CreateCustomer($input: CustomerInput!) {
    customerCreate(input: $input) { customer { id } userErrors { field message } }
}`;

const UPDATE_CUSTOMER = `mutation UpdateCustomer($input: CustomerInput!) {
    customerUpdate(input: $input) { customer { id } userErrors { field message } }
}`;

const DELETE_CUSTOMER = `mutation DeleteCustomer($input: CustomerDeleteInput!) {
    customerDelete(input: $input) { deletedCustomerId userErrors { field message } }
}`;

const CREATE_ADDRESS = `mutation CreateCustomerAddress($customerId: ID!, $address: MailingAddressInput!, $setAsDefault: Boolean) {
    customerAddressCreate(customerId: $customerId, address: $address, setAsDefault: $setAsDefault) {
        address { id } userErrors { field message }
    }
}`;

// REST `order` values of the components → GraphQL sort.
const SORTS = {
    'created_at': 'CREATED_AT',
    'updated_at': 'UPDATED_AT',
    'name': 'NAME',
    'id': 'ID'
};

// Sorts REST search offered that GraphQL has no sort key for; the page is
// fetched by relevance and sorted here.
const LOCAL_SORTS = {
    'total_spent': customer => Number(customer.total_spent) || 0,
    'orders_count': customer => customer.orders_count || 0
};

// Legacy REST metafield value types → metafield definition types.
const METAFIELD_TYPES = {
    'string': 'single_line_text_field',
    'integer': 'number_integer',
    'json_string': 'json'
};

function decimal(value) {

    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(2) : String(value);
}

function consent(contact) {

    if (!contact) return null;
    return {
        state: client.enumValue(contact.marketingState),
        opt_in_level: client.enumValue(contact.marketingOptInLevel),
        consent_updated_at: contact.marketingUpdatedAt || null
    };
}

/**
 * GraphQL Customer → REST customer.
 * @param {object} node
 * @returns {object|null}
 */
function toRestCustomer(node) {

    if (!node) return null;

    const id = client.fromGid(node.id);
    const email = node.defaultEmailAddress || null;
    const phone = node.defaultPhoneNumber || null;
    const defaultAddressId = node.defaultAddress ? node.defaultAddress.id : null;
    const toAddress = address => ({
        ...client.address(address),
        customer_id: id,
        default: address.id === defaultAddressId
    });
    const addresses = ((node.addressesV2 && node.addressesV2.nodes) || []).map(toAddress);

    return {
        id,
        email: email ? email.emailAddress : null,
        first_name: node.firstName,
        last_name: node.lastName,
        phone: phone ? phone.phoneNumber : null,
        state: client.enumValue(node.state),
        note: node.note,
        tags: client.tagString(node.tags),
        currency: node.amountSpent ? node.amountSpent.currencyCode : null,
        orders_count: node.numberOfOrders === undefined || node.numberOfOrders === null
            ? 0
            : Number(node.numberOfOrders),
        total_spent: decimal(node.amountSpent && node.amountSpent.amount),
        last_order_id: node.lastOrder ? client.fromGid(node.lastOrder.id) : null,
        last_order_name: node.lastOrder ? node.lastOrder.name : null,
        accepts_marketing: !!email && email.marketingState === 'SUBSCRIBED',
        accepts_marketing_updated_at: email ? email.marketingUpdatedAt || null : null,
        marketing_opt_in_level: email ? client.enumValue(email.marketingOptInLevel) : null,
        email_marketing_consent: consent(email),
        sms_marketing_consent: consent(phone),
        multipass_identifier: node.multipassIdentifier || null,
        tax_exempt: !!node.taxExempt,
        tax_exemptions: node.taxExemptions || [],
        verified_email: !!node.verifiedEmail,
        addresses,
        default_address: node.defaultAddress ? toAddress(node.defaultAddress) : null,
        created_at: node.createdAt,
        updated_at: node.updatedAt,
        admin_graphql_api_id: node.id
    };
}

/**
 * REST customer payload (Create/Update Customer) → CustomerInput. Only keys
 * present in the payload are sent, so an update leaves the rest untouched.
 * @param {object} payload
 * @returns {object}
 */
function toCustomerInput(payload) {

    const input = {};
    const set = (key, value) => {
        if (value !== undefined && value !== null && value !== '') input[key] = value;
    };

    set('firstName', payload.first_name);
    set('lastName', payload.last_name);
    set('email', payload.email);
    set('phone', payload.phone);
    set('note', payload.note);
    if (payload.tags !== undefined && payload.tags !== null && payload.tags !== '') {
        input.tags = client.tagList(payload.tags);
    }
    if (typeof payload.tax_exempt === 'boolean') {
        input.taxExempt = payload.tax_exempt;
    }
    if (Array.isArray(payload.tax_exemptions) && payload.tax_exemptions.length) {
        input.taxExemptions = payload.tax_exemptions;
    }
    if (typeof payload.accepts_marketing === 'boolean' && payload.email) {
        input.emailMarketingConsent = {
            marketingState: payload.accepts_marketing ? 'SUBSCRIBED' : 'NOT_SUBSCRIBED',
            marketingOptInLevel: 'SINGLE_OPT_IN',
            ...(payload.accepts_marketing_updated_at ? { consentUpdatedAt: payload.accepts_marketing_updated_at } : {})
        };
    }
    if (Array.isArray(payload.metafields) && payload.metafields.length) {
        input.metafields = payload.metafields.map(metafield => ({
            namespace: metafield.namespace,
            key: metafield.key,
            value: metafield.value === undefined || metafield.value === null ? '' : String(metafield.value),
            type: METAFIELD_TYPES[metafield.value_type] || metafield.type || metafield.value_type || 'single_line_text_field'
        }));
    }

    return input;
}

// REST `order: 'updated_at DESC'` / search `order: 'name asc'` → { sortKey, reverse, local }.
function sortFrom(order) {

    if (!order) return {};
    const [field, direction = 'asc'] = String(order).trim().split(/\s+/);
    const reverse = direction.toLowerCase() === 'desc';
    if (SORTS[field]) return { sortKey: SORTS[field], reverse };
    if (LOCAL_SORTS[field]) return { local: LOCAL_SORTS[field], reverse };
    return {};
}

// REST list filters → customer search syntax.
function searchFrom(params) {

    const terms = [];
    if (params.query) terms.push(String(params.query));
    if (params.ids) terms.push(`(${String(params.ids).split(',').map(id => `id:${client.fromGid(id.trim())}`).join(' OR ')})`);
    if (params.since_id) terms.push(`id:>${client.fromGid(params.since_id)}`);
    if (params.created_at_min) terms.push(`created_at:>='${params.created_at_min}'`);
    if (params.created_at_max) terms.push(`created_at:<='${params.created_at_max}'`);
    if (params.updated_at_min) terms.push(`updated_at:>='${params.updated_at_min}'`);
    if (params.updated_at_max) terms.push(`updated_at:<='${params.updated_at_max}'`);
    return terms.length ? terms.join(' AND ') : undefined;
}

module.exports = (run) => {

    async function get(id) {

        const data = await run(GET_CUSTOMER, { id: client.toGid('Customer', id) });
        if (!data.customer) {
            throw new client.ShopifyError(`Customer ${id} not found.`, 404);
        }
        return toRestCustomer(data.customer);
    }

    async function list(params = {}) {

        const sort = sortFrom(params.order);
        // A sort GraphQL cannot do is applied to the page; fetch a full page so
        // the top results are right for result sets up to 250 customers.
        const first = sort.local ? 250 : client.pageSize(params.limit);
        const data = await run(LIST_CUSTOMERS, {
            first,
            after: params.after || null,
            query: searchFrom(params) || null,
            sortKey: sort.sortKey || (sort.local ? (params.query ? 'RELEVANCE' : 'ID') : null),
            reverse: sort.sortKey ? sort.reverse : null
        });

        let customers = data.customers.nodes.map(toRestCustomer);
        let pageInfo = data.customers.pageInfo;
        if (sort.local) {
            customers.sort((a, b) => (sort.local(a) - sort.local(b)) * (sort.reverse ? -1 : 1));
            customers = customers.slice(0, client.pageSize(params.limit));
            pageInfo = null;
        }
        return client.toListResult(customers, pageInfo, params);
    }

    async function createAddresses(customerId, addresses) {

        for (const [index, address] of (addresses || []).entries()) {
            const input = client.addressInput(address);
            // CreateCustomer always sends one address; one that carries only
            // the customer's name is not an address.
            if (!input || !Object.keys(input).some(key => !['firstName', 'lastName', 'phone'].includes(key))) {
                continue;
            }
            const data = await run(CREATE_ADDRESS, { customerId, address: input, setAsDefault: index === 0 });
            client.checkUserErrors(data.customerAddressCreate, 'customerAddressCreate');
        }
    }

    return {

        list,
        get,

        async count(params = {}) {

            const data = await run(COUNT_CUSTOMERS, { query: searchFrom(params) || null });
            return data.customersCount.count;
        },

        // REST customers/search.json: `query` in Shopify search syntax.
        async search(params = {}) {

            return list(params);
        },

        async create(payload = {}) {

            const data = await run(CREATE_CUSTOMER, { input: toCustomerInput(payload) });
            const { customer } = client.checkUserErrors(data.customerCreate, 'customerCreate');
            await createAddresses(customer.id, payload.addresses);
            return get(customer.id);
        },

        async update(id, payload = {}) {

            const input = { ...toCustomerInput(payload), id: client.toGid('Customer', id) };
            const data = await run(UPDATE_CUSTOMER, { input });
            client.checkUserErrors(data.customerUpdate, 'customerUpdate');
            return get(id);
        },

        async delete(id) {

            const data = await run(DELETE_CUSTOMER, { input: { id: client.toGid('Customer', id) } });
            client.checkUserErrors(data.customerDelete, 'customerDelete');
            return {};
        }
    };
};

module.exports.toRestCustomer = toRestCustomer;
module.exports.toCustomerInput = toCustomerInput;
module.exports.CUSTOMER_FIELDS = CUSTOMER_FIELDS;
