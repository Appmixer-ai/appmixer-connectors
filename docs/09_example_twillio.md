# Example: twilio.SendSMS

Here's a how a full example of a component that sends SMS via the Twilio service can look like:

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-Lzc6ONNHsiEXh6BL8hK%2F-Lzc8O5OEoovG9V-zqyH%2FAppmixer.png?alt=media\&token=cf6ab7d0-b65e-422a-b261-291db9d62fe9)

## Directory Structure

```
twilio/
├── auth.js
├── package.json
├── service.json
└── sms
    ├── ListFromNumbers
    │   ├── ListFromNumbers.js
    │   ├── component.json
    │   ├── package.json
    │   └── transformers.js
    └── SendSMS
        ├── SendSMS.js
        ├── component.json
        └── package.json
```

## Component Behaviour (sms/SendSMS/SendSMS.js)

Defines how the component reacts on incoming messages.

```javascript
const twilio = require('twilio');

module.exports = {

    receive(context) {

        let { accountSID, authenticationToken } = context.auth;
        let client = twilio(accountSID, authenticationToken);
        let message = context.messages.message.content;

        return client.messages.create({
            body: message.body,
            to: message.to,
            from: message.from
        }).then(message => {
            return context.sendJson(message, 'sent');
        });
    }
};
```

## Component Manifest (sms/SendSMS/component.js)

Defines the component properties and metadata.

```
{
    "name": "appmixer.twilio.sms.SendSMS",
    "author": "David Durman <david@client.io>",
    "icon": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwMCIgaGVpZ2h0PSIyNTAwIiB2aWV3Qm94PSIwIDAgMjU2IDI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCI+PGcgZmlsbD0iI0NGMjcyRCI+PHBhdGggZD0iTTEyNy44NiAyMjIuMzA0Yy01Mi4wMDUgMC05NC4xNjQtNDIuMTU5LTk0LjE2NC05NC4xNjMgMC01Mi4wMDUgNDIuMTU5LTk0LjE2MyA5NC4xNjQtOTQuMTYzIDUyLjAwNCAwIDk0LjE2MiA0Mi4xNTggOTQuMTYyIDk0LjE2MyAwIDUyLjAwNC00Mi4xNTggOTQuMTYzLTk0LjE2MiA5NC4xNjN6bTAtMjIyLjAyM0M1Ny4yNDUuMjgxIDAgNTcuNTI3IDAgMTI4LjE0MSAwIDE5OC43NTYgNTcuMjQ1IDI1NiAxMjcuODYgMjU2YzcwLjYxNCAwIDEyNy44NTktNTcuMjQ0IDEyNy44NTktMTI3Ljg1OSAwLTcwLjYxNC01Ny4yNDUtMTI3Ljg2LTEyNy44Ni0xMjcuODZ6Ii8+PHBhdGggZD0iTTEzMy4xMTYgOTYuMjk3YzAtMTQuNjgyIDExLjkwMy0yNi41ODUgMjYuNTg2LTI2LjU4NSAxNC42ODMgMCAyNi41ODUgMTEuOTAzIDI2LjU4NSAyNi41ODUgMCAxNC42ODQtMTEuOTAyIDI2LjU4Ni0yNi41ODUgMjYuNTg2LTE0LjY4MyAwLTI2LjU4Ni0xMS45MDItMjYuNTg2LTI2LjU4Nk0xMzMuMTE2IDE1OS45ODNjMC0xNC42ODIgMTEuOTAzLTI2LjU4NiAyNi41ODYtMjYuNTg2IDE0LjY4MyAwIDI2LjU4NSAxMS45MDQgMjYuNTg1IDI2LjU4NiAwIDE0LjY4My0xMS45MDIgMjYuNTg2LTI2LjU4NSAyNi41ODYtMTQuNjgzIDAtMjYuNTg2LTExLjkwMy0yNi41ODYtMjYuNTg2TTY5LjQzMSAxNTkuOTgzYzAtMTQuNjgyIDExLjkwNC0yNi41ODYgMjYuNTg2LTI2LjU4NiAxNC42ODMgMCAyNi41ODYgMTEuOTA0IDI2LjU4NiAyNi41ODYgMCAxNC42ODMtMTEuOTAzIDI2LjU4Ni0yNi41ODYgMjYuNTg2LTE0LjY4MiAwLTI2LjU4Ni0xMS45MDMtMjYuNTg2LTI2LjU4Nk02OS40MzEgOTYuMjk4YzAtMTQuNjgzIDExLjkwNC0yNi41ODUgMjYuNTg2LTI2LjU4NSAxNC42ODMgMCAyNi41ODYgMTEuOTAyIDI2LjU4NiAyNi41ODUgMCAxNC42ODQtMTEuOTAzIDI2LjU4Ni0yNi41ODYgMjYuNTg2LTE0LjY4MiAwLTI2LjU4Ni0xMS45MDItMjYuNTg2LTI2LjU4NiIvPjwvZz48L3N2Zz4=",
    "description": "Send SMS text message through Twilio.",
    "auth": {
        "service": "appmixer:twilio"
    },
    "outPorts": [
        {
            "name": "sent",
            "options": [
                { "label": "Message Sid", "value": "sid" }
            ]
        }
    ],
    "inPorts": [
        {
            "name": "message",
            "schema": {
                "type": "object",
                "properties": {
                    "body": { "type": "string" },
                    "to": { "type": "string" },
                    "from": { "type": "string" }
                },
                "required": [
                    "from", "to"
                ]
            },
            "inspector": {
                "inputs": {
                    "body": {
                        "type": "text",
                        "label": "Text message",
                        "tooltip": "Text message that should be sent.",
                        "index": 1
                    },
                    "from": {
                        "type": "select",
                        "label": "From number",
                        "tooltip": "Select Twilio phone number.",
                        "index": 2,
                        "source": {
                            "url": "/component/appmixer/twilio/sms/ListFromNumbers?outPort=numbers",
                            "data": {
                                "transform": "./transformers#fromNumbersToSelectArray"
                            }
                        }
                    },
                    "to": {
                        "type": "text",
                        "label": "To number",
                        "tooltip": "The destination phone number. <br/><br/>Format with a '+' and country code e.g., +16175551212 (E.164 format).",
                        "index": 3
                    }
                }
            }
        }
    ]
}

```

