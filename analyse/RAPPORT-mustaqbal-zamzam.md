# Mustaqbal Zamzam — analyse technique & fonctionnelle

*Rapport établi le 31/10/2026 à partir des fiches App Store / Google Play, du site public, de l'API publique et des captures officielles. Aucun compte n'a été créé, aucune commande passée.*

---

## 1. Identité

| Élément | Valeur |
|---|---|
| Nom | Mustaqbal Zamzam (مستقبل زمزم) |
| Éditeur | MUSTAQBAL ZAMZAM GENERAL TRADING L.L.C |
| Adresse | Ayal Nasser / Deira, Dubaï, Émirats arabes unis |
| Contact | +971 50 118 2485 · info@mustaqbalzamzam.com |
| Site | mustaqbalzamzam.com (boutique) · backend.mustaqbalzamzam.com (API) |
| Bundle | `com.mustaqbal.zamzam` (identique iOS / Android) |
| Positionnement | Revendeur high-tech : mobiles neufs et occasion, laptops, tablettes/iPad, montres, gadgets, accessoires, sacs, beauté, offres combo |
| Lancement | Avril 2026 |

### Store
- **iOS** : 4.6.3 (26/10/2026), 73,8 Mo, iOS 15+, anglais uniquement, 4,7/5 (43 notes), catégories Shopping/Lifestyle.
- **Android** : 4.6.x, ~45 Mo, 50 000+ installations (≈58 000 selon AppBrain), 5,0/5 (902 avis), 19 permissions, « Tout public », mise à jour 26/10/2026.

---

## 2. Architecture réelle

```
App mobile iOS/Android  ─┐
                         ├──►  API REST Laravel  ──►  MySQL
Storefront Next.js  ─────┘     backend.mustaqbalzamzam.com/api
   (React 19, Redux Toolkit, Axios, Tailwind)
        │
        ├── Firebase Cloud Messaging (push)
        ├── Google Maps / Places (adresses)
        ├── Tabby (BNPL) + Stripe / paiement à la livraison
        ├── Tawk.to (chat) + WhatsApp
        └── GTM + Meta Pixel (tracking)
```

**Constats techniques**
- API : réponses JSON `{"status_code":100,"status_message":…}`, authentification **Bearer / Laravel Sanctum**, pièces jointes servies depuis `/storage/app/public`, pages `/login`, `/password/reset` → **Laravel + MySQL**.
- Storefront : **Next.js App Router** (fichiers `/_next/static/chunks/…`), rendu client, Redux Toolkit, Axios avec intercepteur de jeton.
- Mobile : application cross-platform (très probablement **Flutter** : UI Material, un seul code source, mêmes versions iOS/Android, 74 Mo IPA / 45 Mo APK). Non confirmé par le binaire, l'APK n'étant pas téléchargeable publiquement.
- L'ensemble est édité par **SBIT** (sbit.com.bd, crédité en pied de page du site) : suite e-commerce/POS/ERP « prête à déployer », déclinée pour ce client.

---

## 3. Modèle de données observé

| Entité | Contenu | Volume actuel |
|---|---|---|
| `shops` | boutique, logo, bannière, adresse, TVA/TRN, horaires, commission | 1 boutique (`000001`, boutique admin) |
| `items` | rayons (New Mobile, Used Mobile, Watches, Laptop, Tablet, iPad, Gadget, Accessories, Fashion & Beauty, Bags, Apple iMac, Crystal Whale Lamp, Lucky Box, Combo Offer) | 14 |
| `categories` | arborescence par rayon | 286 |
| `brands` | marques | 129 |
| `products` | fiche produit, prix d'achat/vente, stock, vues, likes, SEO, `product_id` type `PDT-002854` | 780 |
| `product_details` | description HTML, specs, slug, TVA, classe de livraison, remise | 1:1 |
| `product_variants` | déclinaisons (couleur, stockage, état neuf/occasion), SKU, prix propre, remise | 682 produits en ont |
| `offers` | pages promo + codes (`smart2026`, `125ABC`), combos | 4 actives |
| `reels` | vidéos courtes marchandes (titre, prix, vues, likes) | 10 |
| `reviews` | avis produit / boutique / site | 15 côté boutique, 61 côté site |
| `orders` | commande, statut, adresse, livreur, suivi | — |

