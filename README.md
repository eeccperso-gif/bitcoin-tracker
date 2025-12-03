# Bitcoin Portfolio Tracker

Application de suivi de portefeuille Bitcoin en temps réel.

## Fonctionnalités

- 💰 Prix Bitcoin en temps réel (CoinGecko / Coinbase)
- 📊 Suivi de plusieurs positions
- 💱 Toggle USD / EUR
- 📈 Calcul automatique des gains/pertes
- 💾 Sauvegarde locale des positions
- 🔄 Actualisation automatique toutes les 30 secondes

## Déploiement sur Vercel (gratuit)

### Méthode 1 : Via GitHub (recommandé)

1. Crée un compte sur [GitHub](https://github.com) si tu n'en as pas
2. Crée un nouveau repository et uploade tous ces fichiers
3. Va sur [Vercel](https://vercel.com) et connecte-toi avec GitHub
4. Clique "Add New Project"
5. Sélectionne ton repository
6. Clique "Deploy" — c'est tout !

### Méthode 2 : Via Vercel CLI

```bash
# Installe Vercel CLI
npm install -g vercel

# Dans le dossier du projet
vercel

# Suis les instructions
```

## Développement local

```bash
# Installe les dépendances
npm install

# Lance le serveur de développement
npm run dev

# Ouvre http://localhost:5173
```

## Structure du projet

```
bitcoin-tracker/
├── public/
│   └── bitcoin.svg
├── src/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```
