# Authentication

Connectors that require authentication from the user must implement the authentication module. The authentication module must be named `auth.js` and must be stored under either the service or module directory (i.e. `[vendor]/[service]/auth.js` or `[vendor/[service]/[module]/auth.js`. Appmixer currently supports four types of authentication mechanisms out-of-the-box that are common for today's APIs: [API key](https://en.wikipedia.org/wiki/Application_programming_interface_key), [Password](#password), [OAuth 1](https://oauth.net/1/), and [OAuth 2](https://oauth.net/2/).

Appmixer provides an easy way to configure authentication modules. Most of the time, it's only about configuring a 3rd party service provider URLs for authentication, requesting access tokens, and token validation.

## Authentication Module Structure

Each authentication module is a NodeJS module that returns an object with `type` and `definition` properties. `type` can be either `apiKey`, `pwd`, `oauth` (for OAuth 1) and `oauth2` (for OAuth 2). `definition` is either an object or a function (useful in cases where there's a code that you need to run dynamically).

### type

The type of authentication mechanism. Any of `apiKey`, `pwd`, `oauth` and `oauth2`.

### definition

The definition of the authentication mechanism is specific to the API service provider. An object or a function. This differs significantly between authentication mechanisms.

If the _definition_ property is specified as a function, it has one argument called _context_. It is an object that contains either _consumerKey, username and password, consumerSecret_ (OAuth 1) or _clientId, clientSecret_ (OAuth 2) and it always contains _callbackUrl_ property. This will be shown later in the examples.

## Authentication mechanisms

As was mentioned in the beginning, Appmixer authentication supports four mechanisms: API Key, Password, OAuth 1, and OAuth 2. Each of them has a different definition.

### function, object, or a URL string

In the following examples, we will show how a particular property of the _definition_ object can be specified as a function, object, or string. Let's demonstrate that on a _requestProfileInfo_ property since it is common for all authentication mechanisms.

```javascript
// or any library you want to perform API requests
const request = require('request-promise');

module.exports = {

    definition: {
    
        // ...
    
        // requestProfileInfo can be defined as a function. In this case, you
        // can do whatever you need in here and return object with user's
        // profile information (in promise)
        requestProfileInfo: async context => {
    
            // curl https://mydomain.freshdesk.com/api/v2/agents/me \
            //  -u myApiKey:X'
            return request({
                method: 'GET',
                url: `https://${context.domain}.acme.com/api/v2/agents/me`,
                auth: {
                    user: context.apiKey  // 'context' will be explained later
                },
                json: true
            });
        },
        
        // or you can specify it as an object. In this case, the object follows
        // the 'request' (https://www.npmjs.com/package/request) javascript library
        // options.
        requestProfileInfo: {
            method: 'GET',
            url: 'https://acme.com/get-some-records/app_id={{appId}}',
            headers: {
                'Authorization': 'Basic {{apiKey}}'  // {{apiKey}} explained later
            }
        },
        
        // and finally, if a string is used, it is to specify just the URL.
        // In this case, Appmixer will perform GET request to that URL.
        requestProfileInfo: 'https://acme.com/get-profile-info?apiKey={{apiKey}}'
        
        // Note that if you define 'requestAccessToken' property in an Oauth2 authentication
        // module with a string that contains a URL, then a POST request will be
        // sent to that URL. In other words, what will happen, when a property 
        // is defined as a string, depends on the context (Oauth vs ApiKey ...).
    }
}

