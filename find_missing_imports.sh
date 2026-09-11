#!/bin/bash

# Target directory containing JSX/JS views (defaults to current directory)
TARGET_DIR="${1:-.}"

echo "Scanning JSX view files in: $TARGET_DIR"
echo "--------------------------------------------------------------------------------"

# Standard React built-in components to exclude
EXCLUDED="React|Fragment|Suspense|Profiler|StrictMode"

find "$TARGET_DIR" -type f \( -name "*.jsx" -o -name "*.js" -o -name "*.tsx" \) 2>/dev/null | while read -r file; do
  awk -v file="$file" -v exclude_pattern="^($EXCLUDED)$" '
  BEGIN {
      used_count = 0
  }
  {
      line = $0

      # Remove single-line comments
      sub(/\/\/.*/, "", line)

      # 1. Capture Default Imports: import MyComponent from "./MyComponent"
      if (line ~ /import[[:space:]]+[A-Z][a-zA-Z0-9_$]*/) {
          match(line, /import[[:space:]]+[A-Z][a-zA-Z0-9_$]*/)
          str = substr(line, RSTART, RLENGTH)
          sub(/import[[:space:]]+/, "", str)
          declared[str] = 1
      }

      # 2. Capture Named Imports: import { Header, Button as Btn } from "./components"
      if (line ~ /import[[:space:]]*\{[^}]+\}/) {
          match(line, /\{[^}]+\}/)
          block = substr(line, RSTART + 1, RLENGTH - 2)
          n = split(block, parts, ",")
          for (i = 1; i <= n; i++) {
              gsub(/[[:space:]]/, "", parts[i])
              # Handle aliased imports ("Button as MyButton")
              if (parts[i] ~ /as[[:space:]]*/) {
                  sub(/.*as[[:space:]]*/, "", parts[i])
              }
              if (parts[i] ~ /^[A-Z][a-zA-Z0-9_$]*$/) {
                  declared[parts[i]] = 1
              }
          }
      }

      # 3. Capture Local Declarations: const Header = () => ..., function Header(), class Header
      if (line ~ /(const|let|var|function|class)[[:space:]]+[A-Z][a-zA-Z0-9_$]*/) {
          match(line, /(const|let|var|function|class)[[:space:]]+[A-Z][a-zA-Z0-9_$]*/)
          str = substr(line, RSTART, RLENGTH)
          sub(/(const|let|var|function|class)[[:space:]]+/, "", str)
          declared[str] = 1
      }

      # 4. Extract JSX Component Usage: <ComponentName or <ComponentName.SubComponent
      line_str = line
      while (match(line_str, /<[A-Z][a-zA-Z0-9_$]*/)) {
          comp = substr(line_str, RSTART + 1, RLENGTH - 1)

          if (!(comp ~ exclude_pattern)) {
              used_line[used_count] = NR
              used_comp[used_count] = comp
              used_count++
          }
          line_str = substr(line_str, RSTART + RLENGTH)
      }
  }
  END {
      for (i = 0; i < used_count; i++) {
          c = used_comp[i]
          l = used_line[i]
          if (!(c in declared)) {
              printf "%s:%d -> <%s />\n", file, l, c
          }
      }
  }' "$file"
done
