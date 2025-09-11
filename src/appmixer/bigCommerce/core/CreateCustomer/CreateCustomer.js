/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const {
            email,
            first_name,
            last_name,
            phone,
            address_street_1,
            address_city,
            address_state,
            address_zip,
            address_country,
            company
        } = context.messages.in.content;

        // Required fields validation
        if (!email) {
            throw new context.CancelError('Email is required!');
        }
        if (!first_name) {
            throw new context.CancelError('First name is required!');
        }
        if (!last_name) {
            throw new context.CancelError('Last name is required!');
        }

        const requestBody = [];
        const customer = { email };

        if (first_name) customer.first_name = first_name;
        if (last_name) customer.last_name = last_name;
        if (phone) customer.phone = phone;
        if (company) customer.company = company;

        // Build addresses array if any address field is provided
        if (address_street_1 || address_city || address_state || address_zip || address_country) {
            // Validate required address fields
            if (!address_street_1) {
                throw new context.CancelError('Address street 1 is required when providing address information!');
            }
            if (!address_city) {
                throw new context.CancelError('Address city is required when providing address information!');
            }
            if (!address_country) {
                throw new context.CancelError('Address country is required when providing address information!');
            }

            customer.addresses = [{
                first_name: first_name,  // Use customer's first_name for address
                last_name: last_name,    // Use customer's last_name for address
                address1: address_street_1,      // Map street_1 to address1
                city: address_city,
                country_code: address_country,   // API requires country_code
                state_or_province: address_state || '', // API requires state_or_province (empty string if not provided)
                postal_code: address_zip || ''   // API requires postal_code (empty string if not provided)
            }];
        }

        requestBody.push(customer);

        // https://developer.bigcommerce.com/api-reference/store-management/customers-v3/customers/createcustomers
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3/customers`,
            headers: {
                'X-Auth-Token': context.auth.accessToken
            },
            data: requestBody
        });

        // Return the first created customer (BigCommerce returns an array)
        const createdCustomer = data.data && data.data[0] ? data.data[0] : data;
        return context.sendJson(createdCustomer, 'out');
    }
};