```

### API key

This is the most basic type of third-party authentication. In order to use this mechanism, `type` property must be set to `apiKey`. Here is an example from Freshdesk components:

```javascript
module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'authentication-token',

        auth: {
            domain: {
                type: 'text',
                name: 'Domain',
                tooltip: 'Your Freshdesk subdomain - e.g. if the domain is <i>https://example.freshdesk.com</i> just type <b>example</b> inside this field'
            },
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Log into your Freshdesk account and find <i>Your API Key</i> in Profile settings page.'
            }
        },

        accountNameFromProfileInfo: 'contact.email',

        requestProfileInfo: async context => {

            // curl https://mydomain.freshdesk.com/api/v2/agents/me \
            //  -u myApiKey:X'
            return context.httpRequest({
                method: 'GET',
                url: `https://${context.domain}.freshdesk.com/api/v2/agents/me`,
                auth: {
                    user: context.apiKey,
                    password: 'X'
                },
                json: true
            });
        },

        validate: async context => {

            // curl https://mydomain.freshdesk.com/api/v2/agents/me \
            //  -u myApiKey:X'
            const credentials = `${context.apiKey}:X`;
            const encoded = (new Buffer(credentials)).toString('base64');
            await context.httpRequest({
                method: 'GET',
                url: `https://${context.domain}.freshdesk.com/api/v2/agents/me`,
                headers: {
                    'Authorization': `Basic ${encoded}`
                }
            });
            // if the request doesn't fail, return true (exception will be captured in caller)
            return true;
        }
    }
};
```

Next, we explain the fields inside the definition object:

#### auth (object)

This is  the definition for the Web Form that will be displayed to the user to collect information required by the third-party application. Freshdesk requires the domain name and the API key in order to authenticate the user. So we define two fields representing these two items and we define the label and tooltip that will appear in the form for each field. In this case, the auth definition will make Appmixer render a form like this:

![Authentication form for Freshdesk, defined by auth object](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-LATDgYqVMe0hChW7efU%2F-MGoDu4SxjTUY0raUHWU%2F-MGoWzN5x3CaNNTs6cfE%2Ffreshdeskauth.png?alt=media\&token=783ca4ed-8225-4d40-89a9-5fe2e7989c83)

The values configured by the user will be exposed in the [`context`](../behaviour#context) object with the same keys as in the _auth_ object. In this case, we will be able to access the values as `context.domain` and `context.apiKey`in our component [NodeJS module](behaviour).

#### requestProfileInfo ([function, object or string](#function-object-or-a-url-string)) (optional)

While this field is optional, is recommended for a better UX since it is used to request the user profile information from a 3rd party API and together with `accountNameFromProfileInfo` show the display name of the 3rd party account in Appmixer UIs.

See [examples of real connectors](https://github.com/search?q=repo%3AclientIO%2Fappmixer-connectors+requestProfileInfo\&type=code) that implement this method.

#### accountNameFromProfileInfo ([function or string](#function-object-or-a-url-string))

This field is the dot-separated path in the object returned by `requestProfileInfo` that points to the value that will be used as the account name. Following the example, the object returned by `requestProfileInfo` would have a structure like this:

```javascript
{
    contact: {
        email: 'appmixer@example.com',
        name: 'Appmixer example',
        // More properties here...
    }
    // There can be more properties here as well...
}
```

We want to use the email to identify the Freshdesk accounts in Appmixer, so we set `accountNameFromProfileInfo` as `contact.email`.

If `requestProfileInfo` is not defined, the `auth` object will be used instead. The account name will be the resolved value for the property specified by `accountNameFromProfileInfo`.

#### validate ([function, object or string](#function-object-or-a-url-string))

Similar to `requestProfileInfo`. This property is used to validate if the authentication data entered by the user is correct. For this purpose you can call any endpoint that requires authentication, you can even use the same endpoint as `requestProfileInfo`. If the data is correct, this function should resolve to any value. Otherwise, throw an error. You can also define `validate` as an object. In that case, the object has the same structure as the object passed into the axios library. For example:

```javascript
'use strict';

module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'apiKey',

        accountNameFromProfileInfo: 'appId',

        auth: {
            appId: {
                type: 'text',
                name: ' APP ID',
                tooltip: 'Log into your account and find Api key.'
            },
            apiKey: {
                type: 'text',
                name: 'REST API Key',
                tooltip: 'Found directly next to your App ID.'
            },
            cert: {
                // just to show, that a 'textarea' input is supported as well
                type: 'textarea',
                name: 'TLS CA',
                tooltip: 'Paste text content of <code>.crt</code> file' 
            }
        },

        // In the validate request we need the appId and apiKey specified by the user.
        // All properties defined in the previous 'auth' object will be
        // available in the validate call. Just use {{whatever-key-from-auth-object}}
        // anywhere in the next object. Appmixer will replace these with the
        // correct values.
        validate: {
            method: 'GET',
            url: 'https://acme.com/get-some-records/app_id={{appId}}',
            headers: {
                'Authorization': 'Basic {{apiKey}}'
            }
        }
    }
};

