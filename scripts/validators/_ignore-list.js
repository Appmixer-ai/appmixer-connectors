'use strict';

// Validator ignore-list (known false positives / intentional deviations)
// ----------------------------------------------------------------------
// Reports listed here are suppressed by `node scripts/validate.js` instead of
// being printed or failing CI. Every entry must record WHY it is safe to ignore
// — this list is meant to stay small and fully justified, so a reviewer can
// audit each suppression. Run `node scripts/validate.js --show-ignored` to see
// what is currently suppressed (and the reasons), and the validator prints a
// note when a rule here matches nothing (likely stale) on a full-repo run.
//
// A report (failure OR warning) is suppressed when ALL provided fields match:
//   - validator        exact validator name, e.g. 'dynamic-outport-required-inputs'
//   - messageIncludes  substring that must appear in the report message
//   - paths            (optional) repo-relative component path must CONTAIN one
//                      of these substrings. Omit only for a truly global rule —
//                      prefer scoping by path so the suppression stays narrow.
//   - reason           required human explanation (shown by --show-ignored)

module.exports = [
    {
        validator: 'dynamic-outport-required-inputs',
        messageIncludes: 'ignoreAuth=true',
        paths: [
            'microsoft/dynamics/GetAccount/component.json',
            'microsoft/dynamics/GetContact/component.json',
            'microsoft/dynamics/GetLead/component.json',
            'microsoft/dynamics/GetObjectRecord/component.json',
            'microsoft/dynamics/ListAccounts/component.json',
            'microsoft/dynamics/ListContacts/component.json',
            'microsoft/dynamics/ListLeads/component.json'
        ],
        reason: 'The output-port source is the DynamicEntity component, which calls the Dynamics 365 metadata API to build the variable picker. That call needs an active auth session, so ignoreAuth=true is intentionally omitted — adding it would make the dropdown request unauthenticated and fail.'
    },
    {
        validator: 'makeapicall-standards',
        messageIncludes: 'method should declare enum',
        paths: ['microsoft/dynamics/MakeApiCall/component.json'],
        reason: 'The method inspector input is a select restricted to the five HTTP verbs (GET/POST/PUT/PATCH/DELETE) with default GET, so the user cannot enter anything else. A schema-level enum is redundant for this generic helper.'
    },
    {
        validator: 'makeapicall-standards',
        messageIncludes: 'auth.scope is empty',
        paths: ['microsoft/dynamics/MakeApiCall/component.json'],
        reason: 'Dynamics 365 uses the legacy resource-based OAuth flow (authorize?resource={org url}); the access token is scoped to the org resource, not to granular OAuth scopes. The connector declares scope [] on every component by design, so MakeApiCall matches that convention.'
    }
];
