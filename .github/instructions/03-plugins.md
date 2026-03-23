# Part 3: Plugins, Routes and Jobs

Files: `<connector>/jobs.js`, `<connector>/routes.js`, `<connector>/plugin.js`

> **Limitation**: Plugin code is deployed to pods that only load files from the connector root. Do **not** require helpers from component module folders (e.g. `./tasks/...`, `./core/...`) inside routes or jobs. Keep shared helpers/models alongside the plugin entry point (or re-export them there) so every pod can resolve the require.

## Context API

`context.log` MUST have this signature:
```js
context.log(level, message, [data]);
```

---
