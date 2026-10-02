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
# keeps files, not processes — so start it on every cloud run. Locally, only
# report whether a daemon is reachable.
docker_ok() { timeout 5 docker info >/dev/null 2>&1; }

start_docker() {
    docker_ok && return 0
    [[ "${CLAUDE_CODE_REMOTE:-}" == "true" ]] || return 1
    local sudo=""
    [[ "$(id -u)" != 0 ]] && command -v sudo >/dev/null && sudo="sudo"
    # The environment snapshot can carry a stale pid file and socket from the
    # setup script's daemon, which stop a new one from starting.
    $sudo rm -f /var/run/docker.pid /var/run/docker.sock
    # Background only dockerd, with no inherited stdio: a backgrounded group
    # would keep this script's output pipe open, and the caller would wait on
    # it for as long as the daemon runs.
    $sudo setsid nohup dockerd >/tmp/dockerd.log 2>&1 </dev/null &
    for _ in $(seq 1 30); do
        docker_ok && return 0
        sleep 1
    done
    return 1
}

echo "starting docker..."
if command -v docker >/dev/null && start_docker; then
    echo "docker $(docker version --format '{{.Server.Version}}')"
else
    echo "WARN: Docker daemon unavailable — tsed/mongoose tests will fail for environment reasons, not bugs (see /tmp/dockerd.log)" >&2
fi

pnpm install --frozen-lockfile
# Workspace packages resolve each other through dist/, so tests need a build.
pnpm build

# Skills are useful but not required for test/lint, so don't fail the run.
# Fallback: read .apm/skills/*/SKILL.md and <pkg>/.apm/skills/*/SKILL.md.
apm install || echo "WARN: apm install failed — read skills from .apm/skills directly" >&2
