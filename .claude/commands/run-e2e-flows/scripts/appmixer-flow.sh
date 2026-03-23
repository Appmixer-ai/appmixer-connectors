#!/bin/bash
# appmixer-flow.sh — Helper for Appmixer Flow API operations
# Usage: appmixer-flow.sh <command> [args...]
#
# Commands:
#   auth                          — Get auth token (prints to stdout)
#   create <flow.json>            — Create flow, returns flowId
#   get <flowId>                  — Get flow details
#   start <flowId>                — Start flow
#   stop <flowId>                 — Stop flow
#   delete <flowId>               — Delete flow
#   patch-accounts <flowId> <accountId> <service-prefix>
#                                 — Patch all connector components with account
#   logs <flowId> [size]          — Get logs (default size=100)
#   wait-done <flowId> [timeout]  — Wait for flow to finish (default 120s)
#   create-account <connector> <auth-json>
#                                 — Create account, returns accountId
#   list-accounts [service]       — List accounts, optionally filter by service
#   list-e2e-flows [filter]       — List E2E test flows
#   logs-summary <flowId> [size]  — Show log summary with errors
#   ensure-stores                 — Ensure E2E stores exist
#   validate-variables <flowId>   — Validate variable references
#   upload-flow <flow.json> <connector> <accountId>
#                                 — Upload/update a single E2E flow
#   upload-all <flows-dir> <connector> <accountId>
#                                 — Upload all test flows from a directory
#   run-all [filter] [timeout]    — Run all E2E flows and report results
#   deploy-and-run <connector> [accountId]
#                                 — Full pipeline: pack, publish, upload, run

set -euo pipefail

# Require APPMIXER_ENV pointing to .env file with all configuration
: "${APPMIXER_ENV:?APPMIXER_ENV is not set — point it to your .env file}"

if [ ! -f "$APPMIXER_ENV" ]; then
    echo "ERROR: File not found: $APPMIXER_ENV" >&2
    exit 1
fi

# Load .env safely — passwords may contain special chars like & ! |
# Use python to parse instead of source
eval "$(python3 -c "
import re, shlex
with open('$APPMIXER_ENV') as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, val = line.split('=', 1)
        print(f'export {key}={shlex.quote(val)}')
")"

BASE_URL="${APPMIXER_BASE_URL:?APPMIXER_BASE_URL missing in $APPMIXER_ENV}"
: "${APPMIXER_USERNAME:?APPMIXER_USERNAME missing in $APPMIXER_ENV}"
: "${APPMIXER_PASSWORD:?APPMIXER_PASSWORD missing in $APPMIXER_ENV}"

TOKEN_CACHE="/tmp/appmixer_token_${USER:-default}"
TOKEN_TTL=600  # 10 minutes

get_token() {
    # Check cache
    if [ -f "$TOKEN_CACHE" ]; then
        local age=$(( $(date +%s) - $(stat -f %m "$TOKEN_CACHE" 2>/dev/null || stat -c %Y "$TOKEN_CACHE" 2>/dev/null || echo 0) ))
        if [ "$age" -lt "$TOKEN_TTL" ]; then
            cat "$TOKEN_CACHE"
            return
        fi
    fi
    # Fetch new token
    local token=$(python3 -c "
import json, urllib.request, os
data = json.dumps({'username': os.environ['APPMIXER_USERNAME'], 'password': os.environ['APPMIXER_PASSWORD']}).encode()
req = urllib.request.Request('${BASE_URL}/user/auth', data=data, headers={'Content-Type': 'application/json'})
resp = json.loads(urllib.request.urlopen(req).read())
print(resp['token'])
")
    echo "$token" > "$TOKEN_CACHE"
    echo "$token"
}

CMD="${1:?Usage: appmixer-flow.sh <command> [args...]}"
shift

case "$CMD" in
    auth)
        get_token
        ;;

    create)
        FLOW_FILE="${1:?Usage: create <flow.json>}"
        TOKEN=$(get_token)
        curl -s -X POST "$BASE_URL/flows" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d @"$FLOW_FILE" | python3 -c "
import json, sys
resp = json.load(sys.stdin)
print(resp.get('flowId', resp.get('_id', json.dumps(resp))))
"
        ;;

    get)
        FLOW_ID="${1:?Usage: get <flowId>}"
        PROJECTION="${2:-}"
        TOKEN=$(get_token)
        if [ -n "$PROJECTION" ]; then
            curl -s "$BASE_URL/flows/$FLOW_ID?projection=$PROJECTION" \
                -H "Authorization: Bearer $TOKEN"
        else
            curl -s "$BASE_URL/flows/$FLOW_ID?projection=flowId,name,stage,flow,customFields,description" \
                -H "Authorization: Bearer $TOKEN"
        fi
        ;;

    start)
        FLOW_ID="${1:?Usage: start <flowId>}"
        TOKEN=$(get_token)
        curl -s -X POST "$BASE_URL/flows/$FLOW_ID/coordinator" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"command":"start"}'
        ;;

    stop)
        FLOW_ID="${1:?Usage: stop <flowId>}"
        TOKEN=$(get_token)
        curl -s -X POST "$BASE_URL/flows/$FLOW_ID/coordinator" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"command":"stop"}'
        ;;

    delete)
        FLOW_ID="${1:?Usage: delete <flowId>}"
        TOKEN=$(get_token)
        curl -s -X DELETE "$BASE_URL/flows/$FLOW_ID" \
            -H "Authorization: Bearer $TOKEN"
        ;;

    patch-accounts)
        FLOW_ID="${1:?Usage: patch-accounts <flowId> <accountId> <service-prefix>}"
        ACCOUNT_ID="${2:?}"
        SERVICE_PREFIX="${3:?}"
        TOKEN=$(get_token)
        # Get flow, patch connector components with account, update,
        # AND assign account via PUT /auth/component/:componentId/:accountId
        python3 -c "
