# Déploiement sur Render (recommandé pour démarrer)

Render exécute l'image Docker avec un **disque persistant** : la base SQLite et les images
survivent aux redéploiements. C'est la cible la plus simple pour cette application.

> Un disque Render nécessite le plan **Starter** (≈ 7 $/mois). En plan gratuit, la base
> est perdue à chaque redéploiement/redémarrage — utilisable seulement pour une démo.

## 1. Pousser le code sur GitHub

Le dépôt `clauvicevalere-hash/Bingo` est vide. Depuis le dossier du projet :

```bash
cd C:\Users\Tresor\Documents\ecommerce\Bingo
git remote set-url origin https://github.com/clauvicevalere-hash/Bingo.git
git push -u origin master:main
```

La première fois, Git Credential Manager ouvre le navigateur : connectez-vous à GitHub
et autorisez. Vérifiez ensuite que les fichiers apparaissent sur GitHub (≈ 1 950 fichiers,
36 Mo avec les images).

## 2. Créer le service Render

1. Ouvrez <https://dashboard.render.com> → **New** → **Blueprint**.
2. Connectez GitHub et sélectionnez le dépôt `Bingo`.
3. Render détecte `render.yaml` → **Apply**.
4. Renseignez les variables demandées :
   - `ADMIN_PASSWORD` : un mot de passe fort
   - `APP_URL` : laissez pour l'instant `https://bingo.onrender.com`, vous le corrigerez
   - `SITE_WHATSAPP`, `SITE_PHONE`, `SITE_EMAIL`, `SITE_ADDRESS` : vos coordonnées
   - `SESSION_SECRET` est généré automatiquement
5. Lancez le déploiement.

## 3. Suivre le premier démarrage

Dans **Logs**, vous devez voir :

```
Import initial du catalogue…
780/780 produits…
✓ Ready
```

Le premier build prend ~5–8 minutes (installation + build Next + import).
Le healthcheck `/api/health` doit passer au vert.

## 3 bis. Déploiement manuel

Si Render ne redéploie pas après un `git push` (auto-deploy désactivé) :
service → **Manual Deploy** → **Deploy latest commit**.

Variables d'environnement recommandées (Environment) :

| Clé | Valeur |
|---|---|
| `ADMIN_PASSWORD` | mot de passe admin de votre choix |
| `SESSION_SECRET` | chaîne aléatoire de 64 caractères |
| `APP_URL` | `https://bingo-xxxx.onrender.com` (ou votre domaine) |
| `ORANGE_MODE` | `mock` pour tester, `live` avec les clés |
| `SITE_*` | téléphone, WhatsApp, e-mail, adresse |

Sans ces variables, l'entrypoint génère automatiquement `SESSION_SECRET` et
`ADMIN_PASSWORD` ; le mot de passe admin est alors affiché **une seule fois dans les logs**
et conservé dans `/app/data/admin-password.txt` sur le disque.

L'URL publique est aussi déduite des en-têtes de requête (`x-forwarded-host`) : le sitemap,
les images Open Graph et les retours de paiement utilisent donc automatiquement le bon domaine.

## 4. Corriger l'URL publique

Une fois le service en ligne, copiez son URL (`https://bingo-xxxx.onrender.com`),
puis **Environment** → `APP_URL` → collez-la → **Save** (redéploiement automatique).

Cela corrige les images Open Graph, le sitemap et les retours de paiement.

## 5. Vérifier

- `https://votre-service.onrender.com/api/health` → `{"ok":true,...}`
- Accueil, fiche produit, ajout au panier, commande COD
- Admin `/admin` avec votre mot de passe
- Uploadez une image test dans un produit, puis redéployez : elle doit toujours être là
  (disque persistant)

## 6. Domaine personnalisé

Render → **Settings** → **Custom Domains** → ajoutez `bingo.votredomaine.com`,
puis créez le CNAME chez votre registrar. Render fournit le certificat TLS.
Mettez ensuite `APP_URL` à jour.

## Notes

- Le disque est monté sur `/app/data` : base `dev.db` + dossier `uploads/`.
- Un seul disque par service ; l'entrypoint fait le lien entre `/app/data/uploads`
  et `public/uploads`.
- Sauvegardes : Render → disque → snapshot, ou `npm run backup` via un job.
- Pour monter en charge : passer à PostgreSQL (voir `docs/DEPLOY-VERCEL.md`).
