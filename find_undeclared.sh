#!/bin/bash

# Target directory (defaults to current directory if omitted)
TARGET_DIR="${1:-.}"

DECLARED_FILE=$(mktemp)
EXCLUDE_FILE=$(mktemp)

# Clean up temp files automatically on script exit
trap 'rm -f "$DECLARED_FILE" "$EXCLUDE_FILE"' EXIT

# Embedded list of JS keywords, primitive/built-in data types, and standard runtime globals
cat << 'EOF' > "$EXCLUDE_FILE"
if for while do switch case default break continue return throw try catch finally yield await async import export typeof instanceof void delete new this super class extends function var let const debugger with String Number Boolean Array Object Function Symbol BigInt Math JSON Date RegExp Error Promise Map Set WeakMap WeakSet Proxy Reflect Intl ArrayBuffer DataView Float32Array Float64Array Int8Array Int16Array Int32Array Uint8Array Uint16Array Uint32Array parseInt parseFloat isNaN isFinite encodeURI encodeURIComponent decodeURI decodeURIComponent eval setTimeout setInterval clearTimeout clearInterval fetch console require log alert
EOF

echo "Scanning JS files in: $TARGET_DIR"
echo "-------------------------------------------------"

# Function to strip // and /* */ comments line-by-line via pure AWK
strip_comments() {
  awk '
  BEGIN { in_comment = 0 }
  {
      line = $0
      out = ""
      len = length(line)
      for (i = 1; i <= len; i++) {
          c2 = substr(line, i, 2)
          if (in_comment) {
              if (c2 == "*/") {
                  in_comment = 0
                  i++
              }
          } else {
              if (c2 == "//") {
                  break
              } else if (c2 == "/*") {
                  in_comment = 1
                  i++
              } else {
                  out = out substr(line, i, 1)
              }
          }
      }
      print out
  }' "$1"
}

# 1. Extract declared function names across all JS files
find "$TARGET_DIR" -type f -name "*.js" 2>/dev/null | while read -r file; do
  strip_comments "$file" \
  | grep -E -o '\b(function|async function)\s+\*?([a-zA-Z0-9_$]+)|\b(const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(\([^)]*\)|[a-zA-Z0-9_$]+)?\s*=>|\b(const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*function' \
  | sed -E 's/^(function|async function)\s+\*?//; s/^(const|let|var)\s+//; s/\s*=.*//; s/\s*\(.*//' \
  | tr -d ' '
done | sort -u > "$DECLARED_FILE"

# 2. Extract called functions and map precise line numbers
find "$TARGET_DIR" -type f -name "*.js" 2>/dev/null | while read -r file; do
  strip_comments "$file" \
  | awk -v file="$file" -v decl_file="$DECLARED_FILE" -v excl_file="$EXCLUDE_FILE" '
  BEGIN {
      while ((getline line < decl_file) > 0) declared[line] = 1
      close(decl_file)
      while ((getline line < excl_file) > 0) {
          split(line, words, " ")
          for (w in words) excluded[words[w]] = 1
      }
      close(excl_file)
  }
  {
      line_str = $0
      # Match function invocations not preceded by object dots
      while (match(line_str, /(^|[^a-zA-Z0-9_$.])\b[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/)) {
          matched = substr(line_str, RSTART, RLENGTH)
          match(matched, /[a-zA-Z_$][a-zA-Z0-9_$]*/)
          func_name = substr(matched, RSTART, RLENGTH)

          if (length(func_name) > 0 && !(func_name in declared) && !(func_name in excluded)) {
              printf "%s:%d -> %s()\n", file, NR, func_name
          }
          line_str = substr(line_str, RSTART + RLENGTH)
      }
  }'
done
