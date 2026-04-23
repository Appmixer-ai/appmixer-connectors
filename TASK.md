# Task: Implement MakeApiCall component for all API key auth connectors that are missing it

## Context
You are working in the `appmixer-connectors` repo. Your job is to add a `MakeApiCall` component to every HTTP REST API connector that uses `apiKey` auth type but is missing this component.

Read the design instructions first:
- Read `.github/instructions/04-components.md`
- Read `.github/instructions/08-best-practices.md`

## Standard to implement

Based on the spec (GitHub issue #1459 - "Generic MakeAPICall") and the existing BEST implementations (see `vercel/core/MakeApiCall/` and `clerk/core/MakeApiCall/` as reference), each MakeApiCall must have:

### component.json structure:
- inPorts with these 5 inputs:
  1. `url` (text, index 1) - API endpoint path/URL, relative to service base URL OR full URL
  2. `method` (select, index 2) - GET/POST/PUT/PATCH/DELETE dropdown, default GET
  3. `headers` (textarea, index 3) - optional JSON object with additional headers
  4. `parameters` (textarea, index 4) - optional JSON object with query parameters
  5. `body` (textarea, index 5) - optional JSON request body
- outPorts with: `status` (Status Code), `headers` (Response Headers), `body` (Response Body)
- auth service: `appmixer:<connectorName>`
- quota manager: `appmixer:<connectorName>` with `resources: "requests"` and `scope: { "userId": "{{userId}}" }`

### MakeApiCall.js structure:
- Parse `headers` and `parameters` as JSON (throw CancelError on invalid JSON)
- Parse `body` as JSON (throw CancelError on invalid JSON)  
- Append parameters as query string to the URL
- Handle relative URLs: if URL doesn't start with http, prepend the service's base URL
- Include proper auth header based on the connector's auth pattern
- Return `{ status, headers, body }` where body is response.data

### Auth patterns to use (check the connector's auth.js and existing components):
- Most: `Authorization: Bearer ${context.auth.apiKey}`
- brevo: `api-key: ${context.auth.apiKey}`
- klaviyo: `Authorization: Klaviyo-API-Key ${context.auth.apiKey}` 
- virustotal: `x-apikey: ${context.auth.apiKey}`
- pinecone: `Api-Key: ${context.auth.apiKey}`
- twilio: Basic auth with `accountSID:authenticationToken` (base64)
- For connectors with custom domain/URL in auth (freshdesk, freshsales, servicenow, sonarqube, logscale, activecampaign), use `context.auth.domain` or `context.auth.url` in the base URL

## Connectors to implement (alphabetical order)

All in `src/appmixer/<name>/core/MakeApiCall/` subdirectory.

### Simple Bearer/API-key auth (implement all):
1. **activecampaign** - base URL from `context.auth.url`, api key as `Api-Token` header; check existing components
2. **apify** - `https://api.apify.com/v2`, Bearer auth
3. **azuredocumentintelligence** - check auth.js for URL and key header name
4. **beehiiv** - `https://api.beehiiv.com/v2`, Bearer auth
5. **betterstack** - `https://uptime.betterstack.com/api/v2`, Bearer auth
6. **bigCommerce** - base URL `https://api.bigcommerce.com/stores/${context.auth.storeHash}/v3`, header `X-Auth-Token: ${context.auth.accessToken}`
7. **brevo** - `https://api.brevo.com/v3`, header `api-key: ${context.auth.apiKey}`
8. **clearbit** - check auth.js
9. **cloudflare** - `https://api.cloudflare.com/client/v4`, headers `X-Auth-Email` and `X-Auth-Key`
10. **cloudflareWAF** - check auth.js (may share cloudflare pattern)
11. **elevenlabs** - `https://api.elevenlabs.io/v1`, header `xi-api-key: ${context.auth.apiKey}`
12. **everart** - check auth.js
13. **freshdesk** - base URL `https://${context.auth.domain}.freshdesk.com/api/v2`, Basic auth with apiKey as username, "X" as password
14. **freshsales** - base URL `https://${context.auth.domain}`, header `Authorization: Token token=${context.auth.apiKey}`
15. **gohighlevel** - `https://services.leadconnectorhq.com`, Bearer auth with `accessToken`
16. **imperva** - check auth.js for proper header names (id, key)
17. **jotform** - `https://api.jotform.com` or `https://${context.auth.regionPrefix}.jotform.com`, header `APIKEY: ${context.auth.apiKey}`
18. **kit** - `https://api.kit.com/v4`, Bearer auth
19. **klaviyo** - `https://a.klaviyo.com/api`, header `Authorization: Klaviyo-API-Key ${context.auth.apiKey}` + `revision: 2024-10-15`
20. **leadspicker** - check auth.js
21. **lemonsqueezy** - `https://api.lemonsqueezy.com/v1`, Bearer auth
22. **line** - `https://api.line.me`, header `Authorization: Bearer ${context.auth.channelAccessToken}`
23. **logscale** - base URL from `context.auth.url`, Bearer auth
24. **mailerlite** - `https://connect.mailerlite.com/api`, Bearer auth
25. **mandrill** - `https://mandrillapp.com/api/1.0`, add apiKey to request body as JSON field
26. **merk** - check auth.js
27. **monday** - `https://api.monday.com/v2`, header `Authorization: ${context.auth.apiKey}`
28. **naxai** - check auth.js
29. **nexl** - check auth.js
30. **ntfy** - base URL from `context.auth.serverUrl`, Bearer auth with `accessToken`
31. **onesignal** - `https://onesignal.com/api/v1`, Bearer auth
32. **openai** - `https://api.openai.com/v1`, Bearer auth
33. **paddle** - `https://api.paddle.com`, Bearer auth
34. **pdfco** - `https://api.pdf.co/v1`, header `x-api-key: ${context.auth.apiKey}`
35. **perplexity** - `https://api.perplexity.ai`, Bearer auth
36. **pinecone** - `https://api.pinecone.io`, header `Api-Key: ${context.auth.apiKey}`
37. **pipedrive** - `https://api.pipedrive.com/v1`, Bearer auth
38. **plivo** - check auth.js
39. **ragieai** - `https://api.ragie.ai`, Bearer auth
40. **railway** - `https://backboard.railway.app/graphql/v2`, Bearer auth
41. **redmine** - check auth.js for URL and auth pattern
42. **replicate** - `https://api.replicate.com/v1`, Bearer auth
43. **resend** - `https://api.resend.com`, Bearer auth
44. **servicenow** - base URL from `context.auth.instance`, Bearer with `apiKey`
45. **sonarqube** - base URL from `context.auth.serverUrl`, Bearer auth
46. **tally** - `https://api.tally.so`, Bearer auth
47. **twilio** - `https://api.twilio.com/2010-04-01`, Basic auth (accountSID:authenticationToken)
48. **unkey** - `https://api.unkey.com/v2`, Bearer auth
49. **userengage** - check auth.js
50. **vapi** - `https://api.vapi.ai`, Bearer auth
51. **verifyemail** - `https://verifyemail.io/api`, add apiKey as query param
52. **virustotal** - `https://www.virustotal.com/api/v3`, header `x-apikey: ${context.auth.apiKey}`
53. **voys** - check auth.js
54. **webflow** - `https://api.webflow.com/v2`, Bearer auth
55. **xtremepush** - check auth.js

For connectors marked "check auth.js", inspect the file at `src/appmixer/<connector>/auth.js` and existing component files to determine the correct base URL and authentication headers.

## Important rules:
1. Place each component at `src/appmixer/<connector>/core/MakeApiCall/` (create `core/` dir if it doesn't exist)
2. Files: `component.json` and `MakeApiCall.js`
3. Copy the **icon** from the connector's other existing component.json (find it in the connector folder)
4. Version: `1.0.0`
5. Register the component in the connector's `package.json` if a package.json exists with a components list
6. After implementing ALL components, update each connector's `bundle.json` with a minor version bump and changelog entry "add MakeApiCall component"
7. Finally commit everything with message: `feat: add MakeApiCall component to all API key connectors`

## After completing:
Push the branch and run:
GH_TOKEN=$GITHUB_VERO_PAT gh pr create --repo Appmixer-ai/appmixer-connectors --head feat/api-key-makeapicall-new --title "feat: add MakeApiCall component to all API key connectors" --body "Implements MakeApiCall component for all connectors using apiKey authentication. Follows the standard spec from #1459 with method, url, headers, parameters, and body inputs." --base main

Then run: openclaw system event --text "Done: New MakeApiCall PR created for all API key connectors" --mode now
