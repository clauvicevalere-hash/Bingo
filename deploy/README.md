# Déploiement

Guides dédiés :

- **Render** (le plus simple, disque persistant) : [docs/DEPLOY-RENDER.md](../docs/DEPLOY-RENDER.md)
- **Vercel** : [docs/DEPLOY-VERCEL.md](../docs/DEPLOY-VERCEL.md) — nécessite PostgreSQL + stockage externe

## Démo temporaire (sans serveur)

Pour montrer la boutique ou tester l'installation PWA sur un téléphone avant
d'avoir un hébergement :

```bash
node scripts/download-cloudflared.mjs   # une seule fois
node scripts/tunnel.mjs                 # affiche une URL https://…trycloudflare.com
```

Le lien ne fonctionne que tant que le processus tourne et que l'application est lancée.
Mettre `APP_URL` à cette URL puis redémarrer l'app pour des liens absolus corrects
(images Open Graph, retour de paiement). Ce n'est **pas** un hébergement de production.

## Déploiement permanent

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
Un seul volume `bingo-data` est monté sur `/app/data` : il contient la base `dev.db`
et les images (`uploads/`), exposées via `public/uploads`.

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

## Tâches planifiées

Les commandes Orange Money non payées bloquent du stock. Les libérer chaque heure :

```cron
0 * * * * cd /opt/bingo && docker compose exec -T bingo node scripts/release-stale-orders.mjs 24 >> /var/log/bingo-orders.log 2>&1
```

Sans Docker :

```cron
0 * * * * cd /opt/bingo && node scripts/release-stale-orders.mjs 24 >> /var/log/bingo-orders.log 2>&1
```

Sauvegarde quotidienne (copie SQLite cohérente + images, 5 dernières conservées) :

```cron
30 2 * * * cd /opt/bingo && docker compose exec -T bingo npm run backup >> /var/log/bingo-backup.log 2>&1
```

Sans Docker :

```cron
30 2 * * * cd /opt/bingo && npm run backup >> /var/log/bingo-backup.log 2>&1
```



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

Le volume `bingo-data` contient la base (`dev.db`) et les images (`uploads/`) :

```bash
docker run --rm -v bingo_bingo-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/bingo-data-$(date +%F).tar.gz -C /data .
```

Ou, depuis le conteneur, `npm run backup` (copie cohérente SQLite + images).

## Passage à PostgreSQL (au-delà de ~50 commandes/jour)

1. Changer `provider = "postgresql"` dans `prisma/schema.prisma`
2. `DATABASE_URL="postgresql://..."`, puis `npx prisma migrate deploy`
3. Réimporter le catalogue.

Le schéma Prisma est compatible ; seules les valeurs par défaut SQLite disparaissent.
