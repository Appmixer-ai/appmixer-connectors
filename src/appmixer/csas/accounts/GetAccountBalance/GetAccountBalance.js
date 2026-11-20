'use strict';

const lib = require('../../lib');

// Preferred balance type for the top-level fields: closing available balance.
const PRIMARY_BALANCE_TYPE = 'CLAV';

const balanceType = (balance) => {
    const type = balance && balance.type;
    if (!type) return undefined;
    if (typeof type === 'string') return type;
    const codeOrProprietary = type.codeOrProprietary || {};
    return codeOrProprietary.code || codeOrProprietary.proprietary || undefined;
};

// GET /my/accounts/{id}/balance answers { balances: [...] }; the Erste sandbox wraps the
// list once more ({ balances: [{ balances: [...] }] }). Both shapes are flattened.
function flattenBalances(data) {
    const items = Array.isArray(data && data.balances) ? data.balances : [];
    return items.reduce((res, item) => {
        if (item && Array.isArray(item.balances)) {
            res.push(...item.balances);
        } else if (item) {
            res.push(item);
        }
        return res;
    }, []);
}

module.exports = {

    flattenBalances,

    async receive(context) {

        const { accountId } = context.messages.in.content;

        if (!accountId) {
            throw new context.CancelError('Account ID is required!');
        }

        const data = await lib.apiRequest(context, '/my/accounts/' + encodeURIComponent(accountId) + '/balance');
        const balances = flattenBalances(data);

        if (balances.length === 0) {
            throw new context.CancelError(`Česká spořitelna returned no balance for account ${accountId}.`);
        }

        const primary = balances.find(balance => balanceType(balance) === PRIMARY_BALANCE_TYPE) || balances[0];
        const date = primary.date || {};

        return context.sendJson({
            accountId,
            type: balanceType(primary),
            amount: primary.amount,
            creditDebitIndicator: primary.creditDebitIndicator,
            dateTime: date.dateTime || date.date,
            balances
        }, 'out');
    }
};