```

If the `validate` function throws an exception and the exception contains _message_ property, the message will be shown in the Connecting Account Failed page.

![](https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2Fly77AkYXTH8e3I2tkZZB%2FBoard_%C2%B7_Appmixer.png?alt=media\&token=914fdd63-2434-475a-a9dd-27668d4a0590)

If `validate` is specified as an object, the response error can vary from API to API. Appmixer will use internal heuristics to try to find the error message in the response object. If the error message is not shown on the _Connecting Account Failed_ page, then the validate response can always be parsed and a proper exception thrown in the auth.js module using the `validateErrCallback` function:

```javascript
validate: {
    'method': 'GET',
    'uri': 'https://api.apify.com/v2/users/{{apiUserId}}?token={{apiToken}}'
},

 validateErrCallback: err => {

    if (err?.someNestedObject?.message) {
        throw new Error(err.someNestedObject.message);  // message for the UI
    }
    throw err;
}
```

## Password

The password-based authentication is almost similar to key-based authentication as explained in the above section. The only difference is that you will use `username` and `password` inputs. The `auth` property inside `definition` will need to have two inputs as shown in the below-given code snippet. The `validate` method is used to validate the input values provided. You can make API call by using the `context.username` and `context.password` properties. If the API you are validating returns a token, it will have to be returned from the validate method as shown below.&#x20;

```javascript
'use strict';

module.exports = {

    type: 'pwd',

    definition: {

        // As opposed to the 'apiKey' module, the 'auth' property inside the 
        // definition object is optional for the 'pwd' type. If omitted, it will 
        // have the following structure. If you want to change name of the field,
        // change the content of the tooltip or add another field, you can do
        // that here. 
        auth: {
            username: {
                type: 'text',
                name: 'Username',
                tooltip: 'Username'
            },
            password: {
                type: 'password',
                name: 'Password',
                tooltip: 'Password'
            }
        },

        // the only mandatory property for the 'pwd' authentication type
        validate: async context => {
        
            const { username, password } = context
            const { data } = await context.httpRequest.post(
                // the URL for the username/password authentication
                'https://service-server-api-url/auth',
                { username, password }
            );
            
            // verify authentication works
            if (!data.isValid) {
                throw new Error("Invalid username/password combination.");
            }
            
            // if the API does not return a token for exchange, then return here.
            // in such case, the components using this authentication module
            // will have to use the username/password to perform each request.
            // There will be properties context.auth.username and 
            // context.auth.password available in the context object in a component.
            
            // if the API returns a token and expiration then return them using 
            // the following way - object with 'token' and 'expires' properties.
            const { token, expiresIn } = data;
            
            // the token and expiration (if provided) will be available in a
            // component's context object under context.auth.token and
            // context.auth.expires
            return {
                token,
                // expires can be a Date - token expiration date (timestamp),
                // or number/string with seconds representing a token lifetime.
                // Appmixer will use this to request a new token (using stored
                // username and password) when the current one is about to expire
                expires: expiresIn
            };
            
            // if the API returns a token that does not expire, just return
            // that token 
            // return { token };
        }
    }
};

```

#### HTTP Basic Authentication

The _pwd_ type can be used for the HTTP Basic Authentication. Here's a sample code:

```javascript
'use strict';
module.exports = {

    type: 'pwd',

    definition: {

        validate: async context => {

            await context.httpRequest.get('https://postman-echo.com/basic-auth', {
                auth: {
                    username: context.username,
                    password: context.password
                }
            });
        }
    }
}
```

Then the _username_ and _password_ is available in the components:

```javascript
'use strict';
module.exports = {

    async start(context) {

        await context.httpRequest.get('https://postman-echo.com/basic-auth', {
            auth: {
                username: context.auth.username,
                password: context.auth.password
            }
        });
    }
}
```

### OAuth 1

In order to use this mechanism, `type` property must be set to `oauth`. Here is an example from Trello components:

```javascript
'use strict';
const OAuth = require('oauth').OAuth;
const Promise = require('bluebird');

