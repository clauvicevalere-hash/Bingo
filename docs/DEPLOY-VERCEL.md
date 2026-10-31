# Déploiement sur Vercel — pourquoi pas encore, et comment y arriver

Vercel est excellent pour Next.js, mais **l'application actuelle n'est pas compatible
telle quelle** :

| Contrainte Vercel | Impact |
|---|---|
| Système de fichiers en lecture seule (hors `/tmp` éphémère) | SQLite ne peut pas écrire la base ; les commandes échouent |
| Pas de disque persistant | Les images uploadées dans l'admin disparaissent |
| Fonctions serverless | Les scripts longs (import du catalogue) ne tournent pas au démarrage |

Le build passerait, mais la boutique ne pourrait ni enregistrer une commande ni conserver
un produit ajouté.

## Ce qu'il faut pour un Vercel de production

1. **Base PostgreSQL managée** (Neon, Supabase ou Vercel Postgres)
   - Ajouter `prisma/schema.postgres.prisma` avec `provider = "postgresql"`
   - Script de build : copier ce schéma → `prisma/schema.prisma` avant `prisma generate`
   - Migrer les données : `pg_dump`/import du catalogue vers Neon
2. **Stockage des images** : Vercel Blob (ou S3/Cloudinary)
   - Remplacer l'écriture locale de `/api/admin/images` par un upload Blob
   - Servir les URLs Blob dans les fiches produit
3. **Import du catalogue** : script one-shot exécuté en local contre la base Neon
4. **Cron** : Vercel Cron pour `orders:release` (quotidien minimum)

C'est un chantier d'environ une demi-journée, sans risque pour la version Render.

## Recommandation

1. Déployer d'abord sur **Render** avec disque persistant (voir `docs/DEPLOY-RENDER.md`) :
   la boutique est réellement utilisable, commandes et uploads compris.
2. Ensuite, si vous voulez Vercel (edge, previews, domaine), faire la migration
   PostgreSQL + Blob. Le code est déjà structuré pour (Prisma, stockage isolé dans
   `/api/admin/images`).
