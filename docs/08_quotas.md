# Quotas & Limits

The majority of APIs define limits on the API usage. Components that call APIs need to make sure that these limits are respected, otherwise their API calls would start failing quickly. The `quota.js` module allows you to specify what those limits are on a per-service, per-module or even per-component basis. The Appmixer engine uses this module to make sure API calls are throttled so that the usage limits are respected.

The quota module must be named `quota.js` and must be stored under either the service, module or component directory (i.e. `[vendor]/[service]/quota.js` , `[vendor/[service]/[module]/quota.js`or `[vendor/[service]/[module]/[component]/quota.js`.

An example of a quota module:

```javascript
module.exports = {
    rules: [
        {
            limit: 2000,
            throttling: 'window-sliding',
            window: 1000 * 60 * 60 * 24,
            scope: 'userId',
            resource: 'messages.send'
        },
        {
            limit: 3,
            window: 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'messages.send',
            scope: 'userId'
        }
    ]
};
```

The quota definition above tells the engine to throttle the `receive()` call of the component to a max of 2000-times per day and 3-times per second.

## Quota Module Structure

Quota modules are NodeJS modules that return an object with one property `rules`.

### rules

An array of rules that define usage limits. Each rule can have the following properties:

#### limit

Maximum number of calls in the time window specified by `window`.

#### window

The time window in milliseconds.

#### throttling

The throttling mechanism. Can be either a string `'window-sliding'` or an object with `type` and `getStartOfNextWindow` function. Example of a quota module for LinkedIn:

```javascript
const moment = require('moment');

module.exports = {
    rules: [{
        // The limit is 25 per day per one user.
        limit: 25,
        window: 1000 * 60 * 60 * 24,
        throttling: 'window-sliding',
        queueing: 'fifo',
        resource: 'shares',
        scope: 'userId'
    }, {
        // The limit is 125000 per day per application.
        limit: 125000,
        throttling: {
            type: 'window-fixed',
            getStartOfNextWindow: () => {
                // Daily quotas refresh at midnight PST.
                return moment.utc().startOf('day').add(1, 'day').add(8, 'hours').valueOf();
            }
        },
        resource: 'shares'
    }]
};
```

#### resource

An identifier of the resource to which the rule applies. The resource is a way for a component to pick rules that apply to that specific component. This can be done in the component manifest file in the `quota.resources` section.

{% hint style="info" %}
You can also configure system webhook to receive the quota errors when raised. Read more about it [here](https://docs.appmixer.com/appmixer/appmixer-self-managed/system-webhooks).
{% endhint %}