module.exports = {

    type: 'oauth',

    // In this example, 'definition' property is defined as a function. 
    definition: context => {

        let trelloOauth = Promise.promisifyAll(new OAuth(
            'https://trello.com/1/OAuthGetRequestToken',
            'https://trello.com/1/OAuthGetAccessToken',
            context.consumerKey,
            context.consumerSecret,
            '1.0',
            context.callbackUrl,
            'HMAC-SHA1'
        ), { multiArgs: true });

        return {

            accountNameFromProfileInfo: 'id',

            authUrl: context => {

                return 'https://trello.com/1/OAuthAuthorizeToken' +
                    '?oauth_token=' + context.requestToken +
                    '&name=AppMixer' +
                    '&scope=read,write,account' +
                    '&expiration=never';
            },

            requestRequestToken: () => {

                return trelloOauth.getOAuthRequestTokenAsync()
                    .then(result => {
                        return {
                            requestToken: result[0],
                            requestTokenSecret: result[1]
                        };
                    });
            },

            requestAccessToken: context => {

                return trelloOauth.getOAuthAccessTokenAsync(
                    context.requestToken,
                    context.requestTokenSecret,
                    context.oauthVerifier
                ).then(result => {
                    return {
                        accessToken: result[0],
                        accessTokenSecret: result[1]
                    };
                });
            },

            requestProfileInfo: context => {

                return trelloOauth.getProtectedResourceAsync(
                    'https://api.trello.com/1/members/me',
                    'GET',
                    context.accessToken,
                    context.accessTokenSecret
                ).then(result => {
                    if (result[1].statusCode !== 200) {
                        throw new Error(result[1].statusMessage);
                    }
                    result = JSON.parse(result[0]);
                    // get rid of limits for now
                    // may and will contain keys with dots - mongo doesn't like it
                    delete result.limits;
                    return result;
                });
            },

            validateAccessToken: context => {

                return trelloOauth.getProtectedResourceAsync(
                    'https://api.trello.com/1/tokens/' + context.accessToken,
                    'GET',
                    context.accessToken,
                    context.accessTokenSecret
                ).then(result => {
                    if (result[1].statusCode === 401) {
                        throw new context.InvalidTokenError(result[1].statusMessage);
                    }
                    if (result[1].statusCode !== 200) {
                        throw new Error(result[1].statusMessage);
                    }

                    result = JSON.parse(result[0]);
                    if (result['dateExpires'] === null) {
                        return;
                    }
                    throw new context.InvalidTokenError('Invalid token.');
                });
            }
        };
    }
};

