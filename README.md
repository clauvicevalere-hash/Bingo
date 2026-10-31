# Bingo — boutique high-tech Afrique de l'Ouest

Application e-commerce multi-pays (Burkina Faso, Mali, Niger, Côte d'Ivoire) :
catalogue high-tech, stock par pays, paiement à la livraison et Orange Money.

## Stack

- **Next.js 15** (App Router, React 19, TypeScript) — boutique + admin dans le même projet
- **Prisma 6 + SQLite** (PostgreSQL possible en production)
- **PWA** installable (manifest + service worker) → APK Android via Capacitor
- CSS maison (design system dans `src/app/globals.css`), aucune dépendance UI

## Démarrage

```bash
npm install
npx prisma generate
npx prisma db push
SKIP_IMAGES=1 node scripts/import-catalog.mjs   # ou sans SKIP_IMAGES pour télécharger les photos
node scripts/generate-icons.mjs
npm run build && npm run start
```

- Boutique : http://localhost:3000
- Admin : http://localhost:3000/admin — mot de passe dans `.env` (`ADMIN_PASSWORD`)

## Structure

```
src/app/(shop)/         boutique (accueil, rayon, produit, panier, commande, paiement, suivi…)
src/app/(admin)/admin   back-office (commandes, produits, stocks)
src/app/api/            API (commandes, pays, paiements Orange Money)
src/components/         composants partagés
src/lib/                db, auth, panier, formats, orange money
prisma/schema.prisma    modèle de données
scripts/                import du catalogue, images, icônes, entrypoint Docker
public/uploads/         images produits (webp, générées à l'import)
deploy/                 guide de déploiement VPS
docs/APK.md             génération de l'APK Android
```

## Modèle commercial

- **Prix** : conversion AED → XOF à l'import (`PRICE_RATE=165`, `PRICE_MARGIN=1.30`),
  arrondi à 500 FCFA. Modifiable dans `.env` puis réimport, ou produit par produit dans l'admin.
- **Stock** : une ligne par produit/variante **et par pays** (`BF`, `ML`, `NE`, `CI`),
  décrémenté à la commande dans une transaction.
- **Livraison** : frais par ville (`City.deliveryFee`), modifiables en base.
- **Commande** : sans création de compte ; suivi par numéro ou téléphone.

## Paiement Orange Money

Trois modes via `ORANGE_MODE` :

| Mode | Comportement |
|---|---|
| `off` | Orange Money masqué au checkout |
| `mock` | Parcours complet simulé (aucun débit), pour tester |
| `live` | API Orange réelle (OAuth + Web Payment) |

Variables :

```env
ORANGE_MODE="mock"
ORANGE_BASE_URL="https://api.orange.com"
ORANGE_CLIENT_ID=""
ORANGE_CLIENT_SECRET=""
ORANGE_MERCHANT_KEY=""
ORANGE_CURRENCY="XOF"
APP_URL="http://localhost:3000"
```

Endpoints :

- `POST /api/payments/orange/init` — initialise le paiement d'une commande
- `POST /api/payments/orange/webhook` — notification Orange (statut revérifié en live)
- `POST /api/payments/orange/mock/confirm` — validation du mode test uniquement

Passer en production : renseigner les trois clés, `ORANGE_MODE=live`, `APP_URL=https://…`,
puis déclarer le webhook `https://…/api/payments/orange/webhook` chez Orange.

## Admin

- Tableau de bord (commandes, CA livré, stock total)
- Commandes : recherche, filtre par statut, changement de statut, **marquer payé**
- **Bon de livraison imprimable** (`/admin/bon/:id`) pour les livraisons COD
- Produits : prix, ancien prix, catégorie, état, visibilité, mise en avant
- Stocks : quantités par variante et par pays, alertes stock faible

## Qualité & exploitation

- **Annulation** : remet automatiquement les articles en stock ; une commande annulée
  ne peut pas être réactivée.
- **Livraison offerte** : champ `freeAbove` par ville (activé dès qu'un seuil est renseigné).
- **SEO** : `sitemap.xml` (1 085 URLs), `robots.txt`, métadonnées Open Graph par produit,
  JSON-LD `Product` avec prix et disponibilité.
- **PWA** : service worker avec cache statique et page hors ligne (`/offline.html`).
- **Santé** : `GET /api/health` (statut + nombre de produits), healthcheck Docker.
- **WhatsApp** : bouton de confirmation de commande pré-rempli.
- **Sécurité admin** : cookie HMAC signé, routes `/admin` en `noindex`, API admin protégée.


## Déploiement

Voir [deploy/README.md](deploy/README.md) : Docker Compose, HTTPS Caddy, sauvegardes,
passage à PostgreSQL. Le premier démarrage peut importer le catalogue (`SEED_ON_START=1`).

## APK Android

Voir [docs/APK.md](docs/APK.md) : Capacitor charge la boutique en HTTPS ; génération du
`.aab` signé dans Android Studio. La configuration est dans `capacitor.config.ts`.

## À personnaliser

- `.env` : nom, téléphone, WhatsApp, e-mail, adresse, secrets
- Logo et icônes (`public/icons/icon.svg`)
- Photos produits : remplacer `public/uploads/products/*` par vos propres visuels
- Conditions de retour / garantie (`src/app/(shop)/retours/page.tsx`)
- Mentions légales (raison sociale, RCCM, IFU)

## État d'avancement

- Catalogue : **780 produits**, **1 395 images WebP**, **14 rayons**, **286 catégories**, **75 marques**
- Stock : **10 464 lignes** (produit/variante × 4 pays)
- Paiement : **COD** opérationnel ; **Orange Money** intégré (mock validé, live en attente des clés)
- PWA : manifest, service worker, icônes — installable
- Build de production : OK

### Reste à faire

1. Clés marchand Orange Money par pays → passer en `live`.
2. Remplacer les photos fournisseur par des visuels dont vous avez les droits.
3. Traduire les fiches produits en français.
4. Domaine + hébergement, puis APK signé et fiche Play Store.
