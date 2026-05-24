#!/bin/sh
set -eu

mkdir -p /home/openclaw/.openclaw
mkdir -p /var/tmp/openclaw-compile-cache
chown -R openclaw:openclaw /home/openclaw/.openclaw
chown -R openclaw:openclaw /var/tmp/openclaw-compile-cache

if [ "$#" -eq 0 ]; then
  set -- openclaw --version
fi

exec su openclaw -c "$(printf '%s ' "$@")"
