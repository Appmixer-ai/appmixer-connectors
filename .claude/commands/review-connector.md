---
description: Review a connector against Appmixer standards
argument-hint: <connector>
---

# Review Connector

Review an Appmixer connector against coding standards and best practices.

## Arguments
- Connector name: `$1`

## Overview

This command performs a comprehensive review of a connector, checking:
1. Code standards from copilot-instructions.md
2. Label and tooltip consistency across all components
3. Best practices and common issues

## Review Checklist

Create a checklist and review each item systematically. Store results in:
`src/appmixer/<connector>/artifacts/ai-artifacts/review-connector.md`

### Phase 1: Setup

1. **Locate the connector** at `src/appmixer/$1/`
2. **Read the CLAUDE.md** file for project-specific guidelines
3. **List all components** in the connector (all subdirectories containing component.json)
4. **Create the artifacts directory** if it doesn't exist: `src/appmixer/$1/artifacts/ai-artifacts/`

### Phase 2: Structural Review

Review each of these items and record findings:

#### 2.1 Connector Files
- [ ] `service.json` exists and has required fields (name, label, category, description, version, icon)
- [ ] `auth.js` exists and follows proper patterns (apiKey or oauth2)
- [ ] `bundle.json` exists with name, version, changelog
- [ ] `bundle.json` has only ONE version entry if unreleased (no pre-created version entries)
- [ ] `lib.js` exists if Find/List components use `outputType`

#### 2.2 Component Structure
For each component, verify:
- [ ] `component.json` exists with required fields
- [ ] Behavior `.js` file exists matching folder name
- [ ] Component name follows pattern: `appmixer.<connector>.core.<ComponentName>`

### Phase 3: Component Type Compliance

Review each component based on its type:

#### 3.1 Get Components
- [ ] Has required ID input field
- [ ] Returns single item via `out` port
- [ ] Validates required ID in behavior file

#### 3.2 List Components
- [ ] Has `outputType` field (last in schema)
- [ ] Uses `lib.js` helpers for output
- [ ] Does NOT have `limit` or `offset` fields
- [ ] Mentions maximum record count in description

#### 3.3 Find Components
- [ ] Has `outputType` field (last in schema)
- [ ] Has `notFound` output port
- [ ] Uses `lib.js` helpers for output
- [ ] Does NOT have `limit` or `offset` fields
- [ ] Mentions maximum record count in description

#### 3.4 Create Components
- [ ] Has at least one required field
- [ ] Returns created entity via `out` port

#### 3.5 Update Components
- [ ] Has required ID input field
- [ ] Returns empty object: `context.sendJson({}, 'out')`
- [ ] Has at least one required input (the ID)

#### 3.6 Delete Components
- [ ] Has required ID input field
- [ ] Has `outPorts: ['out']` defined
- [ ] Returns empty object: `context.sendJson({}, 'out')`
- [ ] Has at least one required input (the ID)

#### 3.7 Trigger Components (Polling)
- [ ] Has `"tick": true` in component.json
- [ ] Has `"trigger": true` in component.json
- [ ] Does NOT have `inPorts` (uses `properties` instead)
- [ ] Implements `tick(context)` method
- [ ] Uses `context.properties` (not `context.messages.in.content`)
- [ ] Uses `loadState()`/`saveState()` for tracking

#### 3.8 Trigger Components (Webhook)
- [ ] Has `"webhook": true` in component.json
- [ ] Has `"trigger": true` in component.json
- [ ] Does NOT have `inPorts` (uses `properties` instead)
- [ ] Implements `start(context)`, `receive(context)`, `stop(context)`
- [ ] Returns `context.response()` in receive method

### Phase 4: Label and Tooltip Consistency

This is a CRITICAL check. Same entities across components MUST have consistent labels and tooltips.

#### 4.1 Entity ID Consistency
For each entity type (e.g., Task, Email, User, Folder, Space, List):
- Extract all input fields that reference this entity's ID
- Verify the **label** is identical across all components (e.g., "Email ID" everywhere, not "Email Id" in one and "Email ID" in another)
- Verify the **tooltip** is similar/identical across components

Example consistency check:
```
Entity: Task
- GetTask: taskId (label: "Task ID", tooltip: "The unique identifier of the task")
- UpdateTask: taskId (label: "Task ID", tooltip: "The unique identifier of the task")
- DeleteTask: taskId (label: "Task ID", tooltip: "The unique identifier of the task")
```

