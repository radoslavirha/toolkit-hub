#!/usr/bin/env bash
# Prepare a fresh clone for a Claude Code cloud session or routine.
#
# The cloud environment's setup script provisions the toolchain (Node 24,
# pnpm 11, apm) and is cached, so it never sees the per-session clone. This
# script does the per-clone part: dependencies, build, and the gitignored
# .claude/ and .agents/ trees that `apm install` restores from apm.lock.yaml.
#
# Usage:
#   bash scripts/cloud-bootstrap.sh
set -euo pipefail

cd "$(dirname "$0")/.."

node_major=$(node -p 'process.versions.node.split(".")[0]')
if (( node_major < 24 )); then
    echo "Node 24+ required, got $(node -v) — check the environment setup script" >&2
    exit 1
fi

for tool in pnpm apm; do
    command -v "$tool" >/dev/null || {
        echo "$tool not on PATH — check the environment setup script" >&2
        exit 1
    }
done

echo "node $(node -v), pnpm $(pnpm -v), $(apm --version)"

# tsed/mongoose tests start MongoDB through testcontainers. Docker is installed
# in the cloud image but the daemon isn't running, and the environment cache
# keeps files, not processes — so start it on every run.
start_docker() {
    docker info >/dev/null 2>&1 && return 0
    local sudo=""
    [[ "$(id -u)" != 0 ]] && command -v sudo >/dev/null && sudo="sudo"
    $sudo service docker start >/dev/null 2>&1 \
        || $sudo setsid nohup dockerd >/tmp/dockerd.log 2>&1 < /dev/null &
    for _ in $(seq 1 30); do
        docker info >/dev/null 2>&1 && return 0
        sleep 1
    done
    return 1
}
if command -v docker >/dev/null && start_docker; then
    echo "docker $(docker version --format '{{.Server.Version}}')"
else
    echo "WARN: Docker daemon unavailable — tsed/mongoose tests will fail for environment reasons, not bugs" >&2
fi

pnpm install --frozen-lockfile
# Workspace packages resolve each other through dist/, so tests need a build.
pnpm build

# Skills are useful but not required for test/lint, so don't fail the run.
# Fallback: read .apm/skills/*/SKILL.md and <pkg>/.apm/skills/*/SKILL.md.
apm install || echo "WARN: apm install failed — read skills from .apm/skills directly" >&2
