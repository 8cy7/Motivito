#!/bin/bash

# Find all build.gradle files in node_modules that use "node" command
find node_modules -name "build.gradle" -type f | while read file; do
  if grep -q 'commandLine("node"' "$file" 2>/dev/null; then
    echo "Fixing: $file"
    sed -i.bak 's/commandLine("node"/commandLine("\/usr\/local\/bin\/node"/g' "$file"
  fi
done

echo "Done! All build.gradle files have been updated."
