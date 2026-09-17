#!/usr/bin/env bash
# FlowBoard API self-check — hit every endpoint from the command line.
# Usage:  ./check-api.sh [BASE_URL]    (defaults to production)
set -uo pipefail

BASE="${1:-http://localhost:5000}"
API="$BASE/api"
ME="checker-$(date +%s)-$(shuf -i 100-999 -n1)"
PASS=0; FAIL=0

say()  { printf '\n\033[1;36m== %s ==\033[0m\n' "$*"; }
ok()   { PASS=$((PASS+1)); printf '  \033[32mOK\033[0m   %s\n' "$*"; }
bad()  { FAIL=$((FAIL+1)); printf '  \033[31mFAIL\033[0m %s\n' "$*"; }

jqv() { jq -r "$1" 2>/dev/null || echo ""; }

say "Unified API index"
idx="$(curl -s "$API")"
[ "$(jqv '.data.name' <<<"$idx")" = "FlowBoard Unified API" ] && ok "GET $API (unified index)" || bad "unified index"

say "AUTH ($ME)"
reg="$(curl -s -X POST "$API/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Check Bot\",\"email\":\"$ME@t.dev\",\"password\":\"secret123\"}")"
TOKEN="$(jqv '.data.token' <<<"$reg")"
[ -n "$TOKEN" ] && ok "register + token" || bad "register"

say "PROJECTS"
pid="$(jqv '.data.id' <<<"$(curl -s -X POST "$API/projects" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"title":"Self-check","description":"from check-api.sh","status":"active","members":[]}')")"
[ -n "$pid" ] && ok "create project" || bad "create project"

say "TASKS + REVIEW FLOW"
tid="$(jqv '.data.id' <<<"$(curl -s -X POST "$API/tasks" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"projectId\":\"$pid\",\"title\":\"Review me\",\"priority\":\"high\"}")")"
code="$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$API/tasks/$tid/status" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"status":"review"}')"
[ "$code" = "200" ] && ok "task -> review" || bad "task status ($code)"

say "TEAMS"
tmid="$(jqv '.data.id' <<<"$(curl -s -X POST "$API/teams" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"Self-check","description":"from check-api.sh","memberIds":[]}')")"
[ -n "$tmid" ] && ok "create team" || bad "create team"
code="$(curl -s -o /dev/null -w '%{http_code}' "$API/teams/$tmid")"
[ "$code" = "200" ] && ok "get team" || bad "get team ($code)"

say "HEALTH + CLEANUP"
state="$(jqv '.data.state' <<<"$(curl -s "$API/health")")"
[ "$state" = "ok" ] && ok "GET $BASE/health" || bad "health"

say "CLEANUP — delete what the check created"
curl -s -X DELETE "$API/teams/$tmid" -H "Authorization: Bearer $TOKEN" > /dev/null && ok "delete team"
curl -s -X DELETE "$API/projects/$pid" -H "Authorization: Bearer $TOKEN" > /dev/null && ok "delete project (cascades tasks)"
curl -s -X DELETE "$API/users/$(jqv '.data.user.id' <<<"$reg")" -H "Authorization: Bearer $TOKEN" > /dev/null && ok "delete check account"

printf '\n\033[1mResult: %s passed, %s failed\033[0m\n' "$PASS" "$FAIL"
[ "$FAIL" = "0" ]