## Component Dependencies (sms/SendSMS/package.json)

Our component uses the `twilio` NodeJS library. Therefore, we need to list it as a dependency.

```
{
    "name": "appmixer.twilio.sms.SendSMS",
    "version": "1.0.0",
    "main": "SendSMS.js",
    "author": "David Durman <david@client.io>",
    "dependencies": {
        "twilio": "^3.14.0"
    }
}
```

## Service Manifest (service.json)

Metadata about the Twilio service. The Appmixer UI uses this information to display the Twilio app in the Apps panel of the Designer UI.

```
{
    "name": "appmixer.twilio",
    "label": "Twilio",
    "category": "applications",
    "description": "Twilio is a cloud communications platform as a service.",
    "icon": "data:image/png;base64,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"
}
```

## Service Authentication Module (auth.js)

Defines the authentication for the Twilio service. This information is used both for rendering the Authentication dialog (displayed when the user clicks on "Connect New Account" button in the Designer UI inspector) and also for the actual authentication to the Twilio API and validation of the tokens.

```javascript
const twilio = require('twilio');
module.exports = {
    type: 'apiKey',
    definition: () => {
        return {
            tokenType: 'authentication-token',
            accountNameFromProfileInfo: 'accountSID',
            auth: {
                accountSID: {
                    type: 'text',
                    name: 'Account SID',
                    tooltip: 'Log into your Twilio account and find <i>API Credentials</i> on your settings page.'
                },
                authenticationToken: {
                    type: 'text',
                    name: 'Authentication Token',
                    tooltip: 'Found directly next to your Account SID.'
                }
            },
            validate: context => {
                let client = new twilio(context.accountSID, context.authenticationToken);
                return client.api.accounts.list();
            }
        };
    }
};
```