```

Note that in this case, the _definition_ is a function instead of an object, but it still returns an object with the items needed for OAuth 1 authentication, similar to API key authentication. Now we explain the fields from the definition object:

#### accountNameFromProfileInfo ([function or string](#function-object-or-a-url-string))

Works exactly the same way as described in the [API Key](#accountnamefromprofileinfo) section.

#### requestRequestToken ([function, object or string](#function-object-or-a-url-string))

This must be a function (or an object, or just a string URL as explained [here](#authentication-mechanisms)) that returns a promise which must resolve to an object containing `requestToken` and `requestTokenSecret` the same way that is shown in the example above. These are needed to get the access token and become exposed by the context - `context.requestToken` and `context.requestTokenSecret`.

#### requestAccessToken ([function, object or string](#function-object-or-a-url-string))

This must be a function (or an object, or just a string URL as explained [here](#authentication-mechanisms)) that returns a promise which must resolve to an object containing `accessToken` and `accessTokenSecret` the same way that is shown in the example. Usually, you will be using the `requestToken` and `requestTokenSecret` inside this function, as they are required by the OAuth 1 flow in this step. Similarly to `requestRequestToken` function, `accessToken` and `accessTokenSecret` will become exposed by the context - `context.accessToken` and `context.accessTokenSecret`.

#### authUrl ([function, object or string](#function-object-or-a-url-string))

[Function, object or a string](#authentication-mechanisms) URL returning _auth_ URL. Appmixer will then use this URL to redirect the user to the proper authentication page. The `requestToken` is available in the _context_. The example shows the _authUrl_ declaration using the token provided by the _context_.

#### requestProfileInfo ([function, object or string](#function-object-or-a-url-string)) (optional)

Works exactly the same way as described in the [API Key](#requestprofileinfo-optional) section.

#### validateAccessToken ([function or object](#function-object-or-a-url-string))

This property serves the same purpose as [validate](#validate) property in the API Key mechanism. This is used by Appmixer to test if the access token is valid and accepted by the third-party app. You have access to `context.accessToken` and `context.accessTokenSecret` to make authenticated requests. If the token is valid, this function should resolve to any value. Otherwise, throw an error.

### OAuth 2

The latest OAuth protocol and industry-standard, OAuth 2.0 improved many things from the first version in terms of usability and implementation, while maintaining a high degree of security. It is easier to implement in Appmixer as well. In order to use this mechanism, `type` property must be set to `oauth2`. Here is an example from [Asana `auth.js` module](https://github.com/clientIO/appmixer-connectors/blob/master/src/appmixer/asana/auth.js):

```javascript
'use strict';
const request = require('request-promise');

module.exports = {

    type: 'oauth2',

    // function definition is used in this case because of the 'profileInfo'
    // property that we want to locally store and reference between
    // the 'requestAccessToken' and 'requestProfileInfo' functions.
    definition: () => {

        let profileInfo;

        return {

            accountNameFromProfileInfo: context => {

                return context.profileInfo['email'] || context.profileInfo['id'].toString();
            },

            authUrl: 'https://app.asana.com/-/oauth_authorize',

            requestAccessToken: context => {

                // don't put params into post body, won't work, have to be in query
                let tokenUrl = 'https://app.asana.com/-/oauth_token?' +
                    'grant_type=authorization_code&code=' + context.authorizationCode +
                    '&redirect_uri=' + context.callbackUrl +
                    '&client_id=' + context.clientId +
                    '&client_secret=' + context.clientSecret;

                return request({
                    method: 'POST',
                    url: tokenUrl,
                    json: true
                }).then(result => {
                    profileInfo = result['data'];
                    let newDate = new Date();
                    newDate.setTime(newDate.getTime() + (result['expires_in'] * 1000));
                    return {
                        accessToken: result['access_token'],
                        refreshToken: result['refresh_token'],
                        accessTokenExpDate: newDate
                    };
                });
            },

            requestProfileInfo: () => {

                return profileInfo;
            },

            refreshAccessToken: context => {

                // don't put params into post body, won't work, have to be in query
                let tokenUrl = 'https://app.asana.com/-/oauth_token?' +
                    'grant_type=refresh_token&refresh_token=' + context.refreshToken +
                    '&redirect_uri=' + context.callbackUrl +
                    '&client_id=' + context.clientId +
                    '&client_secret=' + context.clientSecret;

                return request({
                    method: 'POST',
                    url: tokenUrl,
                    json: true
                }).then(result => {
                    profileInfo = result['data'];
                    let newDate = new Date();
                    newDate.setTime(newDate.getTime() + (result['expires_in'] * 1000));
                    return {
                        accessToken: result['access_token'],
                        accessTokenExpDate: newDate,
                        // Some services return a new refresh token, if so, it can
                        // be returned here and Appmixer will replace the old one.
                        refreshToken: result['refresh_token'] 
                    };
                });
            },

            validateAccessToken: {
                method: 'GET',
                url: 'https://app.asana.com/api/1.0/users/me',
                auth: {
                    bearer: '{{accessToken}}'
                }
            }
        };
    }
};

