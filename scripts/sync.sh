#!/usr/bin/env bash
set -e

echo "Fetching Kanka data and building site..."
npm run kanka:sync

echo "Staging generated files..."
git add docs/data docs/assets/maps/previews

if git diff --cached --quiet; then
  echo "Nothing changed, skipping commit."
else
  git commit -m "Sync latest Kanka data"
  git push
  echo "Done."
fi
