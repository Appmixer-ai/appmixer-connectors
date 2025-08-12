---
mode: agent
description: Code style and refactoring rules for Appmixer connectors, specifically focusing on the component.json and behavior files. It is essential to follow these guidelines to ensure consistency and maintainability across all connectors.
---

# Appmixer Connector Code Style Guide
For component(s) in a given Appmixer connector:
Read both the component.json and the behavior file (the .js file with the same name as the component directory).

# Refactor the component.json file to follow these rules
Every update and delete component must have `outPorts: ['out']` in the component.json.
Every update and delete component must have at least one required input, which is the `id` of the entity being updated or deleted.
Avoid changing `icon`.
Every inspector input of type `toggle` must have a `defaultValue` set to `false` if not specified otherwise.
For components that define dynamic output ports (i.e., source is present inside an outPorts entry), ensure that the source.data.messages mapping follows this rule: If the input schema defines required fields (i.e., the "required" array is non-empty), then all required fields must be mapped using "in/<fieldName>": "any" (the value can be any valid expression or constant). If there are no required input fields, only include the minimal mapping: "in/outputType": "inputs/in/outputType". Do not include any additional mappings when no required fields are present. This ensures correct evaluation of dynamic output port options.

# Refactor the behavior file to follow these rules
The file begins with `'use strict';` (single quotes) on the first line.
Ensure an empty line after the receive function definition (i.e., after the `async receive(context) {` line).
Avoid adding any unspecified empty lines in the behavior file.
Remove any unused library imports or requires.
When making HTTP requests with context.httpRequest, prefer destructuring the response as const { data } = await context.httpRequest({ ... }) instead of const response = await context.httpRequest({ ... }).
Apply these changes to all components for the connector if not specified otherwise.
Avoid `json: true` in the context.httpRequest options, as it is not needed.
Avoid `'Content-Type': 'application/json'` in the headers of context.httpRequest, as it is not needed.
Every required input in the component.json must be also asserted in the behavior file. If missing, throw exception with `throw new context.CancelError('<human_readable_input_name> is required!')`.
Every update and delete component must return an empty object, eg `return context.sendJson({}, 'out');` at the end of the function.
