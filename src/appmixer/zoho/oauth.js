'use strict';

// Zoho's token endpoint answers with HTTP 200 even when it refuses the request: the body then
// carries `{ error: 'invalid_code' }` and no `access_token`. Reading the token straight out of
// such a body stores `undefined` as the access token and an Invalid Date as its expiry, so the
// account keeps looking connected while every later call fails somewhere else entirely — the
// component reports "Access token not found" and nothing ever names the refusal.
//
// Seen on 2026-09-21: two accounts stopped working about an hour after being connected (the life
// of one access token) and `POST /accounts/<id>/test` answered a bare `{"ok":false}`.
//
// Documented reasons Zoho refuses a refresh, all of which look identical from the outside:
//   * the account has no refresh token — Zoho issues one only when the consent screen is really
//     shown, so a reconnect without `prompt=consent` yields an access token alone;
//   * the OAuth client belongs to a different data center — a `.com` client secret sent to
//     accounts.zoho.eu answers `invalid_code`;
//   * the refresh token was revoked, or the user has more than the allowed number of them.

const DEFAULT_EXPIRES_IN_SECONDS = 3600;

/**
 * Reads a Zoho token response, failing loudly when it is a refusal.
 * @param {Object} data Body of the token endpoint response.
 * @param {string} action What was attempted, for the error message.
 * @returns {Object} The same body, once it is known to carry a token.
 */
const assertTokenResponse = (data, action) => {

    if (!data || data.error) {
        throw new Error(
            `Zoho refused to ${action}: ${(data && data.error) || 'empty response'}. ` +
            'Reconnect the account. If it keeps happening, check that the OAuth client of the ' +
            "account's data center is used — a .com client secret sent to accounts.zoho.eu is " +
            'answered with invalid_code.'
        );
    }

    if (!data.access_token) {
        throw new Error(`Zoho returned no access token when asked to ${action}.`);
    }

    return data;
};

/**
 * Expiry of a freshly issued access token. Zoho states the lifetime in `expires_in` seconds;
 * an absent value would otherwise produce an Invalid Date that never looks expired.
 * @param {Object} data Body of the token endpoint response.
 * @returns {Date}
 */
const accessTokenExpDate = data => {

    const seconds = Number(data.expires_in);
    const date = new Date();
    date.setSeconds(date.getSeconds() + (Number.isFinite(seconds) ? seconds : DEFAULT_EXPIRES_IN_SECONDS));
    return date;
};

/**
 * Guards the refresh path before it builds a request out of a missing token.
 * @param {string} [refreshToken]
 */
const assertRefreshToken = refreshToken => {

    if (!refreshToken) {
        throw new Error(
            'This Zoho account has no refresh token, so it stops working about an hour after it ' +
            'was connected. Zoho issues one only when the consent screen is shown — reconnect the ' +
            'account, and make sure the authorization asks for consent (prompt=consent).'
        );
    }
};

module.exports = {
    assertTokenResponse,
    assertRefreshToken,
    accessTokenExpDate
};