#### 4.2 Common Field Consistency
Check consistency for common fields that appear in multiple components:
- `name` / `title` fields - same label style
- `description` fields - same label style
- `status` fields - same options and labels
- `priority` fields - same options and labels
- Date/time fields - same format and type

#### 4.3 Output Port Consistency
For entities returned by multiple components:
- Verify `outPorts.options` use consistent labels
- Example: "Task ID" should be "Task ID" in all components, not "Id" in one and "Task ID" in another

#### 4.4 Cross-Component Field Naming Consistency (CRITICAL)
Same data fields MUST have identical names across all components that return them.

**IMPORTANT EXCEPTION - Appmixer File ID vs Service Entity ID:**
There is a critical distinction between two types of IDs:

1. **Appmixer File ID** - The internal Appmixer storage file ID returned by `context.saveFileStream()`.
   - Use label: `"File ID"`
   - Example: DownloadFile saves a file to Appmixer storage and returns `fileId`
   - This helps users understand it's an Appmixer internal reference

2. **Service Entity ID** - The ID from the external service (e.g., Box's file ID, Slack's message ID)
   - Use label: `"ID"` (generic)
   - Example: GetFile, UploadFile return the Box file's `id`
   - This is the external service's identifier

**Why this matters:** If both use "File ID", users may confuse the Appmixer storage reference with the external service's file ID. They are different things and should be labeled differently.

**Example - Box connector:**
```
DownloadFile output: "File ID" (value: "fileId") → Appmixer storage ID ✓
GetFile output: "ID" (value: "id") → Box's file ID ✓
UploadFile output: "ID" (value: "entries.0.id") → Box's file ID ✓
```

**Check output fields across all components:**
1. Extract all `outPorts.options` from every component
2. Group fields by semantic meaning (e.g., file name, folder name, entity ID)
3. Flag inconsistencies where the same data has different labels
4. **Verify Appmixer File IDs use "File ID" label and service entity IDs use "ID"**

**Common inconsistencies to catch:**
- "File Name" vs "Name" vs "Filename" for file names
- "Folder ID" vs "ID" vs "Id" for folder identifiers
- "Created At" vs "Created Date" vs "Creation Date" for timestamps
- Appmixer File ID labeled as "ID" (should be "File ID")
- Service entity ID labeled as "File ID" (should be "ID")
- "Parent" vs "Parent Folder" vs "Parent ID" for parent references

**Example inconsistency:**
```
UploadFile output: "File Name" (value: "name")
FindFilesOrFolders output: "Name" (value: "name")
GetFile output: "Name" (value: "name")
```
This is WRONG - all should use the same label like "Name" or "File Name" consistently.

**How to check:**
1. List all components that return the same entity type (File, Folder, etc.)
2. Compare their `outPorts.options` labels for equivalent fields
3. Create a mapping table showing all variations
4. Flag any field that has different labels across components

**Resolution principle:** Choose the most specific, descriptive label and apply it consistently:
- Prefer "File Name" over generic "Name" if it's always about files
- Prefer "Folder ID" over generic "ID" if it's always about folders
- Ensure the `value` key matches across all components (e.g., all use `"value": "name"`)

#### 4.5 Input/Output Field Alignment
When a component outputs a field that another component uses as input:
- The output label should clearly indicate what it is
- The input field expecting that value should have a matching or obviously related label

**Example:**
```
CreateFolder output: "Folder ID" (value: "id")
DeleteFolder input: "Folder ID" (expects the id from CreateFolder)
```
This is correct - labels align and it's clear what data flows between them.

### Phase 5: Code Quality Review

#### 5.1 JavaScript Behavior Files
- [ ] Uses 4 spaces indentation
- [ ] Uses camelCase for variable names
- [ ] Destructures with aliases if API uses snake_case
- [ ] No unused variables or imports
- [ ] Required inputs are validated with `context.CancelError`
- [ ] Proper error handling

#### 5.2 component.json Quality
- [ ] Proper attribute order (name, description, author, version, auth, quota, inPorts, properties, outPorts, icon)
- [ ] Property names use underscore or camelCase (NOT pipe `|`)
- [ ] Type mapping is correct (string→text, integer→number, boolean→toggle)
- [ ] Date fields use `"type": "date-time"` in inspector (not "text")
- [ ] No single-option select fields (should be hardcoded)
- [ ] `outputType` is always the last field in schema with highest index

