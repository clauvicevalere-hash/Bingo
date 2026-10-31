#!/bin/sh
set -e

# Valeurs par défaut si la plateforme ne les fournit pas.
export DATA_DIR="${DATA_DIR:-/app/data}"
export DATABASE_URL="${DATABASE_URL:-file:$DATA_DIR/dev.db}"

# Un seul disque persistant : base + images, exposées via public/uploads.
mkdir -p "$DATA_DIR/uploads"
if [ -d /app/public/uploads ] && [ ! -L /app/public/uploads ]; then
  cp -a /app/public/uploads/. "$DATA_DIR/uploads/" 2>/dev/null || true
  rm -rf /app/public/uploads
  ln -s "$DATA_DIR/uploads" /app/public/uploads
fi

# Base de démonstration complète (catalogue + images) livrée dans l'image.
if [ -f /app/prisma/seed.db ]; then
  NEED_SEED=0
  if [ ! -f "$DATA_DIR/dev.db" ]; then
    NEED_SEED=1
  else
    IMAGES=$(node -e "const{DatabaseSync}=require('node:sqlite');try{const d=new DatabaseSync(process.env.DATABASE_URL.replace(/^file:/,''),{readOnly:true});console.log(d.prepare('select count(*) c from ProductImage').get().c)}catch(e){console.log(0)}")
    if [ "$IMAGES" = "0" ]; then NEED_SEED=1; fi
  fi
  if [ "$NEED_SEED" = "1" ]; then
    echo "Installation de la base catalogue complète…"
    rm -f "$DATA_DIR/dev.db-wal" "$DATA_DIR/dev.db-shm" "$DATA_DIR/dev.db-journal"
    cp /app/prisma/seed.db "$DATA_DIR/dev.db"
    touch "$DATA_DIR/.seeded"
  fi
fi

npx prisma db push --skip-generate

# Repli : import du catalogue si aucune base de démonstration n'est disponible.
if [ "${SEED_ON_START:-1}" = "1" ] && [ ! -f "$DATA_DIR/.seeded" ]; then
  echo "Import initial du catalogue…"
  SKIP_IMAGES=1 node scripts/import-catalog.mjs
  touch "$DATA_DIR/.seeded"
fi

exec npm run start