import json, urllib.request, os

flow_id = '$FLOW_ID'
account_id = '$ACCOUNT_ID'
service_prefix = '$SERVICE_PREFIX'
token = '$TOKEN'
base = '${BASE_URL}'

# Get flow — must use ?projection=flow to avoid Elasticsearch errors on some instances
req = urllib.request.Request(f'{base}/flows/{flow_id}?projection=flow', headers={'Authorization': f'Bearer {token}'})
flow_data = json.loads(urllib.request.urlopen(req).read())
flow = flow_data.get('flow', {})

patched = 0
connector_comp_ids = []
for comp_id, comp in flow.items():
    comp_type = comp.get('type', '')
    if comp_type.startswith(service_prefix) and not comp_type.startswith('appmixer.utils.'):
        if 'config' not in comp:
            comp['config'] = {}
        if 'properties' not in comp['config']:
            comp['config']['properties'] = {}
        comp['config']['properties']['account'] = account_id
        connector_comp_ids.append(comp_id)
        patched += 1

# Update flow
update_data = json.dumps({'flow': flow}).encode()
req = urllib.request.Request(f'{base}/flows/{flow_id}?forceUpdate=true', data=update_data, method='PUT',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
urllib.request.urlopen(req)

# Assign account to each component via auth API
assigned = 0
for comp_id in connector_comp_ids:
    try:
        req = urllib.request.Request(
            f'{base}/auth/component/{comp_id}/{account_id}',
            method='PUT',
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(req)
        assigned += 1
    except Exception as e:
        print(f'Warning: failed to assign account to {comp_id}: {e}')

print(f'Patched {patched} components, assigned account to {assigned} via auth API')
"
        ;;

    logs)
        FLOW_ID="${1:?Usage: logs <flowId> [size]}"
        SIZE="${2:-100}"
        TOKEN=$(get_token)
        curl -s "$BASE_URL/logs?flowId=$FLOW_ID&from=0&size=$SIZE&sort=gridTimestamp:desc" \
            -H "Authorization: Bearer $TOKEN"
        ;;

    wait-done)
        FLOW_ID="${1:?Usage: wait-done <flowId> [timeout_seconds]}"
        TIMEOUT="${2:-120}"
        TOKEN=$(get_token)
        START=$(date +%s)
        while true; do
            NOW=$(date +%s)
            ELAPSED=$((NOW - START))

            # Poll logs for ProcessE2EResults (= flow completed)
            RESULT=$(curl -s "$BASE_URL/logs?flowId=$FLOW_ID&from=0&size=50&sort=gridTimestamp:desc" \
                -H "Authorization: Bearer $TOKEN" | python3 -c "
import json, sys
hits = json.load(sys.stdin).get('hits', [])
for h in hits:
    src = h.get('_source', h)
    if 'ProcessE2EResults' in src.get('componentType', '') and not src.get('err'):
        print('done')
        break
else:
    print('running')
")
            if [ "$RESULT" = "done" ]; then
                # Flow completed — stop it
                curl -s -X POST "$BASE_URL/flows/$FLOW_ID/coordinator" \
                    -H "Authorization: Bearer $TOKEN" \
                    -H "Content-Type: application/json" \
                    -d '{"command":"stop"}' > /dev/null
                echo "stopped"
                exit 0
            fi

            # Also check if flow already stopped on its own
            STAGE=$(curl -s "$BASE_URL/flows/$FLOW_ID?projection=stage" \
                -H "Authorization: Bearer $TOKEN" | python3 -c "import json,sys; print(json.load(sys.stdin).get('stage','unknown'))")
            if [ "$STAGE" = "stopped" ] || [ "$STAGE" = "error" ]; then
                echo "$STAGE"
                exit 0
            fi

            if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
                echo "timeout (stage=$STAGE after ${ELAPSED}s)"
                exit 1
            fi
            sleep 5
        done
        ;;

    create-account)
        CONNECTOR="${1:?Usage: create-account <connector> <auth-json>}"
        AUTH_JSON="${2:?}"
        TOKEN=$(get_token)
        python3 -c "
import json, urllib.request
data = json.dumps({
    'name': '${CONNECTOR} e2e test',
    'service': 'appmixer:${CONNECTOR}',
    'token': json.loads('${AUTH_JSON}'),
    'profileInfo': {}
}).encode()
req = urllib.request.Request('${BASE_URL}/accounts', data=data,
    headers={'Authorization': 'Bearer $TOKEN', 'Content-Type': 'application/json'})
resp = json.loads(urllib.request.urlopen(req).read())
print(resp.get('accountId', resp.get('_id', json.dumps(resp))))
"
        ;;

    list-accounts)
        SERVICE="${1:-}"
        TOKEN=$(get_token)
        RESP=$(curl -s "$BASE_URL/accounts" -H "Authorization: Bearer $TOKEN")
        if [ -n "$SERVICE" ]; then
            echo "$RESP" | python3 -c "
