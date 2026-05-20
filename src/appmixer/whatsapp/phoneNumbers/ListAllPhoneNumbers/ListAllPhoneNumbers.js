'use strict';

const lib = require('../../lib');

// Graph nested-field query — pulls businesses → owned WABAs → phone numbers
// in one round-trip.
const ME_FIELDS = 'businesses{name,owned_whatsapp_business_accounts{id,phone_numbers{id,display_phone_number,verified_name}}}';

async function fetchAllPhoneNumbers(context) {

    const { data } = await lib.apiRequest(context, {
        method: 'GET',
        path: '/me',
        params: { fields: ME_FIELDS }
    });

    const result = [];
    const businesses = (data.businesses && data.businesses.data) || [];

    for (const business of businesses) {
        const wabas = (business.owned_whatsapp_business_accounts && business.owned_whatsapp_business_accounts.data) || [];
        for (const waba of wabas) {
            const numbers = (waba.phone_numbers && waba.phone_numbers.data) || [];
            for (const num of numbers) {
                result.push({
                    id: num.id,
                    displayPhoneNumber: num.display_phone_number,
                    verifiedName: num.verified_name,
                    wabaId: waba.id,
                    businessId: business.id,
                    businessName: business.name
                });
            }
        }
    }

    return result;
}

module.exports = {

    async receive(context) {

        const phoneNumbers = await fetchAllPhoneNumbers(context);

        return context.sendJson({
            phoneNumbers,
            count: phoneNumbers.length
        }, 'out');
    },

    // Transformer used by other components' dynamic-source dropdowns.
    // Returns the [{ label, value }] shape the inspector expects.
    toSelectArray(out) {

        const phoneNumbers = (out && out.phoneNumbers) || [];

        return phoneNumbers.map((p) => {
            const display = p.displayPhoneNumber || p.id;
            const label = p.verifiedName ? `${display} — ${p.verifiedName}` : display;
            return { label, value: p.id };
        });
    }
};
