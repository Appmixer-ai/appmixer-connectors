Create payment
post
https://api.mollie.com/v2/payments

🔑
Access with

API key

Access token with payments.write

Payment creation is elemental to the Mollie API: this is where most payment implementations start off.

Once you have created a payment, you should redirect your customer to the URL in the _links.checkout property from the response.

To wrap your head around the payment process, an explanation and flow charts can be found in the 'Accepting payments' guide.

If you specify the method parameter when creating a payment, optional additional parameters may be available for the payment method that are not listed below. Please refer to the guide on method-specific parameters.

Query Params
include
string | null
enum
This endpoint allows you to include additional information via the include query string parameter.

Show Details
details.qrCode	Include a QR code object. Only available for iDEAL, Bancontact and bank transfer payments.
Allowed:

details.qrCode
Body Params
description
string
required
length ≤ 255
The description of the payment. This will be shown to your customer on their card or bank statement when possible. We truncate the description automatically according to the limits of the used payment method. The description is also visible in any exports you generate.

We recommend you use a unique identifier so that you can always link the payment to the order in your back office. This is particularly useful for bookkeeping.

The maximum length of the description field differs per payment method, with the absolute maximum being 255 characters. The API will not reject strings longer than the maximum length but it will truncate them to fit.

amount
object
required
The amount that you want to charge, e.g. {currency:"EUR", value:"1000.00"} if you would want to charge €1000.00.

You can find the minimum and maximum amounts per payment method in our help center. Additionally, they can be retrieved using the Get method endpoint.

If a tip was added for a Point-of-Sale payment, the amount will be updated to reflect the initial amount plus the tip amount.


amount object
currency
string
required
A three-character ISO 4217 currency code.

value
string
required
A string containing an exact monetary amount in the given currency.

redirectUrl
string | null
required
The URL your customer will be redirected to after the payment process.

It could make sense for the redirectUrl to contain a unique identifier – like your order ID – so you can show the right page referencing the order when your customer returns.

The parameter is normally required, but can be omitted for recurring payments (sequenceType: recurring) and for Apple Pay payments with an applePayPaymentToken.

cancelUrl
string | null
The URL your customer will be redirected to when the customer explicitly cancels the payment. If this URL is not provided, the customer will be redirected to the redirectUrl instead — see above.

Mollie will always give you status updates via webhooks, including for the canceled status. This parameter is therefore entirely optional, but can be useful when implementing a dedicated customer-facing flow to handle payment cancellations.

webhookUrl
string | null
The webhook URL where we will send payment status updates to.

The webhookUrl is optional, but without a webhook you will miss out on important status changes to your payment.

The webhookUrl must be reachable from Mollie's point of view, so you cannot use localhost. If you want to use webhook during development on localhost, you must use a tool like ngrok to have the webhooks delivered to your local machine.

lines
array of objects | null
Optionally provide the order lines for the payment. Each line contains details such as a description of the item ordered and its price.

All lines must have the same currency as the payment.

Required for payment methods billie, in3, klarna, riverty and voucher.


object

type
string
The type of product purchased. For example, a physical or a digital product.

The tip payment line type is not available when creating a payment.

Possible values: physical digital shipping_fee discount store_credit gift_card surcharge tip (default: physical)

description
string
required
A description of the line item. For example LEGO 4440 Forest Police Station.

quantity
integer
required
≥ 1
The number of items.

quantityUnit
string
The unit for the quantity. For example pcs, kg, or cm.

unitPrice
object
required
The price of a single item including VAT.

For example: {"currency":"EUR", "value":"89.00"} if the box of LEGO costs €89.00 each.

For types discount, store_credit, and gift_card, the unit price must be negative.

The unit price can be zero in case of free items.


unitPrice object
discountAmount
object
Any line-specific discounts, as a positive amount. Not relevant if the line itself is already a discount type.


discountAmount object
totalAmount
object
required
The total amount of the line, including VAT and discounts.

Should match the following formula: (unitPrice × quantity) - discountAmount.

The sum of all totalAmount values of all order lines should be equal to the full payment amount.


totalAmount object
vatRate
string
The VAT rate applied to the line, for example 21.00 for 21%. The vatRate should be passed as a string and not as a float, to ensure the correct number of decimals are passed.

vatAmount
object
The amount of value-added tax on the line. The totalAmount field includes VAT, so the vatAmount can be calculated with the formula totalAmount × (vatRate / (100 + vatRate)).

Any deviations from this will result in an error.

For example, for a totalAmount of SEK 100.00 with a 25.00% VAT rate, we expect a VAT amount of SEK 100.00 × (25 / 125) = SEK 20.00.


vatAmount object
sku
string
length ≤ 64
The SKU, EAN, ISBN or UPC of the product sold.

categories
array of strings
An array with the voucher categories, in case of a line eligible for a voucher. See the Integrating Vouchers guide for more information.

Possible values: eco gift meal sport_culture additional consume

imageUrl
string
A link pointing to an image of the product sold.

productUrl
string
A link pointing to the product page in your web shop of the product sold.

