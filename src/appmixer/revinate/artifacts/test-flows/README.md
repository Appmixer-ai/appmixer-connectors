# Revinate E2E test flows

**None of these flows has been run.** They pass `appmixer e2e validate`, and that is all.
Revinate has no sandbox and no self-service credentials: API access is issued per customer
by Revinate, and no test account existed when the connector was built. Treat the flows as
prepared, not as proof.

## What a run needs

The two modules use two separate accounts. A hotel may have only one of them.

### Revinate Reputation (Porter API)

- A Revinate customer account with Reputation, ideally also Guest Feedback (surveys).
- A Porter API key and API secret, requested from the Revinate account manager or sales
  representative.
- The username (e-mail address) of a Revinate user who has access to that API key and to
  at least one hotel.
- For the flows to pass: a hotel with reviews in the last 90 days, a competitor set with
  reviews, guest surveys and sentiment data.

### Revinate Guest Data (CDP API)

- CDP API access enabled by Revinate for the account.
- A Client ID and a Client Secret, and a Revinate Account ID the credentials are
  authorized for.
- For the flows to pass: at least one Rich Guest Profile and one reservation in that
  account.

Store them with `creds set revinate ...` in appmixer-test-credentials and connect both
accounts on the test instance before importing the flows.

## The flows

### test-flow-reputation-reviews.json

- Covers Find Reviews, Get Review and Make API Call (Reputation).
- Read-only. Takes the first review Find Reviews returns.

### test-flow-reputation-hotels.json

- Covers Find Hotels, Get Hotel, Find Reviews of one hotel, Find Competitor Hotels and
  Find Competitor Reviews.
- Read-only. The first hotel of the account needs a competitor set.

### test-flow-reputation-analytics.json

- Covers Get Reviews Snapshot, Get Survey Email Stats, Get Sentiment By Category and
  Get Sentiment By Topic for the first hotel of the account.
- Read-only.

### test-flow-reputation-triggers.json

- Covers the New Review and Updated Review triggers.
- **Manual.** The API is read-only, so nothing in the flow can create a review. Somebody
  has to answer a guest survey (or wait for a review to be collected) while the flow
  waits. The steps are in the sticky note of the flow.

### test-flow-cdp-guest-data.json

- Covers Find Guest Profiles, Get Guest Profile, Find Reservations and Make API Call
  (Guest Data).
- Read-only.

### test-flow-cdp-triggers.json

- Covers the New or Updated Guest Profile and New or Updated Reservation triggers.
- **Manual.** Somebody has to create or change a reservation in the PMS connected to
  Revinate while the flow waits. The steps are in the sticky note of the flow.

### Not covered by a flow

- List Review Sites and List Languages are private dropdown sources. A flow cannot
  contain them; they are checked by opening the Review Site and Language dropdowns of
  Find Reviews in the designer.

## Things only a run can settle

These are assumptions taken from the documentation, the Porter Swagger file and the
Singer tap for Porter. The first run should check each of them.

### Reputation (Porter API)

- **Does a page of 100 reviews work for every API key?** The documentation says that
  paging and sorting of reviews work only "if your API key is configured for it" and that
  a request beyond the "review limit" is an error. The limit is not published. Find
  Reviews asks for 100 reviews and the triggers for pages of 100. If a key rejects that,
  `REVIEW_PAGE_SIZE` in `reputation/lib.js` is the one place to change.
- **Do the review triggers work with a key that is not enabled for sorting?** They send
  `sort=dateCollected,ASC` (or `updatedAt,ASC`), the request shape of the Singer tap.
- **Do the `dateCollected` and `updatedAt` filters work for the key?** The documentation
  calls them "only available for Revinate customers". If Revinate ignored the filter, the
  triggers would stay silent instead of firing old reviews (records older than the
  window are dropped), but they would also miss new ones.
- **Is `updatedAt` of a new review equal to its `dateCollected`?** If it is, Updated
  Review also fires for every new review, as its description says it can.
- **Does every representation carry a `self` link that ends with its numeric ID, and a
  review a `hotel` link?** The IDs the components return come only from those links.
- **Which error does Revinate answer for a timestamp that is more than 5 minutes off?**
  The clock correction reads Revinate's time from a 401 answer. A 401 with that time was
  seen for wrong credentials; a 401 for a wrong timestamp could not be produced without
  valid credentials.
- **Do the snapshot endpoints return `links`, and what is their default period?**
- **Rate limits.** None are published. The quota rules (2 per second, 60 per minute) are
  a guess on the careful side.

### Guest Data (CDP API)

- **What is the maximum `pageLimit`?** The documentation shows 10 and names no maximum.
  The components ask for 100 (`PAGE_LIMIT` in `cdp/lib.js`).
- **Is the first page number 1?** The sample answer shows `"number": 1`. The triggers ask
  for the first page without a number and continue from the number the answer carries, so
  either convention works, but this was only tested against mocks.
- **Which format do `lastModifiedAtFrom` and `lastModifiedAtTo` take?** The connector
  sends ISO 8601 in UTC with milliseconds, the format of the timestamps in the sample
  answers. Are both bounds inclusive?
- **How is `pageLimit` applied to reservations**, whose answer groups them by type: per
  type or in total?
- **Is the restaurant reservation list really nested one level deeper**, as in the
  documentation's sample? The connector accepts both shapes.
- **What does the API answer to an expired token: 401 or 403?** A made-up token gets 403
  (seen live). The connector replaces a cached token once on 401 or 403, at most once an
  hour.
- **Is there a limit on token requests?** The connector caches the token for its lifetime
  (a day), so it asks for about one a day per account.
- **Which fields does a profile always carry?** Only the profile ID is marked required in
  the output schema.
- **Path of Get Guest Profile.** The documentation's text says `/api/v1/`, the operation
  is registered as `/api/v2/rich-guest-profile/{profileId}`. The connector uses v2. With
  a made-up token the live gateway answers the v2 path like the other two endpoints (403
  from its authorizer) and the v1 path with a plain 403 "Forbidden".
