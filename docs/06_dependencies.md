# Dependencies

Components can use 3rd party libraries which are defined in the standard `package.json` file. An example:

```
{
    "name": "appmixer.twilio.sms.SendSMS",
    "version": "1.0.0",
    "private": true,
    "main": "SendSMS.js",
    "author": "David Durman <david@client.io>",
    "dependencies": {
        "twilio": "^2.11.0"
    }
}
```

The `package.json` file from the example above tells Appmixer to load the `twilio` library that the `appmixer.twilio.sms.SendSMS` component requires for its operation.

{% hint style="info" %}
Note that the `appmixer pack` command from the Appmixer CLI ignores the `node_modules` directory when creating the zip archive representing your custom component. This is intended since when you publish a component to your Appmixer tenant, Appmixer will automatically download dependencies specified in the `package.json` file.
{% endhint %}

More information on the `package.json` file can be found at [https://docs.npmjs.com/files/package.json](https://docs.npmjs.com/files/package.json).