recurring
object
The details of subsequent recurring billing cycles. These parameters are used in the Mollie Checkout to inform the shopper of the details for recurring products in the payments.


recurring object
billingAddress
object
The customer's billing address details. We advise to provide these details to improve fraud protection and conversion.

Should include email or a valid postal address consisting of streetAndNumber, postalCode, city and country.

Required for payment method in3, klarna, billie and riverty.


billingAddress object
title
string
The title of the person, for example Mr. or Mrs..

givenName
string
The given name (first name) of the person should be at least two characters and cannot contain only numbers.

Required for payment methods billie, in3, klarna and riverty.

familyName
string
The given family name (surname) of the person should be at least two characters and cannot contain only numbers.

Required for payment methods billie, in3, klarna and riverty.

organizationName
string
The name of the organization, in case the addressee is an organization.

Required for payment method billie.

streetAndNumber
string
A street and street number.

Required for payment methods billie, in3, klarna and riverty.

streetAdditional
string
Any additional addressing details, for example an apartment number.

postalCode
string
A postal code. This field may be required if the provided country has a postal code system.

Required for payment methods billie, in3, klarna and riverty.

email
string
A valid e-mail address.

If you provide the email address for a banktransfer payment, we will automatically send the instructions email upon payment creation. The language of the email will follow the locale parameter of the payment.

Required for payment methods billie, in3, klarna and riverty.

phone
string
If provided, it must be in the E.164 format. For example: +31208202070.

city
string
A city name.

Required for payment methods billie, in3, klarna and riverty.

region
string
The top-level administrative subdivision of the country. For example: Noord-Holland.

country
string
A country code in ISO 3166-1 alpha-2 format.

Required for payment methods billie, in3, klarna and riverty.

shippingAddress
object
The customer's shipping address details. We advise to provide these details to improve fraud protection and conversion.

Should include email or a valid postal address consisting of streetAndNumber, postalCode, city and country.


shippingAddress object
title
string
The title of the person, for example Mr. or Mrs..

givenName
string
The given name (first name) of the person should be at least two characters and cannot contain only numbers.

Required for payment methods billie, in3, klarna and riverty.

familyName
string
The given family name (surname) of the person should be at least two characters and cannot contain only numbers.

Required for payment methods billie, in3, klarna and riverty.

organizationName
string
The name of the organization, in case the addressee is an organization.

streetAndNumber
string
A street and street number.

Required for payment methods billie, in3, klarna and riverty.

streetAdditional
string
Any additional addressing details, for example an apartment number.

postalCode
string
A postal code. This field may be required if the provided country has a postal code system.

Required for payment methods billie, in3, klarna and riverty.

email
string
A valid e-mail address.

If you provide the email address for a banktransfer payment, we will automatically send the instructions email upon payment creation. The language of the email will follow the locale parameter of the payment.

Required for payment methods billie, in3, klarna and riverty.

phone
string
If provided, it must be in the E.164 format. For example: +31208202070.

city
string
A city name.

Required for payment methods billie, in3, klarna and riverty.

region
string
The top-level administrative subdivision of the country. For example: Noord-Holland.

country
string
A country code in ISO 3166-1 alpha-2 format.

Required for payment methods billie, in3, klarna and riverty.

locale
string | null
Allows you to preset the language to be used in the hosted payment pages shown to the customer. Setting a locale is highly recommended and will greatly improve your conversion rate. When this parameter is omitted the browser language will be used instead if supported by the payment method. You can provide any xx_XX format ISO 15897 locale, but our hosted payment pages currently only support the specified languages.

For bank transfer payments specifically, the locale will determine the target bank account the customer has to transfer the money to. We have dedicated bank accounts for Belgium, Germany, and The Netherlands. Having the customer use a local bank account greatly increases the conversion and speed of payment.

Possible values: en_US en_GB nl_NL nl_BE de_DE de_AT de_CH fr_FR fr_BE es_ES ca_ES pt_PT it_IT nb_NO sv_SE fi_FI da_DK is_IS hu_HU pl_PL lv_LV lt_LT null

method
string | null
Normally, a payment method screen is shown. However, when using this parameter, you can choose a specific payment method and your customer will skip the selection screen and is sent directly to the chosen payment method. The parameter enables you to fully integrate the payment method selection into your website.

You can also specify the methods in an array. By doing so we will still show the payment method selection screen but will only show the methods specified in the array. For example, you can use this functionality to only show payment methods from a specific country to your customer ['bancontact', 'belfius'].

Possible values: alma applepay bacs bancomatpay bancontact banktransfer belfius billie bizum blik creditcard directdebit eps giftcard ideal in3 kbc klarna mbway mobilepay multibanco mybank paybybank payconiq paypal paysafecard pointofsale przelewy24 riverty satispay swish trustly twint vipps voucher

issuer
string | null
Only relevant for iDEAL, KBC/CBC, gift card, and voucher payments.

⚠️ With the introduction of iDEAL 2 in 2025, this field will be ignored for iDEAL payments. For more information on the migration, refer to our help center.

Some payment methods are a network of connected banks or card issuers. In these cases, after selecting the payment method, the customer may still need to select the appropriate issuer before the payment can proceed.

