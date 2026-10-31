# Générer l'APK Android

L'application est une **PWA** : le même code sert le web et l'APK, via Capacitor.
L'APK charge l'URL de production (pas de duplication de code).

## Prérequis (poste de build)

- Node.js 22+
- Java JDK 17
- Android Studio + SDK Android (API 34+)
- Le site déployé en **HTTPS**

## Commandes

```bash
# 1. Dépendances Capacitor
npm install -D @capacitor/cli
npm install @capacitor/core @capacitor/android

# 2. Projet Android
npx cap add android

# 3. Pointer vers la production
#    (ou modifier capacitor.config.ts)
export CAPACITOR_SERVER_URL="https://votre-domaine.com"
npx cap sync android

# 4. Ouvrir dans Android Studio
npx cap open android
```

Dans Android Studio : `Build > Generate Signed Bundle / APK`.

- **App Bundle (.aab)** pour le Play Store
- **APK** pour l'installation directe / test

## Signature

Créer un keystore une seule fois et le conserver :

```bash
keytool -genkey -v -keystore bingo.keystore -alias bingo \
  -keyalg RSA -keysize 2048 -validity 10000
```

Configurer la signature dans `android/app/build.gradle` (ou via l'assistant Android Studio),
puis conserver `bingo.keystore` et les mots de passe hors du dépôt.

## Play Store — éléments à préparer

- Icône 512×512 (déjà dans `public/icons/icon-512.png`)
- Captures d'écran téléphone (au moins 2)
- Politique de confidentialité publique (page `/mentions` à compléter avec la raison sociale)
- Formulaire « Data safety » : l'app ne collecte que les données de commande
  (nom, téléphone, adresse) et ne les partage pas.
- Classification : application grand public, achats.

## Notes

- L'app mobile n'a pas besoin du mode test Orange Money : vérifier `ORANGE_MODE=live`
  côté serveur avant publication.
- `server.url` doit être en HTTPS, sinon Capacitor bloque le chargement.
- Pour un test hors ligne, remplacer `server.url` par `capacitor://localhost` et pointer
  `webDir` vers un export statique — non nécessaire ici.
