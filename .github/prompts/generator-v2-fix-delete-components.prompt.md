---
mode: 'agent'
description: "You are a code generator. Your task is to refactor the provided component files (component.json and a Javascript behavior file) to make it a working component."
---

# Ensure output ports for DELETE and UPDATE components
- Applies only to components that use the DELETE method in `context.httpRequest`.
## Behavior javascript file
- Ensure that components using the DELETE method in `context.httpRequest` return `context.sendJson({}, 'out');` to indicate success.
- Remove any unused variables caused by refactoring the output port.
## component.json
- The 'out' port for these components should be defined as `["out"]`.
