# Cled's Plannéo — Build the Android APK (automatic, free, no setup)

Ton app est prête. Pour obtenir un **.apk téléchargeable**, on utilise GitHub Actions — la compilation tourne sur les serveurs gratuits de GitHub.

## Étapes (5 minutes, une seule fois)

### 1. Crée un dépôt GitHub
- Va sur https://github.com/new
- Nom au choix (ex: `cleds-planneo`), visibilité **Private** (ou Public)
- Clique **Create repository**

### 2. Push le contenu du zip vers ton dépôt

Dézippe le projet, puis dans le dossier :

```bash
git init
git add .
git commit -m "Initial: Cled's Plannéo"
git branch -M main
git remote add origin https://github.com/<ton-user>/<ton-repo>.git
git push -u origin main
```

### 3. Récupère ton APK

1. Sur GitHub, ouvre l'onglet **Actions**.
2. Le workflow **“Build Android APK”** démarre automatiquement (ou clique **Run workflow** pour le lancer manuellement).
3. Attends ~5–8 min (première fois, le SDK Android se télécharge).
4. Une fois en vert, clique sur le run → section **Artifacts** → télécharge **`cleds-planneo-apk`** (un zip qui contient `cleds-planneo.apk`).
5. Transfère l'APK sur ton téléphone Android → ouvre-le → autorise l'installation depuis source inconnue → installé ! 🎉

## Structure du projet

```
app/
├── frontend/                  # React app (CRA + Tailwind + Capacitor)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── capacitor.config.json  (ajouté auto par CI)
├── backend/                   # non utilisé (app 100% localStorage)
├── capacitor.config.json      # config Android (app id, nom, etc.)
└── .github/workflows/
    └── android-apk.yml        # pipeline de compilation APK
```

## Important

- L'app stocke **tout en localStorage du WebView Android**. Tes données restent sur le téléphone. Désinstaller l'app = perdre les données. (Pense à un bouton Export JSON plus tard.)
- L'APK généré est un **debug APK** (signé avec une clé debug). Parfait pour usage personnel. Pour publier sur le Play Store il faudra signer avec une clé release — facile à ajouter au workflow si besoin un jour.
- App ID : `com.cled.planneo` — Nom affiché : **Cled's Plannéo**

Bon move 💪