import json, sys
accounts = json.load(sys.stdin)
for a in accounts:
    if '$SERVICE' in a.get('service',''):
        print(json.dumps({'accountId': a['accountId'], 'name': a.get('name',''), 'service': a.get('service','')}))"
        else
            echo "$RESP" | python3 -c "
import json, sys
for a in json.load(sys.stdin):
    print(json.dumps({'accountId': a['accountId'], 'name': a.get('name',''), 'service': a.get('service','')}))"
        fi
        ;;

    list-e2e-flows)
        FILTER="${1:-}"
        TOKEN=$(get_token)
        curl -s "$BASE_URL/flows?filter=customFields.category:E2E_test_flow&limit=500&projection=flowId,name,stage" \
            -H "Authorization: Bearer $TOKEN" | python3 -c "
import json, sys
flows = json.load(sys.stdin)
name_filter = '$FILTER'.lower()
for f in flows:
    name = f.get('name', '')
    if name_filter and name_filter not in name.lower():
        continue
    print(f'{f[\"flowId\"]}  {f.get(\"stage\",\"?\"):<10}  {name}')
if not flows:
    print('No E2E flows found')
"
        ;;

    logs-summary)
        FLOW_ID="${1:?Usage: logs-summary <flowId> [size] [since_timestamp]}"
        SIZE="${2:-50}"
        SINCE="${3:-}"
        TOKEN=$(get_token)
        curl -s "$BASE_URL/logs?flowId=$FLOW_ID&from=0&size=$SIZE&sort=gridTimestamp:desc" \
            -H "Authorization: Bearer $TOKEN" | python3 -c "
import json, sys

since = '$SINCE'
hits = json.load(sys.stdin).get('hits', [])
errors = []
components_seen = set()
process_e2e_output = None

# Components to ignore in error reporting (noisy infrastructure)
IGNORE_COMPONENTS = {'appmixer.utils.controls.OnError', 'appmixer.utils.controls.StopFlow'}

for h in hits:
    src = h.get('_source', h)
    ts = src.get('gridTimestamp', '')[:19]
    if since and ts < since:
        continue
    comp = src.get('componentType', src.get('componentId', '?'))
    err_raw = src.get('err', '')
    msg_raw = src.get('message', '')
    components_seen.add(comp)

    # Capture ProcessE2EResults output (the message field has the results)
    if 'ProcessE2EResults' in comp and not err_raw and msg_raw:
        try:
            process_e2e_output = json.loads(msg_raw) if isinstance(msg_raw, str) else msg_raw
        except:
            pass

    if err_raw:
        # Skip ignored components
        if comp in IGNORE_COMPONENTS:
            continue
        try:
            err = json.loads(err_raw) if isinstance(err_raw, str) else err_raw
            msg = err.get('message', '')
            resp = err.get('response', {}).get('data', {})
            resp_str = json.dumps(resp)[:200] if resp else ''
            errors.append({'ts': ts, 'comp': comp, 'msg': msg, 'resp': resp_str})
        except:
            errors.append({'ts': ts, 'comp': comp, 'msg': str(err_raw)[:200], 'resp': ''})

has_results = any('ProcessE2EResults' in c for c in components_seen)

# Show component errors (excluding ignored ones)
if errors:
    print('COMPONENT ERRORS:')
    for e in errors:
        if '?' == e['comp'] or 'TokenError' in e.get('msg', ''):
            continue
        print(f'  ❌ {e[\"ts\"]} {e[\"comp\"]}: {e[\"msg\"]}')
        if e['resp']:
            print(f'     Response: {e[\"resp\"]}')
    print()

# Show ProcessE2EResults assert results
if has_results:
    print('ProcessE2EResults: ✅ ran')
    if process_e2e_output:
        successes = process_e2e_output.get('success', [])
        failures = process_e2e_output.get('error', process_e2e_output.get('errors', []))
        if successes:
            print(f'  Passed assertions: {len(successes)}')
            for s in successes:
                label = s if isinstance(s, str) else json.dumps(s)[:120]
                print(f'    ✅ {label}')
        if failures:
            print(f'  Failed assertions: {len(failures)}')
            for f in failures:
                label = f if isinstance(f, str) else json.dumps(f)[:120]
                print(f'    ❌ {label}')
        if not successes and not failures:
            print(f'  Raw output: {json.dumps(process_e2e_output)[:300]}')
else:
    print('ProcessE2EResults: ❌ NOT ran')

if not errors:
    print('STATUS: ✅ No component errors')
else:
    print(f'STATUS: ❌ {len(errors)} component error(s)')

print(f'Components seen: {sorted(components_seen - IGNORE_COMPONENTS - {\"?\"})}')
"
        ;;

    ensure-stores)
        TOKEN=$(get_token)
        python3 -c "
import json, urllib.request

base = '${BASE_URL}'
token = '$TOKEN'

req = urllib.request.Request(f'{base}/stores', headers={'Authorization': f'Bearer {token}'})
stores = json.loads(urllib.request.urlopen(req).read())
existing = {s['name']: s['storeId'] for s in stores}

