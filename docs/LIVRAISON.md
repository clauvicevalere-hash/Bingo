# Bingo — dossier de livraison

## 1. En résumé

Boutique e-commerce multi-pays (Burkina Faso, Mali, Niger, Côte d'Ivoire) avec :

- catalogue high-tech **780 produits** importé de Mustaqbal Zamzam, **1 690 images** WebP,
  **14 rayons**, **286 catégories**, **75 marques** ;
- **stock par pays** (4 pays), variantes (stockage/couleur) avec prix et stock propres ;
- prix en **FCFA (XOF)**, conversion AED → XOF paramétrable ;
- **paiement à la livraison** opérationnel et **Orange Money** intégré (mode test validé) ;
- back-office complet : commandes, bons de livraison, produits, variantes, images,
  catégories, stocks, avis clients, tableau de bord analytique ;
- **PWA installable** et **APK Android** (4 Mo) ;
- boutique publique accessible via un tunnel HTTPS temporaire.

## 2. Accès

| Élément | Valeur |
|---|---|
| Boutique (démo) | voir l'URL `trycloudflare.com` fournie dans la conversation |
| Admin | `/admin` |
| Mot de passe admin | dans `.env` (`ADMIN_PASSWORD`), à changer |
| APK | `dist/bingo-debug.apk` |
| Code source | dépôt Git local (branche `master`) |

> Le tunnel est temporaire : il ne vit que tant que l'application et `cloudflared`
> tournent sur ce PC. Voir `deploy/README.md` pour un hébergement permanent.

## 3. Architecture

```
Next.js 15 (App Router, React 19, TypeScript)
  ├── boutique (src/app/(shop))
  ├── admin (src/app/(admin))
  └── API (src/app/api)
Prisma 6 + SQLite (dev.db)  → PostgreSQL possible
Sharp (images WebP) · PWA (manifest + service worker)
Capacitor 8 → projet Android (android/)
Docker + Caddy (déploiement VPS) · cloudflared (démo)
```

## 4. Fonctionnalités vérifiées

- Commande sans compte, frais par ville, livraison offerte au-delà d'un seuil
- Décrément du stock transactionnel, remise en stock à l'annulation
- Orange Money : init, page de paiement, webhook, mode `mock` testé de bout en bout
- Avis clients modérés, note agrégée, `aggregateRating` JSON-LD
- Recherche bilingue FR/EN (`occasion` → `Used`)
- Sitemap 1 085 URLs, robots, Open Graph, JSON-LD produit
- Sécurité : en-têtes HTTP, rate limiting commandes/avis, cookie admin HMAC
- Sauvegarde cohérente SQLite (`npm run backup`)

## 5. Exploitation

```bash
npm run build && npm run start     # production locale
npm run preflight                  # contrôle avant mise en ligne
npm run backup                     # sauvegarde base + images
npm run orders:release             # libère les Orange impayées > 24 h
npm run tunnel                     # lien public temporaire
```

Cron recommandés (voir `deploy/README.md`) : `orders:release` chaque heure,
`backup` chaque nuit.

## 6. Mise en production — checklist

1. **Serveur** : VPS Ubuntu 2 Go ou Render/Railway.
2. **Domaine** : DNS A vers le serveur, HTTPS via Caddy (obligatoire pour PWA/webhooks).
3. **Docker** : `docker compose up -d --build` (voir `deploy/README.md`).
4. **`.env`** : `ADMIN_PASSWORD` fort, `SESSION_SECRET` aléatoire 64 caractères,
   `APP_URL=https://…`, `ORANGE_MODE=live` + clés marchand.
5. **Orange Money** : déclarer le webhook `https://…/api/payments/orange/webhook`.
6. **Données** : le premier démarrage importe le catalogue (`SEED_ON_START=1`) ;
   vérifier ensuite `npm run preflight`.
7. **APK** : `CAPACITOR_SERVER_URL=https://…` puis `npx cap sync android` et
   `gradlew assembleDebug` (ou `bundleRelease` signé pour le Play Store).
8. **Play Store** : compte développeur, fiche, captures, politique de confidentialité
   (page `/mentions` à compléter avec RCCM/IFU).

## 7. Limites connues

- **Photos** : visuels du fournisseur, à remplacer par des photos dont vous avez les droits.
- **Descriptions** : encore en anglais ; prêtes à traduire avec une clé DeepL.
- **Orange Money** : mode `mock` ; l'API réelle attend les identifiants marchand.
- **Déploiement** : tunnel temporaire, pas d'hébergement permanent.
- **SQLite** : adapté à un trafic modéré ; passer à PostgreSQL au-delà.
- **APK** : signature debug, non publiable tel quel sur le Play Store.

## 8. Prochaines étapes

1. Fournir **serveur + domaine** → déploiement définitif et préflight réel.
2. Fournir **clés Orange Money** → paiement live.
3. Fournir **clé DeepL** (optionnel) → traduction des fiches.
4. Valider **photos et mentions légales** avant diffusion publique.
