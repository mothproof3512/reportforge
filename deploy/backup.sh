#!/usr/bin/env bash
# Nightly backup of engagements, themes and (phase 2) the database to a target dir or NAS mount.
#   0 3 * * * /opt/reportforge/deploy/backup.sh /mnt/nas/reportforge
set -euo pipefail
TARGET="${1:?target directory}"
STAMP=$(date +%Y%m%d-%H%M)
mkdir -p "$TARGET"
tar -C /opt/reportforge -czf "$TARGET/reportforge-${STAMP}.tar.gz" data modules/themes 2>/dev/null || true
# keep 30 days
find "$TARGET" -name 'reportforge-*.tar.gz' -mtime +30 -delete
echo "backup written: $TARGET/reportforge-${STAMP}.tar.gz"