## Service Authentication Module Dependencies (package.json)

Our `auth.js` module uses the `twilio` NodeJS library. Therefore, we need to list it as a dependency.

```
{
    "name": "appmixer.twilio",
    "version": "1.0.0",
    "dependencies": {
        "twilio": "^3.14.0"
    }
}
```

## Helper Component (sms/ListFromNumbers/ListFromNumbers.js)

This is a helper component that is used to list the phone numbers registered in the user's Twilio account. You can see that this component is called in the "static" mode in the SendSMS component manifest. Note that this component is not used out of necessity but more as a convenience for the user. Thanks to this component, the user can just select a phone number from a list of all their registered phone numbers in the Designer UI inspector. An alternative would be to let the user enter the phone number in a text field. However, that might result in errors to the API calls to Twilio if the phone number does not exist in the user's list of registered phone numbers in their Twilio account.

```javascript
const twilio = require('twilio');

module.exports = {

    receive(context) {

        let { accountSID, authenticationToken } = context.auth;
        let client = twilio(accountSID, authenticationToken);
        return client.incomingPhoneNumbers.list()
            .then(res => {
                return context.sendJson(res, 'numbers');
            });
    }
};
```

![Variables dynamically populated at design time with available Twilio phone numbers.](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-M17SHCYCAitdgCQJihA%2F-M17UmQLVPdH5zxKW5nl%2FScreenshot%202020-02-27%20at%2022.13.11.png?alt=media\&token=c71424d3-15e8-45af-a5d5-2e7d4083d495)

## Helper Component Manifest (sms/ListFromNumbers/component.json)

Note the component is marked as "private" meaning that it will not be available in the Designer UI as a standalone component.

```
{
    "name": "appmixer.twilio.sms.ListFromNumbers",
    "author": "David Durman <david@client.io>",
    "description": "When triggered, returns a list of numbers from user.",
    "private": true,
    "auth": {
        "service": "appmixer:twilio"
    },
    "inPorts": [ "in" ],
    "outPorts": [ "numbers" ]
}
```

## Helper Component Dependencies (sms/ListFromNumbers/package.json)

```javascript
{
    "name": "appmixer.twilio.sms.ListFromNumbers",
    "version": "1.0.0",
    "description": "Appmixer component for twilio to get a list of phone numbers of a user.",
    "main": "ListFromNumbers.js",
    "author": "David Durman <david@client.io>",
    "dependencies": {
        "twilio": "^3.14.0"
    }
}
```

## Helper Component Transfomer (sms/ListFromNumbers/transformers.js)

The `numbers` output port of our helper component returns a list of numbers. However, when the component is called in a static mode from our SendSMS component Inspector UI, the expected value is a list of objects with `label` and `value` properties so that it can be rendered by the UI. Alternatively, we could have just skip the transformer altogether and use this array structure right in our `context.sendJson()` call in our `ListFromNumbers.js` file. The advantage of using transformers is that we can use the ListFromNumbers component as a regular component (i.e. not `private`) and so allow the user to put the component in their flows. In other words, the same component can be used for static calls (to show a list of available phone numbers in the Inspector UI of the SendSMS component) as well as in a normal mode (as a regular component that can be put in a flow).

```javascript
module.exports.fromNumbersToSelectArray = (numbers) => {
    let transformed = [];
    if (Array.isArray(numbers)) {
        numbers.forEach(number => {
            transformed.push({
                label: number['phoneNumber'],
                value: number['phoneNumber']
            });
        });
    }
    return transformed;
};
```
