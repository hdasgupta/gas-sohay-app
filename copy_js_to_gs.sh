#!/bin/bash

# Usage: ./copy_js_to_gs.sh [SOURCE_DIR] [DEST_DIR]
# Default: copies from current directory to 'gs_files'

SRC_DIR="${1:-.}"
DEST_DIR="${2:-.}"

# Create destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Loop through all .js files in the source directory
for file in "$SRC_DIR"/*.js; do
  # Check if matching files actually exist
  [ -f "$file" ] || continue

  filename=$(basename "$file")
  cp "$file" "$DEST_DIR/${filename%.js}.gs"
done

echo "Copied .js files from '$SRC_DIR' to '$DEST_DIR' with .gs extension."