for name in ['E2E Failed Tests', 'E2E Succeeded Tests']:
    if name in existing:
        print(f'{name}: {existing[name]} (exists)')
    else:
        data = json.dumps({'name': name}).encode()
        req = urllib.request.Request(f'{base}/stores', data=data,
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
        resp = json.loads(urllib.request.urlopen(req).read())
        print(f'{name}: {resp[\"storeId\"]} (created)')
"
        ;;

    validate-variables)
        FLOW_ID="${1:?Usage: validate-variables <flowId> [componentId1 componentId2 ...]}"
        shift
        TOKEN=$(get_token)

        # If no component IDs given, auto-detect Assert components
        if [ $# -eq 0 ]; then
            COMP_IDS=$(curl -s "$BASE_URL/flows/$FLOW_ID?projection=flow" \
                -H "Authorization: Bearer $TOKEN" | python3 -c "
import json, sys
d = json.load(sys.stdin)
flow = d.get('flow', {})
ids = [cid for cid, comp in flow.items() if 'Assert' in comp.get('type', '')]
print(','.join(ids))
")
        else
            COMP_IDS=$(IFS=,; echo "$*")
        fi

        if [ -z "$COMP_IDS" ]; then
            echo "No Assert components found in flow"
            exit 0
        fi

        # Build JSON body for the fetch request
        IDS_JSON=$(python3 -c "import json; print(json.dumps('$COMP_IDS'.split(',')))")
        BODY="{\"useCache\":false,\"flow\":false,\"components\":{\"IDs\":$IDS_JSON,\"properties\":true,\"links\":true}}"

        # Fetch variables via curl
        RESP=$(curl -s -X POST "$BASE_URL/variables/$FLOW_ID/fetch?compress=true" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$BODY")

        echo "$RESP" | python3 -c "
import json, sys

data = json.load(sys.stdin)
comp_ids = '$COMP_IDS'.split(',')

all_ok = True
for comp_id in comp_ids:
    comp = data.get('components', {}).get(comp_id, {})
    links = comp.get('links', {}).get('in', {})
    has_errors = False
    for sender, ports in links.items():
        for port, pdata in ports.items():
            errors = pdata.get('variables', {}).get('errors', {})
            if errors and errors.get('dynamic'):
                has_errors = True
                all_ok = False
                for src_comp, src_ports in errors['dynamic'].items():
                    for src_port, err_list in src_ports.items():
                        for err_group in err_list:
                            if isinstance(err_group, dict) and 'in' in err_group:
                                for inner in err_group['in']:
                                    for e in (inner if isinstance(inner, list) else [inner]):
                                        msg = e.get('message', str(e)) if isinstance(e, dict) else str(e)
                                        print(f'  ❌ {comp_id}: invalid variable from {src_comp}.{src_port}: {msg}')
                            elif isinstance(err_group, list):
                                for item in err_group:
                                    if isinstance(item, dict) and 'in' in item:
                                        for inner in item['in']:
                                            for e in (inner if isinstance(inner, list) else [inner]):
                                                msg = e.get('message', str(e)) if isinstance(e, dict) else str(e)
                                                print(f'  ❌ {comp_id}: invalid variable from {src_comp}.{src_port}: {msg}')
    if not has_errors:
        print(f'  ✅ {comp_id}: all variable references valid')

# Show available variables from components that have errors
dvars = data.get('dynamicComponentVariables', [])
dynamic_port_comps = set()
for comp_id in comp_ids:
    comp = data.get('components', {}).get(comp_id, {})
    links = comp.get('links', {}).get('in', {})
    for sender, ports in links.items():
        for port, pdata in ports.items():
            if pdata.get('variables', {}).get('errors', {}).get('dynamic'):
                dynamic_port_comps.add(sender)

if dynamic_port_comps:
    print()
    print('Available variables from components with errors:')
    for v in dvars:
        if v.get('componentId') in dynamic_port_comps:
            print(f'  {v[\"componentId\"]}.{v[\"port\"]}: {v[\"label\"]} = {v[\"value\"]}')

if not all_ok:
    sys.exit(1)
"
        ;;

    upload-flow)
        FLOW_FILE="${1:?Usage: upload-flow <flow.json> <connector> <accountId>}"
        CONNECTOR="${2:?}"
        ACCOUNT_ID="${3:?}"
        TOKEN=$(get_token)
        python3 -c "
import json, urllib.request, sys, os

flow_file = '$FLOW_FILE'
connector = '$CONNECTOR'
account_id = '$ACCOUNT_ID'
token = '$TOKEN'
base = '${BASE_URL}'
service_prefix = 'appmixer.' + connector + '.'

# 1. Read flow JSON
with open(flow_file) as f:
    flow_data = json.load(f)

flow_name = flow_data.get('name', os.path.basename(flow_file))

# 2. Set description and customFields
flow_data['description'] = 'E2E test flow for ' + connector
if 'customFields' not in flow_data:
    flow_data['customFields'] = {}
flow_data['customFields']['category'] = 'E2E_test_flow'

# 3. Set store IDs on ProcessE2EResults
req = urllib.request.Request(f'{base}/stores', headers={'Authorization': f'Bearer {token}'})
stores = json.loads(urllib.request.urlopen(req).read())
store_map = {s['name']: s['storeId'] for s in stores}

failed_store = store_map.get('E2E Failed Tests')
success_store = store_map.get('E2E Succeeded Tests')

if not failed_store or not success_store:
    # Create missing stores
    for name in ['E2E Failed Tests', 'E2E Succeeded Tests']:
        if name not in store_map:
            data = json.dumps({'name': name}).encode()
            req = urllib.request.Request(f'{base}/stores', data=data,
                headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
            resp = json.loads(urllib.request.urlopen(req).read())
            store_map[name] = resp['storeId']
    failed_store = store_map['E2E Failed Tests']
    success_store = store_map['E2E Succeeded Tests']

flow = flow_data.get('flow', {})
for comp_id, comp in flow.items():
    comp_type = comp.get('type', '')
    if 'ProcessE2EResults' in comp_type:
        if 'config' not in comp:
            comp['config'] = {}
        if 'properties' not in comp['config']:
            comp['config']['properties'] = {}
        comp['config']['properties']['failedStoreId'] = failed_store
        comp['config']['properties']['successStoreId'] = success_store

# 4. Set account on connector components
connector_comp_ids = []
for comp_id, comp in flow.items():
    comp_type = comp.get('type', '')
    if comp_type.startswith(service_prefix) and not comp_type.startswith('appmixer.utils.'):
        if 'config' not in comp:
            comp['config'] = {}
        if 'properties' not in comp['config']:
            comp['config']['properties'] = {}
        comp['config']['properties']['account'] = account_id
        connector_comp_ids.append(comp_id)

# 5. Fetch existing E2E flows, match by name
req = urllib.request.Request(
    f'{base}/flows?filter=customFields.category:E2E_test_flow&limit=500&projection=flowId,name,stage',
    headers={'Authorization': f'Bearer {token}'}
)
existing_flows = json.loads(urllib.request.urlopen(req).read())
existing_flow = None
for ef in existing_flows:
    if ef.get('name', '') == flow_name:
        existing_flow = ef
        break

if existing_flow:
    # 6. Exists: stop it, PUT update with forceUpdate=true
    existing_id = existing_flow['flowId']
    if existing_flow.get('stage') == 'running':
        try:
            stop_data = json.dumps({'command': 'stop'}).encode()
            req = urllib.request.Request(f'{base}/flows/{existing_id}/coordinator', data=stop_data,
                headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
            urllib.request.urlopen(req)
            import time
            time.sleep(2)
        except Exception as e:
            print(f'Warning: failed to stop flow: {e}', file=sys.stderr)

    update_payload = {k: v for k, v in flow_data.items() if k != 'flowId'}
    update_data = json.dumps(update_payload).encode()
    req = urllib.request.Request(f'{base}/flows/{existing_id}?forceUpdate=true', data=update_data, method='PUT',
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    urllib.request.urlopen(req)
    flow_id = existing_id
    print(f'Updated existing flow: {flow_name}', file=sys.stderr)
else:
    # 7. New: POST create
    create_data = json.dumps(flow_data).encode()
    req = urllib.request.Request(f'{base}/flows', data=create_data,
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    resp = json.loads(urllib.request.urlopen(req).read())
    flow_id = resp.get('flowId', resp.get('_id'))
    print(f'Created new flow: {flow_name}', file=sys.stderr)

# 8. Assign accounts via auth API for all connector components
assigned = 0
for comp_id in connector_comp_ids:
    try:
        req = urllib.request.Request(
            f'{base}/auth/component/{comp_id}/{account_id}',
            method='PUT',
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(req)
        assigned += 1
    except Exception as e:
        print(f'Warning: failed to assign account to {comp_id}: {e}', file=sys.stderr)

print(f'Assigned account to {assigned}/{len(connector_comp_ids)} components', file=sys.stderr)

# 9. Print the flowId
print(flow_id)
"
        ;;

    upload-all)
        FLOWS_DIR="${1:?Usage: upload-all <flows-dir> <connector> <accountId>}"
        CONNECTOR="${2:?}"
        ACCOUNT_ID="${3:?}"
        TOKEN=$(get_token)
        python3 -c "
import json, urllib.request, sys, os, glob, time

flows_dir = '$FLOWS_DIR'
connector = '$CONNECTOR'
account_id = '$ACCOUNT_ID'
token = '$TOKEN'
base = '${BASE_URL}'
service_prefix = 'appmixer.' + connector + '.'

# Find all test flow files
flow_files = sorted(glob.glob(os.path.join(flows_dir, 'test-flow-*.json')))
if not flow_files:
    print(f'No test-flow-*.json files found in {flows_dir}', file=sys.stderr)
    sys.exit(1)

print(f'Found {len(flow_files)} flow file(s) in {flows_dir}', file=sys.stderr)

# Fetch stores once
req = urllib.request.Request(f'{base}/stores', headers={'Authorization': f'Bearer {token}'})
stores = json.loads(urllib.request.urlopen(req).read())
store_map = {s['name']: s['storeId'] for s in stores}

for name in ['E2E Failed Tests', 'E2E Succeeded Tests']:
    if name not in store_map:
        data = json.dumps({'name': name}).encode()
        req = urllib.request.Request(f'{base}/stores', data=data,
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
        resp = json.loads(urllib.request.urlopen(req).read())
        store_map[name] = resp['storeId']

failed_store = store_map['E2E Failed Tests']
success_store = store_map['E2E Succeeded Tests']

# Fetch existing E2E flows once
req = urllib.request.Request(
    f'{base}/flows?filter=customFields.category:E2E_test_flow&limit=500&projection=flowId,name,stage',
    headers={'Authorization': f'Bearer {token}'}
)
existing_flows = json.loads(urllib.request.urlopen(req).read())
existing_by_name = {}
for ef in existing_flows:
    existing_by_name[ef.get('name', '')] = ef

# Process each flow file
for flow_file in flow_files:
    print(f'\\n--- Processing {os.path.basename(flow_file)} ---', file=sys.stderr)

    with open(flow_file) as f:
        flow_data = json.load(f)

    flow_name = flow_data.get('name', os.path.basename(flow_file))

    # Set description and customFields
    flow_data['description'] = 'E2E test flow for ' + connector
    if 'customFields' not in flow_data:
        flow_data['customFields'] = {}
    flow_data['customFields']['category'] = 'E2E_test_flow'

    flow = flow_data.get('flow', {})

    # Set store IDs on ProcessE2EResults
    for comp_id, comp in flow.items():
        comp_type = comp.get('type', '')
        if 'ProcessE2EResults' in comp_type:
            if 'config' not in comp:
                comp['config'] = {}
            if 'properties' not in comp['config']:
                comp['config']['properties'] = {}
            comp['config']['properties']['failedStoreId'] = failed_store
            comp['config']['properties']['successStoreId'] = success_store

    # Set account on connector components
    connector_comp_ids = []
    for comp_id, comp in flow.items():
        comp_type = comp.get('type', '')
        if comp_type.startswith(service_prefix) and not comp_type.startswith('appmixer.utils.'):
            if 'config' not in comp:
                comp['config'] = {}
            if 'properties' not in comp['config']:
                comp['config']['properties'] = {}
            comp['config']['properties']['account'] = account_id
            connector_comp_ids.append(comp_id)

    # Check if flow exists
    existing_flow = existing_by_name.get(flow_name)

    if existing_flow:
        existing_id = existing_flow['flowId']
        if existing_flow.get('stage') == 'running':
            try:
                stop_data = json.dumps({'command': 'stop'}).encode()
                req = urllib.request.Request(f'{base}/flows/{existing_id}/coordinator', data=stop_data,
                    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
                urllib.request.urlopen(req)
                time.sleep(2)
            except Exception as e:
                print(f'Warning: failed to stop flow: {e}', file=sys.stderr)

        update_payload = {k: v for k, v in flow_data.items() if k != 'flowId'}
        update_data = json.dumps(update_payload).encode()
        req = urllib.request.Request(f'{base}/flows/{existing_id}?forceUpdate=true', data=update_data, method='PUT',
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
        urllib.request.urlopen(req)
        flow_id = existing_id
        print(f'Updated existing flow: {flow_name}', file=sys.stderr)
    else:
        create_data = json.dumps(flow_data).encode()
        req = urllib.request.Request(f'{base}/flows', data=create_data,
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
        resp = json.loads(urllib.request.urlopen(req).read())
        flow_id = resp.get('flowId', resp.get('_id'))
        print(f'Created new flow: {flow_name}', file=sys.stderr)

    # Assign accounts via auth API
    assigned = 0
    for comp_id in connector_comp_ids:
        try:
            req = urllib.request.Request(
                f'{base}/auth/component/{comp_id}/{account_id}',
                method='PUT',
                headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
            )
            urllib.request.urlopen(req)
            assigned += 1
        except Exception as e:
            print(f'Warning: failed to assign account to {comp_id}: {e}', file=sys.stderr)

    print(f'Assigned account to {assigned}/{len(connector_comp_ids)} components', file=sys.stderr)
    print(flow_id)

print(f'\\nAll {len(flow_files)} flows processed.', file=sys.stderr)
"
        ;;

    run-all)
        FILTER="${1:-}"
        TIMEOUT="${2:-180}"
        TOKEN=$(get_token)
        python3 -c "
import json, urllib.request, sys, time

name_filter = '$FILTER'.lower()
timeout = int('$TIMEOUT')
token = '$TOKEN'
base = '${BASE_URL}'

# Components to ignore in error reporting
IGNORE_COMPONENTS = {'appmixer.utils.controls.OnError', 'appmixer.utils.controls.StopFlow'}

# 1. List all E2E flows
req = urllib.request.Request(
    f'{base}/flows?filter=customFields.category:E2E_test_flow&limit=500&projection=flowId,name,stage',
    headers={'Authorization': f'Bearer {token}'}
)
all_flows = json.loads(urllib.request.urlopen(req).read())

flows = []
for f in all_flows:
    name = f.get('name', '')
    if name_filter and name_filter not in name.lower():
        continue
    flows.append(f)

if not flows:
    print('No E2E flows found' + (f' matching \"{name_filter}\"' if name_filter else ''))
    sys.exit(0)

print(f'Found {len(flows)} E2E flow(s) to run:')
for f in flows:
    print(f'  {f[\"flowId\"]}  {f.get(\"name\", \"?\")}')
print()

# 2. Record start timestamp (ISO) BEFORE starting flows — used to filter stale logs
import datetime
run_start_ts = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')

# Start all flows
for f in flows:
    fid = f['flowId']
    try:
        start_data = json.dumps({'command': 'start'}).encode()
        req = urllib.request.Request(f'{base}/flows/{fid}/coordinator', data=start_data,
            headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
        urllib.request.urlopen(req)
        print(f'Started: {f.get(\"name\", fid)}')
    except Exception as e:
        print(f'Failed to start {f.get(\"name\", fid)}: {e}')

print(f'Run start timestamp: {run_start_ts}')
print()

# 3. Wait for all to complete — poll logs for ProcessE2EResults
start_time = time.time()
flow_status = {f['flowId']: 'running' for f in flows}
flow_names = {f['flowId']: f.get('name', f['flowId']) for f in flows}

def is_current_run(src):
    \"\"\"Check if a log entry is from the current run (after run_start_ts).\"\"\"
    ts = src.get('gridTimestamp', src.get('timestamp', ''))
    if not ts:
        return True  # If no timestamp, include it
    return ts >= run_start_ts

def check_flow_logs(fid):
    \"\"\"Check if ProcessE2EResults ran in flow logs. Returns 'done' or 'running'.\"\"\"
    try:
        req = urllib.request.Request(
            f'{base}/logs?flowId={fid}&from=0&size=50&sort=gridTimestamp:desc',
            headers={'Authorization': f'Bearer {token}'}
        )
        hits = json.loads(urllib.request.urlopen(req).read()).get('hits', [])
        for h in hits:
            src = h.get('_source', h)
            if not is_current_run(src):
                continue
            if 'ProcessE2EResults' in src.get('componentType', '') and not src.get('err'):
                return 'done'
    except:
        pass
    return 'running'

while True:
    elapsed = time.time() - start_time
    pending = [fid for fid, st in flow_status.items() if st == 'running']

    if not pending:
        break

    if elapsed >= timeout:
        print(f'Timeout after {int(elapsed)}s. Still running: {len(pending)} flow(s)')
        for fid in pending:
            # Last chance — check logs
            if check_flow_logs(fid) == 'done':
                try:
                    stop_data = json.dumps({'command': 'stop'}).encode()
                    req = urllib.request.Request(f'{base}/flows/{fid}/coordinator', data=stop_data,
                        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
                    urllib.request.urlopen(req)
                except:
                    pass
                flow_status[fid] = 'done'
            else:
                flow_status[fid] = 'timeout'
        break

    # Poll each pending flow: check logs for ProcessE2EResults, fallback to stage
    for fid in pending:
        if check_flow_logs(fid) == 'done':
            # Stop the flow
            try:
                stop_data = json.dumps({'command': 'stop'}).encode()
                req = urllib.request.Request(f'{base}/flows/{fid}/coordinator', data=stop_data,
                    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
                urllib.request.urlopen(req)
            except:
                pass
            flow_status[fid] = 'done'
            print(f'  {flow_names[fid]}: done ({int(elapsed)}s)')
        else:
            # Check if flow stopped on its own (e.g. error)
            try:
                req = urllib.request.Request(
                    f'{base}/flows/{fid}?projection=stage',
                    headers={'Authorization': f'Bearer {token}'}
                )
                stage = json.loads(urllib.request.urlopen(req).read()).get('stage', 'unknown')
                if stage in ('stopped', 'error'):
                    flow_status[fid] = 'stopped'
                    print(f'  {flow_names[fid]}: {stage} ({int(elapsed)}s)')
            except:
                pass

    pending_after = [fid for fid, st in flow_status.items() if st == 'running']
    if pending_after:
        time.sleep(5)

print()

# 4. Show results for each flow — parse logs for errors and ProcessE2EResults output
print('=' * 60)
print('RESULTS')
print('=' * 60)

pass_count = 0
fail_count = 0
timeout_count = 0

for f in flows:
    fid = f['flowId']
    fname = flow_names[fid]
    status = flow_status[fid]

    print(f'\\n--- {fname} ({status}) ---')

    if status == 'timeout':
        print('  TIMEOUT - flow did not complete (ProcessE2EResults never ran)')
        timeout_count += 1
        # Still show any component errors from logs (current run only)
        try:
            req = urllib.request.Request(
                f'{base}/logs?flowId={fid}&from=0&size=50&sort=gridTimestamp:desc',
                headers={'Authorization': f'Bearer {token}'}
            )
            hits = json.loads(urllib.request.urlopen(req).read()).get('hits', [])
            for h in hits:
                src = h.get('_source', h)
                if not is_current_run(src):
                    continue
                comp = src.get('componentType', '?')
                if comp in IGNORE_COMPONENTS or comp == '?':
                    continue
                err_raw = src.get('err', '')
                if err_raw:
                    try:
                        err = json.loads(err_raw) if isinstance(err_raw, str) else err_raw
                        msg = err.get('message', '')
                        resp = err.get('response', {}).get('data', {})
                        resp_str = json.dumps(resp)[:200] if resp else ''
                    except:
                        msg = str(err_raw)[:200]
                        resp_str = ''
                    print(f'  ❌ {comp}: {msg}')
                    if resp_str:
                        print(f'     Response: {resp_str}')
        except:
            pass
        continue

    # Get logs — parse errors and ProcessE2EResults output (current run only)
    try:
        req = urllib.request.Request(
            f'{base}/logs?flowId={fid}&from=0&size=50&sort=gridTimestamp:desc',
            headers={'Authorization': f'Bearer {token}'}
        )
        hits = json.loads(urllib.request.urlopen(req).read()).get('hits', [])

        errors = []
        process_e2e_output = None
        has_results = False

        for h in hits:
            src = h.get('_source', h)
            if not is_current_run(src):
                continue
            comp = src.get('componentType', src.get('componentId', '?'))
            err_raw = src.get('err', '')
            msg_raw = src.get('message', '')

            # Capture ProcessE2EResults output
            if 'ProcessE2EResults' in comp and not err_raw:
                has_results = True
                if msg_raw:
                    try:
                        process_e2e_output = json.loads(msg_raw) if isinstance(msg_raw, str) else msg_raw
                    except:
                        pass

            if err_raw:
                if comp in IGNORE_COMPONENTS or comp == '?':
                    continue
                try:
                    err = json.loads(err_raw) if isinstance(err_raw, str) else err_raw
                    msg = err.get('message', '')
                    resp = err.get('response', {}).get('data', {})
                    resp_str = json.dumps(resp)[:200] if resp else ''
                except:
                    msg = str(err_raw)[:200]
                    resp_str = ''
                if 'TokenError' not in msg:
                    errors.append({'comp': comp, 'msg': msg, 'resp': resp_str})

        # Show component errors
        if errors:
            print('  Component errors:')
            for e in errors:
                print(f'    ❌ {e[\"comp\"]}: {e[\"msg\"]}')
                if e['resp']:
                    print(f'       Response: {e[\"resp\"]}')

        # Show ProcessE2EResults assert results
        if has_results and process_e2e_output:
            successes = process_e2e_output.get('success', [])
            failures = process_e2e_output.get('error', process_e2e_output.get('errors', []))
            if failures:
                print(f'  Assert results: {len(successes)} passed, {len(failures)} FAILED')
                for item in failures:
                    label = item if isinstance(item, str) else json.dumps(item)[:120]
                    print(f'    ❌ {label}')
                fail_count += 1
            elif errors:
                print(f'  Assert results: {len(successes)} passed (but component errors above)')
                fail_count += 1
            else:
                print(f'  ✅ {len(successes)} assertion(s) passed')
                pass_count += 1
        elif has_results:
            # ProcessE2EResults ran but no parseable output
            if errors:
                fail_count += 1
            else:
                print('  ✅ ProcessE2EResults completed')
                pass_count += 1
        else:
            # No ProcessE2EResults but flow stopped
            if errors:
                fail_count += 1
            else:
                print('  ⚠️  No ProcessE2EResults found in logs')
                fail_count += 1

    except Exception as e:
        print(f'  Failed to get logs: {e}')
        fail_count += 1

print()
print('=' * 60)
total = pass_count + fail_count + timeout_count
print(f'TOTAL: {total} flow(s) | ✅ PASS: {pass_count} | ❌ FAIL: {fail_count} | ⏱ TIMEOUT: {timeout_count}')
print('=' * 60)

if fail_count > 0 or timeout_count > 0:
    sys.exit(1)
"
        ;;

    deploy-and-run)
        CONNECTOR="${1:?Usage: deploy-and-run <connector> [accountId]}"
        ACCOUNT_ID="${2:-}"
        TOKEN=$(get_token)

        # Determine CONNECTORS_DIR (parent of src/appmixer)
        SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
        # Walk up to find the repo root (contains src/appmixer)
        CONNECTORS_DIR="$SCRIPT_DIR"
        while [ ! -d "$CONNECTORS_DIR/src/appmixer" ] && [ "$CONNECTORS_DIR" != "/" ]; do
            CONNECTORS_DIR="$(dirname "$CONNECTORS_DIR")"
        done
        if [ ! -d "$CONNECTORS_DIR/src/appmixer" ]; then
            echo "ERROR: Could not find repository root with src/appmixer" >&2
            exit 1
        fi

        echo "=== Step 1: Pack and publish connector ==="
        cd "$CONNECTORS_DIR/src/appmixer" && appmixer pack "$CONNECTOR" && appmixer publish "appmixer.${CONNECTOR}.zip"
        echo ""

        echo "=== Step 2: Determine accountId ==="
        if [ -z "$ACCOUNT_ID" ]; then
            ACCOUNT_ID=$(curl -s "$BASE_URL/accounts" -H "Authorization: Bearer $TOKEN" | python3 -c "
import json, sys
accounts = json.load(sys.stdin)
service = 'appmixer:$CONNECTOR'
for a in accounts:
    if service in a.get('service', ''):
        print(a['accountId'])
        break
else:
    print('')
")
            if [ -z "$ACCOUNT_ID" ]; then
                echo "ERROR: No account found for appmixer:$CONNECTOR. Create one first." >&2
                exit 1
            fi
            echo "Auto-detected accountId: $ACCOUNT_ID"
        else
            echo "Using provided accountId: $ACCOUNT_ID"
        fi
        echo ""

        echo "=== Step 3: Upload all flows ==="
        FLOWS_DIR="$CONNECTORS_DIR/src/appmixer/$CONNECTOR/artifacts/test-flows"
        if [ ! -d "$FLOWS_DIR" ]; then
            echo "ERROR: Flows directory not found: $FLOWS_DIR" >&2
            exit 1
        fi

        # Re-use this script for upload-all
        "$0" upload-all "$FLOWS_DIR" "$CONNECTOR" "$ACCOUNT_ID"
        echo ""

        echo "=== Step 4: Run all E2E flows ==="
        "$0" run-all "$CONNECTOR" 180
        ;;

    *)
        echo "Unknown command: $CMD"
        echo "Commands: auth, create, get, start, stop, delete, patch-accounts, logs, wait-done,"
        echo "          create-account, list-accounts, list-e2e-flows, logs-summary, ensure-stores,"
        echo "          validate-variables, upload-flow, upload-all, run-all, deploy-and-run"
        exit 1
        ;;
esac
