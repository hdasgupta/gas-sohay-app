#!/usr/bin/env bash

# Check if folder path is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <folder_path>"
  exit 1
fi

TARGET_DIR="$1"

# Verify directory exists
if [ ! -d "$TARGET_DIR" ]; then
  echo "Error: Directory '$TARGET_DIR' does not exist."
  exit 1
fi

# Search for exact string in .js files excluding Database.js
grep -rnF "getDataRange().getValues()" \
  --include="*.js" \
  --exclude="Database.js" \
  "$TARGET_DIR"
