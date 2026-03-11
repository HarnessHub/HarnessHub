#!/usr/bin/env bash
set -euo pipefail

export OPENPRECEDENT_HOME="${OPENPRECEDENT_HOME:-$HOME/.openprecedent/runtime}"
echo "OPENPRECEDENT_HOME=$OPENPRECEDENT_HOME"

exec "$@"
