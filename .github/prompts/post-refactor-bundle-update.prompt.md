---
mode: 'agent'
description: "You are called after a refactor to synchronise bundle versions and changelog entries for the affected connectors."
---

# Bump bundle versions for refactored connectors
- Apply the semantic version bump requested for every connector that was touched in the previous task.
- Append a changelog entry that summarises the refactor for each updated bundle.

## Input context
- `context.connectors`: Array of objects describing the connectors to update. Each object includes:
  - `name`: Service name, e.g. `appmixer.googleForms`.
  - `directory`: Absolute path to the connector root (contains `bundle.json`).
  - `bundlePath`: Absolute path to `bundle.json`. If missing, derive it with `${directory}/bundle.json`.
  - `changeSummary`: String or string[] with human readable notes about the refactor. May be absent.
- `context.versionBump`: One of `patch`, `minor`, or `major` that defines how to bump the semantic version.
- `context.summary`: Optional fallback summary for the whole task when a connector specific summary is not supplied.

## Steps per connector
1. Open `bundle.json`. If it does not exist, skip the connector and report the issue in the final response.
2. Read the current `version`. Compute the next semantic version by applying `context.versionBump` (`patch`, `minor`, or `major`).
3. Update the top-level `version` field to the new version string.
4. Update (or create if missing) the `changelog` object and append a new entry whose key equals the new version. Insert it at the end of the object so prior entries remain in chronological order.
5. The value for the new changelog key must be an array of summary strings:
   - Use the connector's `changeSummary` (normalised to an array) when provided.
   - Otherwise, use `context.summary` if available.
   - As a last resort, craft a concise sentence that references the refactor for the connector.
6. Preserve all other properties in `bundle.json` untouched.

## Output expectations
- Provide only the file edits required to update the relevant `bundle.json` files.
- Ensure the resulting JSON remains valid and formatted consistently with the existing file (spacing, newline at EOF, property order).
- Confirm in the concluding message which bundles were updated and the versions applied.
