#!/usr/bin/env bash
# Sync each APM package manifest version from its package.json.
#
# The version in <pkg>/apm.yml is metadata: it answers "which package version
# does this skill describe". Nothing resolves against it, so it only has to
# stay equal to the npm version. Run as part of `changeset version`.
#
# Usage:
#   scripts/sync-apm-versions.sh           # write versions
#   scripts/sync-apm-versions.sh --check   # verify only, exit 1 on mismatch
set -euo pipefail

check=false
if [[ "${1:-}" == "--check" ]]; then
    check=true
fi

status=0
for manifest in packages/*/apm.yml config/*/apm.yml tsed/*/apm.yml; do
    [[ -e "$manifest" ]] || continue

    dir=$(dirname "$manifest")
    want=$(jq -r '.version' "$dir/package.json")
    have=$(yq -r '.version' "$manifest")

    [[ "$want" == "$have" ]] && continue

    if $check; then
        echo "out of sync: $manifest is $have, $dir/package.json is $want" >&2
        status=1
    else
        yq -i ".version = \"$want\"" "$manifest"
        echo "$manifest: $have -> $want"
    fi
done

exit $status