```

The `requestAccessToken` is used to get the access token while the `refreshAccessToken` is used to refresh the access token later. Next, see the `definition` object's properties explained in more detail:

#### accountNameFromProfileInfo ([function or string](#function-object-or-a-url-string))

Works exactly the same way as described in the [API Key](#accountnamefromprofileinfo) section.

#### authUrl ([function, object or string](#function-object-or-a-url-string))

Similar to OAuth 1, we should provide the authentication URL for the third-party app. However, due to the different authentication flows supported by OAuth 2, the way this is defined may vary according to the third-party implementation. If the OAuth 2 implementation is standard, you can define the `authUrl` with just a string like:

```javascript
authUrl: 'https://www.dropbox.com/oauth2/authorize'
```

Standard means, there is a `response_type` parameter set to `code`,  the `client_id`, `redirect_uri`, `state` and `scope` parameters. If the OAuth 2 implementation requires any other parameters (or the standard ones use different names), then you have to define this property as a function and provide all the additional parameters. See, for example, the [JIRA `auth.js` module definition](https://github.com/clientIO/appmixer-connectors/blob/master/src/appmixer/jira/auth.js#L26).

The same logic applies to the following property `requestAccessToken`.

#### requestAccessToken ([function, object or string](#function-object-or-a-url-string))

This function should return a promise with an object which contains `accessToken`, `refreshToken` (optional, some OAuth 2 implementations do not have refresh tokens) and `accessTokenExpDate` or `expires_in` (also optional if the implementation does not have tokens that expire). Inside this function, you should call the endpoint which handles the access tokens for the application. The following `context` properties are available to you in this function: `clientId`, `clientSecret`, `callbackUrl` and `authorizationCode`. See, for example, [the JIRA `auth.js` module definition](https://github.com/clientIO/appmixer-connectors/blob/master/src/appmixer/jira/auth.js#L56).

#### requestProfileInfo ([function, object or string](#function-object-or-a-url-string)) (optional)

Works exactly the same way as described in the [API Key](#requestprofileinfo-optional) section.

#### refreshAccessToken ([function, object or string](#function-object-or-a-url-string))

Part of the OAuth 2 specification is the ability to refresh short-lived access tokens via a refresh token that is issued along with the access token. This function should call the refresh token endpoint on the third-party app and resolve to an object with `accessToken` and `accessTokenExpDate` (and `refreshToken` if needed) properties, as shown in the example.  You have access to context properties `clientId`, `clientSecret`, `callbackUrl` and `refreshToken`.

#### validateAccessToken ([function, object or string](#function-object-or-a-url-string))

Has the exact same purpose as the same method in the [OAuth 1](#validateaccesstoken).

#### scope

String or an array of strings.

#### scopeDelimiter

String. The default one is `,` and you can change it to `' '` for example.

Sometimes the OAuth 2 needs a scope or a different scope delimiter. Here is a full example of the  Microsoft authentication module with a different than the default scope delimiter:

```javascript
'use strict';
const TENANT = 'common';

module.exports = {

    type: 'oauth2',

    definition: {

        scope: ['offline_access', 'user.read'],

        scopeDelimiter: ' ',

        authUrl: `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`,

        requestAccessToken: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',

        refreshAccessToken: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',

        accountNameFromProfileInfo: 'displayName',

        emailFromProfileInfo: 'mail',

        requestProfileInfo: 'https://graph.microsoft.com/v1.0/me',

        validateAccessToken: {
            method: 'GET',
            url: 'https://graph.microsoft.com/v1.0/me',
            auth: {
                bearer: '{{accessToken}}'
            }
        }
    }
};

