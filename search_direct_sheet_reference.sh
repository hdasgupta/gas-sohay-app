#!/bin/bash

# Target directory (defaults to current directory if omitted)
TARGET_DIR="${1:-.}"

echo "Scanning JS files for SpreadsheetApp.getActiveSpreadsheet().getSheetByName..."
echo "Excluding Database.js"
echo "--------------------------------------------------------------------------------"

# -r : Recursive search
# -n : Output line numbers
# --exclude : Skip Database.js
# --include : Only process .js files
grep -rn \
  --exclude="Database.js" \
  --include="*.js" \
  -E 'SpreadsheetApp\s*\.\s*getActiveSpreadsheet\s*\(\s*\)\s*\.\s*getSheetByName' \
  "$TARGET_DIR" \
  | awk -F':' '{printf "%s:%s -> %s\n", $1, $2, $3}'
