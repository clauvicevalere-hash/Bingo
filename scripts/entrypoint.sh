#!/bin/sh
set -e

# Base SQLite persistée dans le volume /app/prisma
npx prisma db push --skip-generate

# Premier démarrage : importer le catalogue (sans retélécharger les images,
# elles sont déjà dans /app/public/uploads)
if [ "${SEED_ON_START:-0}" = "1" ] && [ ! -f /app/prisma/.seeded ]; then
  echo "Import initial du catalogue…"
  SKIP_IMAGES=1 node scripts/import-catalog.mjs
  touch /app/prisma/.seeded
fi

exec npm run start