Le catalogue est clairement **piloté par un ERP/POS de détail** : présence de `purchase_price` (prix d'achat), `tp_price`, `combo_id`, `shipping_class_id`, champs TVA, `filter_type: Takeaway` (reliquat d'un module restauration), gestion multi-boutiques et livreurs.

---

## 4. Parcours et fonctionnalités

**Accueil** : en-tête boutique + compteur de vues, recherche (texte, vocale, scan code-barres), favoris, panier, grille de rayons, carrousel, section **Reels**, « Latest Released », « Popular Brands » (avec followers), « Best Selling », « Popular Products », bannière fidélité/coin.

**Catalogue** : rayons → catégories → produits ; filtres, tri (pertinence, prix), vue liste/grille, recherche avec suggestions et chips.

**Fiche produit** : galerie, prix barré/remisé, stock, sélecteur de variantes (couleur, stockage, état), « Product Insights » (vues, likes, commentaires), ajout panier, partage, favoris.

**Panier / commande** : vendeur et délai de livraison, quantités, sous-total/total, produits suggérés, checkout, adresse via Google Places, **Tabby** (paiement en plusieurs fois), **Stripe**, paiement à la livraison.

**Compte** : profil, adresses, historique, favoris, avis, notifications push (FCM).

**Commandes** : recherche, filtre, statuts (In Process, Picked, Cancelled…), suivi (« Track ») avec adresse cartographiée, détail par boutique.

**Social commerce** : reels vidéo, likes, commentaires, vues, suivi de marque/boutique — élément différenciant par rapport à un simple catalogue.

**Back-office / écosystème** : inscription vendeur (`/create-seller`), inscription livreur (`/create-rider`), blogs, FAQ, comparateur, pages légales, avis.

---

## 5. Paramètres de fonctionnement

| Paramètre | Valeur observée |
|---|---|
| Devise | **AED** (dirham), code 183 |
| TVA | N° d'enregistrement `104422204800003` (TRN UAE) ; TVA par produit |
| Langue | Anglais (boutique `lang=en`) ; infrastructure de traduction EN/BN (table `translations`, `name_bn`) |
| Fuseau | Asia/Dubaï (id 247) |
| Horaires | 09:00 → 00:00 |
| Livraison | 3–5 jours ouvrés (panier) ; classes de livraison par produit ; estimation à 9 845 min (~6,8 j) |
| Paiements | Tabby, Stripe, COD ; mention SSLCommerz/PayPal (copie de template, non active) |
| Commission | 0 % / 0 fixe (boutique admin) |
| Remises | au niveau variante (ex. 42 %) et via pages d'offres/codes |
| Prix | 10 → 15 730 AED, médiane 550 AED |
| Audience | 1,1 M de vues cumulées, 7 042 likes |

---

## 6. Points d'attention (si vous êtes propriétaire ou repreneur)

1. **Prix d'achat exposé publiquement** : l'API `POST /api/product/list` renvoie `purchase_price` sans authentification → fuite de marges.
2. **Clé Google Maps** présente dans le bundle JS client (à restreindre par referrer).
3. **Incohérence de discours** : la fiche App Store cite SSLCommerz/PayPal, la fiche Play cite Tabby/Stripe.
4. **Données de démonstration** visibles dans les captures « My Orders » (vendeurs « Skill Based IT », « feni bangladesh », adresse au Bangladesh) → signe d'un template non nettoyé.
5. **Boutique unique** alors que la plateforme est multi-vendeurs (inscription vendeur/livreur active) : fonctionnalités payées mais non exploitées.
6. **Stock** porté par les variantes, `qty=0` au niveau produit : à vérifier côté affichage « In Stock ».
7. **Storefront web verrouillé** : sans jeton client, le catalogue renvoie 401 → la boutique en ligne n'est pas un canal d'acquisition public (contrairement à l'app).

---

## 7. Synthèse

Mustaqbal Zamzam n'est pas une app « faite maison » : c'est un **habillage commercial d'une plateforme e-commerce/POS clé en main** (SBIT), composée d'un front Next.js, d'une API Laravel, d'une base MySQL et d'une app mobile cross-platform. La valeur ajoutée pour le commerçant tient à l'intégration ERP (stock, prix d'achat, combos, TVA), au multi-vendeur/livreur et à la couche sociale (reels, likes, suivi de marque). Le catalogue réel (780 produits, 286 catégories, 129 marques) est déjà riche ; l'exécution produit est correcte mais plusieurs réglages et données de démo trahissent le template.