We provide hosted issuer selection screens, but these screens can be skipped by providing the issuer via the API up front.

The full list of issuers for a specific method can be retrieved via the Methods API by using the optional issuers include.

A valid issuer for iDEAL is for example ideal_INGBNL2A (for ING Bank).

restrictPaymentMethodsToCountry
string | null
For digital goods in most jurisdictions, you must apply the VAT rate from your customer's country. Choose the VAT rates you have used for the order to ensure your customer's country matches the VAT country.

Use this parameter to restrict the payment methods available to your customer to those from a single country.

If available, the credit card method will still be offered, but only cards from the allowed country are accepted.

The field expects a country code in ISO 3166-1 alpha-2 format, for example NL.

metadata
Provide any data you like, for example a string or a JSON object. We will save the data alongside the entity. Whenever you fetch the entity with our API, we will also include the metadata. You can use up to approximately 1kB.


string
captureMode
string | null
Indicate if the funds should be captured immediately or if you want to place a hold and capture at a later time.

This field needs to be set to manual for method riverty.

Possible values: automatic manual

captureDelay
string | null
Only relevant if you wish to manage authorization and capturing separately.

Some payment methods allow placing a hold on the card or bank account. This hold or 'authorization' can then at a later point either be 'captured' or canceled.

By default, we charge the customer's card or bank account immediately when they complete the payment. If you set a capture delay however, we will delay the automatic capturing of the payment for the specified amount of time. For example 8 hours or 2 days.

To schedule an automatic capture, the captureMode must be set to automatic.

The maximum delay is 7 days (168 hours).

Possible values: ... hours ... days

applicationFee
object | null
With Mollie Connect you can charge fees on payments that your app is processing on behalf of other Mollie merchants.

If you use OAuth to create payments on a connected merchant's account, you can charge a fee using this applicationFee parameter. If the payment succeeds, the fee will be deducted from the merchant's balance and sent to your own account balance.

If instead you want to split a payment on your own account between yourself and a connected merchant, refer to the routing parameter.


applicationFee object | null
amount
object
The fee that you wish to charge.

Be careful to leave enough space for Mollie's own fees to be deducted as well. For example, you cannot charge a €0.99 fee on a €1.00 payment.


amount object
currency
string
required
A three-character ISO 4217 currency code.

value
string
required
A string containing an exact monetary amount in the given currency.

description
string
length ≤ 255
The description of the application fee. This will appear on settlement reports towards both you and the connected merchant.

routing
array of objects | null
This functionality is not enabled by default. Reach out to our partner management team if you wish to use it.

With Mollie Connect you can charge fees on payments that your app is processing on behalf of other Mollie merchants.

If you create payments on your own account that you want to split between yourself and one or more connected merchants, you can use this routing parameter to route the payment accordingly.

The routing parameter should contain an array of objects, with each object describing the destination for a specific portion of the payment.

It is not necessary to indicate in the array which portion goes to yourself. After all portions of the total payment amount have been routed, the amount left will be routed to the current organization automatically.

If instead you use OAuth to create payments on a connected merchant's account, refer to the applicationFee parameter.


object

amount
object
required
The portion of the total payment amount being routed. Currently only EUR payments can be routed.


amount object
destination
object
required
The destination of this portion of the payment.


destination object
releaseDate
string | null
Optionally, schedule this portion of the payment to be transferred to its destination on a later date. The date must be given in YYYY-MM-DD format.

If no date is given, the funds become available to the connected merchant as soon as the payment succeeds.

_links
object
required
An object with several relevant URLs. Every URL object will contain an href and a type field.


_links object
sequenceType
string
Only relevant for recurring payments.

Indicate which part of a recurring sequence this payment is for.

Recurring payments can only take place if a mandate is available. A common way to establish such a mandate is through a first payment. With a first payment, the customer agrees to automatic recurring charges taking place on their account in the future.

If set to recurring, the customer's card is charged automatically.

Defaults to oneoff, which is a regular non-recurring payment.

For PayPal payments, recurring is only possible if your connected PayPal account allows it. You can call our Methods API with parameter sequenceType: first to discover which payment methods on your account are set up correctly for recurring payments.

Possible values: oneoff first recurring

mandateId
string
Only relevant for recurring payments.

When creating recurring payments, the ID of a specific mandate can be supplied to indicate which of the customer's accounts should be credited.

customerId
string | null
The ID of the customer the payment is being created for. This is used primarily for recurring payments, but can also be used on regular payments to enable single-click payments.

If sequenceType is set to recurring, this field is required.

profileId
string
The identifier referring to the profile this entity belongs to.

When using an API Key, the profileId can be omitted since it is linked to the key. However, for OAuth and Organization tokens, the profileId is required.

For more information, see Authentication.

dueDate
string
The date by which the payment should be completed in YYYY-MM-DD format

testmode
boolean | null
Whether to create the entity in test mode or live mode.

Most API credentials are specifically created for either live mode or test mode, in which case this parameter can be omitted. For organization-level credentials such as OAuth access tokens, you can enable test mode by setting testmode to true.

