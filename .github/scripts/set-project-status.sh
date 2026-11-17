#!/usr/bin/env bash
# Set the Status of an issue on the roadmap project (kchavez05/projects/1).
# Usage: set-project-status.sh <issue-number> "<Status>" [--dry-run]
# Needs GH_TOKEN (or a gh login) with Projects read/write. Never prints the token.
set -euo pipefail

issue="${1:?issue number required}"
status="${2:?status name required}"
dry_run="${3:-}"
repo="${GITHUB_REPOSITORY:-kchavez05/produce-price-tracker}"
owner="${repo%%/*}"; name="${repo##*/}"
project_number="${PROJECT_NUMBER:-1}"

case "$issue" in ''|*[!0-9]*) echo "invalid issue number" >&2; exit 2;; esac

meta=$(gh api graphql \
  -f owner="$owner" -f name="$name" -F number="$issue" -F project="$project_number" \
  -f query='query($owner:String!,$name:String!,$number:Int!,$project:Int!){
    user(login:$owner){projectV2(number:$project){id
      field(name:"Status"){... on ProjectV2SingleSelectField{id options{id name}}}}}
    repository(owner:$owner,name:$name){issue(number:$number){state
      projectItems(first:20){nodes{id project{number}}}}}}')

project_id=$(jq -r '.data.user.projectV2.id' <<<"$meta")
field_id=$(jq -r '.data.user.projectV2.field.id' <<<"$meta")
option_id=$(jq -r --arg s "$status" '.data.user.projectV2.field.options[]|select(.name==$s)|.id' <<<"$meta")
item_id=$(jq -r --argjson p "$project_number" \
  '.data.repository.issue.projectItems.nodes[]|select(.project.number==$p)|.id' <<<"$meta")

[ -n "$option_id" ] || { echo "unknown Status: $status" >&2; exit 1; }
[ -n "$item_id" ] || { echo "issue #$issue is not on project $project_number" >&2; exit 1; }

if [ "$dry_run" = "--dry-run" ]; then
  echo "[dry-run] would set #$issue -> $status"
  exit 0
fi

gh project item-edit --id "$item_id" --project-id "$project_id" \
  --field-id "$field_id" --single-select-option-id "$option_id" >/dev/null
echo "#$issue -> $status"
