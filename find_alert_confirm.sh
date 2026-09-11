#!/bin/bash

# Target directory (defaults to current directory if omitted)
TARGET_DIR="${1:-.}"

echo "Scanning for alert, confirm, and window.confirm calls..."
echo "--------------------------------------------------------------------------------"

# -r : Search recursively
# -n : Print line numbers
# -E : Extended regular expressions
# --include : Restrict search to .jsx (and .js) files
grep -rn -E \
  --include="*.jsx" \
  '\b(window\.)?(alert|confirm)\s*\(' \
  "$TARGET_DIR"
