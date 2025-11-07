'use strict';

module.exports = {
    async receive(context) {

        const {
            amountCurrency,
            amountValue,
            orderNumber,
            linesName,
            linesQuantity,
            linesUnitPriceCurrency,
            linesUnitPriceValue,
            linesTotalAmountCurrency,
            linesTotalAmountValue,
            linesVatRate,
            linesVatAmountCurrency,
            linesVatAmountValue,
            billingAddressStreetAndNumber,
            billingAddressPostalCode,
            billingAddressCity,
            billingAddressCountry,
            shippingAddressStreetAndNumber,
            shippingAddressPostalCode,
            shippingAddressCity,
            shippingAddressCountry,
            redirectUrl,
            webhookUrl,
            locale,
            method,
            metadata,
            testmode
        } = context.messages.in.content;

        // Validate required inputs
        if (!amountCurrency) {
            throw new context.CancelError('Amount Currency is required!');
        }
        if (!amountValue) {
            throw new context.CancelError('Amount Value is required!');
        }
        if (!orderNumber) {
            throw new context.CancelError('Order Number is required!');
        }

        // Build the request body
        const data = {
            amount: {
                currency: amountCurrency,
                value: amountValue
            },
            orderNumber: orderNumber
        };

        // Add optional line items if provided
        if (linesName || linesQuantity) {
            data.lines = [{
                name: linesName,
                quantity: linesQuantity,
                unitPrice: {
                    currency: linesUnitPriceCurrency,
                    value: linesUnitPriceValue
                },
                totalAmount: {
                    currency: linesTotalAmountCurrency,
                    value: linesTotalAmountValue
                },
                vatRate: linesVatRate,
                vatAmount: {
                    currency: linesVatAmountCurrency,
                    value: linesVatAmountValue
                }
            }];
        }

        // Add optional billing address if provided
        if (billingAddressStreetAndNumber || billingAddressPostalCode || billingAddressCity || billingAddressCountry) {
            data.billingAddress = {
                streetAndNumber: billingAddressStreetAndNumber,
                postalCode: billingAddressPostalCode,
                city: billingAddressCity,
                country: billingAddressCountry
            };
        }

        // Add optional shipping address if provided
        if (shippingAddressStreetAndNumber || shippingAddressPostalCode || shippingAddressCity || shippingAddressCountry) {
            data.shippingAddress = {
                streetAndNumber: shippingAddressStreetAndNumber,
                postalCode: shippingAddressPostalCode,
                city: shippingAddressCity,
                country: shippingAddressCountry
            };
        }

        // Add optional fields if provided
        if (redirectUrl) {
            data.redirectUrl = redirectUrl;
        }
        if (webhookUrl) {
            data.webhookUrl = webhookUrl;
        }
        if (locale) {
            data.locale = locale;
        }
        if (method) {
            data.method = method;
        }
        if (metadata) {
            data.metadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
        }
        if (testmode !== undefined) {
            data.testmode = testmode;
        }

        // https://docs.mollie.com/reference/v2/orders-api/create-order
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.mollie.com/v2/orders',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            data: data
        });

        return context.sendJson(response.data, 'out');
    }
};
