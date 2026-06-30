![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/clientIO/appmixer-connectors?utm_source=oss&utm_medium=github&utm_campaign=clientIO%2Fappmixer-connectors&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

# Appmixer Connectors

This repository contains the officially maintained connectors for Appmixer. They enable seamless integration with external services and help you build workflows faster by handling API access, authentication, and data flows.

## Key Benefits
- **Ease of use**: Pre-built connectors remove boilerplate for common integrations.
- **Flexibility**: Customize and extend connectors to suit specific needs.
- **Scalability**: Build workflows that scale with your workloads.

## Getting Started
To learn how to create custom connectors, refer to our comprehensive guide: [Creating Custom Connectors](https://docs.appmixer.com/getting-started/custom-connectors).

## AI & Development Instructions

Comprehensive development guidelines for both humans and AI assistants (Copilot, Claude, CodeRabbit, etc.) are maintained in `.github/instructions/`. These cover connector structure, authentication, component types, best practices, and testing.

The files are numbered for reading order:

| File | Topic |
|------|-------|
| `00-overview.md` | Project structure overview |
| `01-connectors.md` | Connector configuration (service.json, bundle.json, quota.js) |
| `02-authentication.md` | Auth types (API key, OAuth 2.0) |
| `03-plugins.md` | Plugins, routes, and jobs |
| `04-components.md` | Component overview |
| `05-component-config.md` | component.json schema and configuration |
| `06-component-behavior.md` | Component behavior (JavaScript) |
| `07-component-types.md` | Action & trigger component patterns |
| `08-best-practices.md` | Code style, development, and AI guidelines |
| `09-testing.md` | Unit tests and E2E test flows |
| `10-agent-instructions.md` | Instructions for AI agents |

A combined version is auto-generated at `.github/copilot-instructions.md` — do not edit it directly. To rebuild after editing instruction files:

```sh
node scripts/build-instructions.js
```

## Contribution Guidelines
We welcome contributions from the community! To contribute:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Ensure your code adheres to our coding standards and includes tests.
4. Submit a pull request with a clear description of your changes.


## Examples
Examples can be found in the `src/examples` directory. They are not exhaustive, but they should give you an idea of how to use the connectors. Examples do not belong to our connector Marketplace, but they are useful for testing and development purposes.

## Test
In the `test` directory, you can find the test files for the connectors. They are not exhaustive as there is another set of tests that are not public.

### Running the Tests
```sh
# install dependencies once
scripts/npm-install.sh
# run the tests
npm run test-unit
```

### Appmixer Stub
In `test/utils.js` you can find a stub for the Appmixer API. It is supposed to emulate all the advanced features of the Appmixer engine like sending messages, doing HTTP requests, using cache, etc. It is not a complete implementation of the Appmixer API, but it is enough to test the connectors. You can use it to test your connectors without having to run the Appmixer engine.

These tests run on every PR. They also feed into SonarQube analysis, which runs on each commit to the `dev` branch.

### What to Test
Rule of thumb:
- A `receive` function in a component should be tested if it has any logic in it (caching, timeouts, bulk processing). If it is just a pass-through, it does not need to be tested.
- A `routes.js` file should be tested if used for more complex tasks, such as processing incoming webhooks.
