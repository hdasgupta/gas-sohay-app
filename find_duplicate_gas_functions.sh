#!/usr/bin/env bash

# Exit if no path argument is supplied
if [ "$#" -eq 0 ]; then
  echo "Error: No directory path provided."
  echo "Usage: $0 <path1> [path2 ...]"
  echo "Example: $0 ./src /path/to/lib"
  exit 1
fi

echo "Scanning for duplicate JS functions in: $@"
echo "--------------------------------------------------"

# Collect duplicate function names across all paths (excluding node_modules and dist)
DUPLICATE_NAMES=$(find "$@" -type f -name "*.js" ! -path "*/node_modules/*" ! -path "*/dist/*" \
  -exec grep -hE "^\s*(async\s+)?function\s*\*?\s+([a-zA-Z0-9_$]+)|^\s*(const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(async\s+)?(\([^)]*\)|[a-zA-Z0-9_$]+)?\s*=>" {} + 2>/dev/null | \
  sed -E 's/^\s*(const|let|var)\s+([a-zA-Z0-9_$]+).*/\2/; s/.*function\s*\*?\s+([a-zA-Z0-9_$]+).*/\1/' | \
  sort | \
  uniq -d)

if [ -z "$DUPLICATE_NAMES" ]; then
  echo "No duplicate function definitions found."
  exit 0
fi

# Print files and line numbers for each duplicate function found
echo "$DUPLICATE_NAMES" | while read -r fn_name; do
  [ -z "$fn_name" ] && continue
  echo ">>> Duplicate function found: '$fn_name'"
  find "$@" -type f -name "*.js" ! -path "*/node_modules/*" ! -path "*/dist/*" \
    -exec grep -HnE "(function\s*\*?\s+${fn_name}\b|(const|let|var)\s+${fn_name}\s*=)" {} + 2>/dev/null
  echo ""
done