#### 5.3 Inspector Indexes
- [ ] All inspector inputs have unique `index` values
- [ ] Indexes are sequential and logical
- [ ] `outputType` has the highest index value

### Phase 6: Generate Report

Create a markdown report at `src/appmixer/$1/artifacts/ai-artifacts/review-connector.md` with:

```markdown
# Connector Review: <connector_name>

**Review Date:** <timestamp>
**Reviewer:** Claude AI

## Summary

| Category | Status | Issues Found |
|----------|--------|--------------|
| Structural | PASS/FAIL | count |
| Component Types | PASS/FAIL | count |
| Label Consistency | PASS/FAIL | count |
| Code Quality | PASS/FAIL | count |

## Detailed Findings

### Critical Issues
(Issues that MUST be fixed)

### Warnings
(Issues that SHOULD be fixed)

### Suggestions
(Improvements that COULD be made)

## Label Consistency Analysis

### Entity: <EntityName>
| Component | Field | Label | Tooltip | Status |
|-----------|-------|-------|---------|--------|
| ... | ... | ... | ... | OK/MISMATCH |

## Cross-Component Field Naming Analysis

### Field: <FieldName> (e.g., "name", "id")
| Component | Output Label | Value Key | Status |
|-----------|--------------|-----------|--------|
| UploadFile | File Name | name | MISMATCH |
| GetFile | Name | name | MISMATCH |
| FindFilesOrFolders | Name | name | MISMATCH |
| CreateFolder | Name | name | OK (baseline) |

**Recommendation:** Standardize all to use "Name" or "File Name" consistently.

## Component-by-Component Review

### <ComponentName>
- **Type:** Get/List/Find/Create/Update/Delete/Trigger
- **Issues:**
  - Issue 1
  - Issue 2
- **Status:** PASS/FAIL

## Recommended Fixes

1. **Fix 1 Title**
   - File: `path/to/file`
   - Current: `current value`
   - Suggested: `suggested value`
   - Reason: explanation

2. **Fix 2 Title**
   ...
```

### Phase 7: Interactive Fixes

After generating the report:

1. **Summarize findings** to the user with counts
2. **For each finding that can be auto-fixed:**
   - Show the user what will be changed
   - Ask if they want to apply the fix
   - Apply fix if approved
   - Move to next finding

Example prompt format:
```
Found 5 issues. Would you like to review and fix them?

Issue 1 of 5: Inconsistent label for Task ID
- File: src/appmixer/clickup/core/GetTask/component.json
- Current label: "Task Id"
- Should be: "Task ID" (to match DeleteTask, UpdateTask)

Apply this fix? [Yes/No/Skip All]
```

## Common Issues to Look For

1. **Inconsistent capitalization**: "Task Id" vs "Task ID" vs "task id"
2. **Missing tooltips**: Some fields have tooltips, others don't
3. **Different tooltip wording**: "The task ID" vs "ID of the task" vs "Task identifier"
4. **Missing required field validation** in behavior files
5. **Wrong inspector types** for date/time fields
6. **Pagination fields** (limit/offset) in Find/List components
7. **Missing `notFound` port** in Find components
8. **Missing empty object return** in Delete/Update components
9. **Triggers with `inPorts`** instead of `properties`
10. **Non-sequential or duplicate index values** in inspector
11. **Cross-component field naming inconsistency**: Same data (e.g., filename) has different labels in different components ("File Name" in UploadFile vs "Name" in FindFiles)
12. **Appmixer File ID vs Service Entity ID confusion**:
    - Appmixer storage file IDs (from `context.saveFileStream()`) should use label `"File ID"`
    - External service entity IDs should use label `"ID"` (generic)
    - Example: DownloadFile returns Appmixer fileId → "File ID", GetFile returns Box's id → "ID"
13. **Output/Input label mismatch**: Component A outputs "Folder ID" but Component B input expects "Parent Folder ID" for the same data

## Example Usage

```bash
claude /review-connector clickup
```

This will:
1. Scan all components in the clickup connector
2. Check for standard compliance
3. Analyze label/tooltip consistency
4. Generate a detailed report
5. Offer to fix issues interactively