```

#### refreshBeforeExp

By default,  Appmixer will try to refresh the access token five minutes before its expiration. This is fine for most of the OAuth2 implementations, where an access token is usually valid for hours or days. However, there are OAuth2 implementations with stricter rules. With this property, you can define how many minutes (default, see _refreshBeforeExpUnits_) before the access token expiration should Appmixer refresh the token. Appmixer will not try to refresh the token before this value.

```javascript
module.exports = {

    type: 'oauth2',

    definition: () => {

        // telling Appmixer it cannot refresh it sooner than 30 seconds 
        // before access token expiration
        refreshBeforeExp: 30,
        refreshBeforeExpUnits: 'seconds',   // 'minutes' by default
        
        // the rest is business as usual
        authUrl: 'https://www.acme.com/oaut2/authorize'
        
        ...
    }
}
```

#### refreshBeforeExpUnits

Works in cooperation with the _refreshBeforeExp_ property. Useful if you need to go down to seconds. See the example above.

#### OAuth 2 redirect URI

When you're developing an OAuth 2 application, at some point you have to register an app in the 3rd party system. For that, you need the _redirect URI_ that points to the Appmixer API. The format of the redirect URI is `https://[APPMIXER_TENANT_API_URL]/auth/[service]/callback`.

For example, if the service you're developing is called _myService_ then the redirect URI will be `https://[APPMIXER_TENANT_API_URL]/auth/myService/callback`.

The _redirect URI_ can be changed per module in the Backoffice -> Connector Configuration page:

<figure><img src="https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2FtCMxFcHOFbr7z7F65zEO%2FGoogle_-_6_0.png?alt=media&#x26;token=7b41ba7c-ab97-44ce-838e-efba2af1c244" alt=""><figcaption><p>Setting custom redirect URI just for appmixer:google module.</p></figcaption></figure>

### Context

Context properties are different for each authentication type. But some of them are common for all types.

#### async context.httpRequest

Wrapper around the [axios](https://axios-http.com/docs/api_intro) library, making it easy to initiate HTTP requests without the need to import a 3rd party library:

```javascript
module.exports = {

    type: 'pwd',

    definition: {

        // the only mandatory property for the 'pwd' authentication type
        validate: async context => {
        
            const { username, password } = context;
            const { data } = await context.httpRequest.post(
                // the URL for the username/password authentication
                'https://service-server-api-url/auth',
                { username, password }
            );
            
            // verify authentication works
            if (!data.isValid) {
                throw new Error("Invalid username/password combination.");
            }            
            return true;
        }
    }
};
```

### Custom "Connect account" button

Appmixer allows you to redefine the _Connect Account_ button in the Designer and Integration Wizards. This is especially useful if the 3rd party has specific requirements for branding of the sign-in buttons, such as [Google](https://developers.google.com/identity/branding-guidelines).

<figure><img src="https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2FRxhAY8Pd0lVTUuyPRPca%2FCustom__Connect_account__button_in_Inspector_Wizard_%C2%B7_Issue__3276_%C2%B7_clientIO_appmixer-fe.png?alt=media&#x26;token=9c041f90-8e52-455e-b74f-c07a5ffffc58" alt=""><figcaption><p>Custom "Connect account" button in the Designer.</p></figcaption></figure>

<figure><img src="https://1556994647-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FUaFilImHHLqJ2jPd88UX%2Fuploads%2FWbRxqgx5vvNSb14pTuMd%2FAppmixer_SDK.png?alt=media&#x26;token=7abc55f2-3be7-4524-b6ad-88e546e96653" alt=""><figcaption><p>Custom "Connect account" button in the Wizard.</p></figcaption></figure>

This is done with an optional `connecAccountButton: { image: 'data uri' }` property. Example from the [Google auth.js](https://github.com/clientIO/appmixer-connectors/blob/master/src/appmixer/google/auth.js):

```javascript
'use strict';
const GoogleApi = require('googleapis');
const Promise = require('bluebird');

module.exports = {

    type: 'oauth2',

    definition: initData => {

        return {

            // The auth.js 'definition' object can have an optional 
            // 'connectAccountButton' property, which has to contain the 'image'.
            connectAccountButton: { image: 'data:image/png;base64,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' },

            scope: ['profile', 'email'],

            accountNameFromProfileInfo: function(context) {

                return context.profileInfo.email;
            },
            
    ...
}

```

### Setting OAuth 1,2 secrets

To set your OAuth applications secrets, follow the [Connector Configuration](../../getting-started/services#custom-oauth-credentials) guideline.
