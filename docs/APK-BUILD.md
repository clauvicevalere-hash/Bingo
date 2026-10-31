# APK de démonstration — notes de build

## Résultat

- Fichier : `dist/tresor-empire-debug.apk` — **4 Mo**, signé en debug, installable par sideload.
- Package : `com.tresorempire.app` · label `Tresor Empire` · minSdk 24 · targetSdk 36.
- Icône et splash personnalisés (orange Tresor Empire) via `scripts/android-assets.mjs`.
- L'APK charge `server.url` : actuellement l'URL du tunnel de démonstration.

## Rebuild pour un domaine définitif

```bash
export CAPACITOR_SERVER_URL="https://votre-domaine.com"
npx cap sync android
cd android
JAVA_HOME="C:\Program Files\Android\Android Studio\jbr" \
ANDROID_HOME="%LOCALAPPDATA%\Android\Sdk" \
gradlew.bat assembleDebug --no-daemon
```

L'APK est produit dans `android/app/build/outputs/apk/debug/app-debug.apk`.

## Build utilisé sur ce poste

- JDK 21 fourni par Android Studio (`C:\Program Files\Android\Android Studio\jbr`)
- Android SDK : `%LOCALAPPDATA%\Android\Sdk` (platform 36, build-tools 37)
- Gradle wrapper 8.14.3 (cache utilisateur déjà présent)
- `npx cap add android` puis `npx cap sync android`, build en ~3 min

## Vers le Play Store

1. Générer un keystore et le conserver hors du dépôt.
2. Configurer la signature release dans `android/app/build.gradle`.
3. `gradlew bundleRelease` → `.aab`.
4. Compte Play Console (25 $ une fois), fiche, captures, politique de confidentialité.
5. Vérifier `ORANGE_MODE=live` et `APP_URL=https://votre-domaine.com` avant publication.
