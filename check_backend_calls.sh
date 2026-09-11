#!/bin/bash

# Directory arguments (Defaults: $1 = jsx folder, $2 = js folder)
JSX_DIR="${1:-.}"
JS_DIR="${2:-.}"

DECLARED_FILE=$(mktemp)
trap 'rm -f "$DECLARED_FILE"' EXIT

echo "Scanning JS files in '$JS_DIR' for declared functions..."

# 1. Collect all declared function names across all .js files
grep -r -E -o '\b(function|async function)\s+([a-zA-Z0-9_$]+)|\b(const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*|\b([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{|\b([a-zA-Z0-9_$]+)\s*:' "$JS_DIR" --include="*.js" 2>/dev/null \
  | awk -F':' '{print $2}' \
  | sed -E 's/^(function|async function)\s+//; s/^(const|let|var)\s+//; s/\s*=.*//; s/\s*\(.*//; s/\s*:.*//' \
  | tr -d ' ' \
  | sort -u > "$DECLARED_FILE"

echo "Scanning JSX files in '$JSX_DIR' for callBackend invocations..."
echo "--------------------------------------------------------------------------------"

# Regex using hex codes: \x22 = ", \x27 = ', \x60 = `
PATTERN='callBackend[[:space:]]*\([[:space:]]*[\x22\x27\x60][a-zA-Z0-9_$]+[\x22\x27\x60]'

# 2. Extract callBackend calls with filename and line number
grep -rn -E "$PATTERN" "$JSX_DIR" --include="*.jsx" --include="*.js" 2>/dev/null \
  | awk -F':' -v decl_file="$DECLARED_FILE" '
  BEGIN {
      while ((getline line < decl_file) > 0) {
          if (length(line) > 0) {
              declared[line] = 1
          }
      }
      close(decl_file)
  }
  {
      file = $1
      line_num = $2

      code_str = ""
      for (i = 3; i <= NF; i++) {
          code_str = (i == 3) ? $i : code_str ":" $i
      }

      while (match(code_str, /callBackend[[:space:]]*\([[:space:]]*[\x22\x27\x60][a-zA-Z0-9_$]+[\x22\x27\x60]/)) {
          matched = substr(code_str, RSTART, RLENGTH)

          sub(/^callBackend[[:space:]]*\([[:space:]]*[\x22\x27\x60]/, "", matched)
          sub(/[\x22\x27\x60]$/, "", matched)
          func_name = matched

          if (length(func_name) > 0 && !(func_name in declared)) {
              printf "%s:%s -> callBackend(\"%s\") [Method not found in JS folder]\n", file, line_num, func_name
          }

          code_str = substr(code_str, RSTART + RLENGTH)
      }
  }'
