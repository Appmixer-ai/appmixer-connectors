# Part 6: Component Behavior (JavaScript)

The behavior file contains the component's logic.

## Basic Structure

### `receive` Method

The `receive` function is called when the component receives data from the input port.

```javascript
module.exports = {
    async receive(context) {

        // Get input data
        const { message, priority, count } = context.messages.in.content;

        // Perform the action
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.service.com/messages',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                text: message,
                priority: priority,
                count: count
            }
        });

        // Return the result
        return context.sendJson(response.data, 'out');
    }
};
```

## Advanced Features

### Trigger Components

```javascript
module.exports = {
    async tick(context) {
        // Called periodically for polling
        const newItems = await fetchNewItems(context);

        for (const item of newItems) {
            await context.sendJson(item, 'out');
        }
    }
};
```

### Webhook Components

```javascript
module.exports = {
    async receive(context) {
        const webhookUrl = context.getWebhookUrl();

        // Register webhook with external service
        await registerWebhook(context, webhookUrl);

        return context.sendJson({ webhookUrl }, 'out');
    },

    async webhook(context) {
        // Handle incoming webhook
        const payload = context.messages.webhook;
        return context.sendJson(payload, 'out');
    }
};
```

---
