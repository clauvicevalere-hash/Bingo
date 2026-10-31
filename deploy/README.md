# Déploiement

## Option 1 — VPS avec Docker (recommandé)

Prérequis : un VPS Ubuntu 22.04+ (2 Go RAM), un nom de domaine pointant vers son IP.

```bash
# 1. Docker
curl -fsSL https://get.docker.com | sh

# 2. Copier le projet sur le serveur (git clone ou rsync)
cd /opt/bingo

# 3. Configuration
cp .env .env.production
nano .env.production
```

À modifier impérativement en production :

```env
ADMIN_PASSWORD="un-mot-de-passe-fort"
SESSION_SECRET="une-chaine-aleatoire-de-64-caracteres"
APP_URL="https://votre-domaine.com"
ORANGE_MODE="live"          # après réception des clés marchand
ORANGE_CLIENT_ID="..."
ORANGE_CLIENT_SECRET="..."
ORANGE_MERCHANT_KEY="..."
```

Puis :

```bash
docker compose up -d --build
docker compose logs -f bingo
```

Le premier démarrage crée la base et importe le catalogue (`SEED_ON_START=1`).
Les images sont servies depuis le volume `bingo-uploads`.

## Option 2 — Sans Docker

```bash
npm ci
npx prisma generate
npx prisma db push
SKIP_IMAGES=1 node scripts/import-catalog.mjs
npm run build
npm run start
```

Un gestionnaire de processus (systemd, pm2) doit maintenir `npm run start`.

## HTTPS avec Caddy

```caddyfile
votre-domaine.com {
    reverse_proxy 127.0.0.1:3000
}
```

Caddy gère automatiquement les certificats Let's Encrypt. HTTPS est **obligatoire**
pour que la PWA soit installable et pour les webhooks Orange Money.

## Webhook Orange Money

À déclarer côté Orange : `https://votre-domaine.com/api/payments/orange/webhook`

En mode `live`, chaque notification est revérifiée auprès de l'API Orange
(`transactionstatus`) avant de marquer la commande comme payée.

## Sauvegardes

La base SQLite vit dans le volume `bingo-db` (`/app/prisma/dev.db`) :

```bash
docker run --rm -v bingo_bingo-db:/data -v $(pwd):/backup alpine \
  tar czf /backup/bingo-db-$(date +%F).tar.gz -C /data .
```

Sauvegarder également le volume `bingo-uploads` (photos produits).

## Passage à PostgreSQL (au-delà de ~50 commandes/jour)

1. Changer `provider = "postgresql"` dans `prisma/schema.prisma`
2. `DATABASE_URL="postgresql://..."`, puis `npx prisma migrate deploy`
3. Réimporter le catalogue.

Le schéma Prisma est compatible ; seules les valeurs par défaut SQLite disparaissent.
