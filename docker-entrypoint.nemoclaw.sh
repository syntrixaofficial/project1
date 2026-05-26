#!/bin/sh
set -eu

mkdir -p /var/lib/docker /var/log/nemoclaw

if [ ! -S /var/run/docker.sock ]; then
  dockerd \
    --host=unix:///var/run/docker.sock \
    --storage-driver=fuse-overlayfs \
    > /var/log/nemoclaw/dockerd.log 2>&1 &
fi

tries=0
until docker info >/dev/null 2>&1; do
  tries=$((tries + 1))
  if [ "$tries" -gt 90 ]; then
    echo "Docker daemon did not become ready. Recent dockerd logs:" >&2
    tail -n 120 /var/log/nemoclaw/dockerd.log >&2 || true
    exit 1
  fi
  sleep 1
done

if [ "${NEMOCLAW_PROVIDER:-}" = "custom" ]; then
  node /usr/local/bin/mock-inference-server.mjs >/var/log/nemoclaw/mock-inference.log 2>&1 &
fi

exec "$@"
