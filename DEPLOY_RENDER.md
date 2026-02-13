# Trading AI Platform - Déploiement sur Render

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│   MongoDB       │
│   (Next.js)     │     │   (FastAPI)     │     │   (Atlas)       │
│   Render Web    │     │   Render Web    │     │   Free Tier     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Prérequis

1. **Compte MongoDB Atlas** (gratuit) : https://www.mongodb.com/atlas
2. **Compte Render** (gratuit) : https://render.com
3. **Clé API OpenAI** : https://platform.openai.com

## Étape 1 : Configurer MongoDB Atlas

1. Créez un compte sur MongoDB Atlas
2. Créez un cluster gratuit (M0 Sandbox)
3. Dans "Database Access", créez un utilisateur avec mot de passe
4. Dans "Network Access", ajoutez `0.0.0.0/0` (accès depuis partout)
5. Dans "Database", cliquez "Connect" et copiez l'URL de connexion :
   ```
   mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/trading_ai_platform
   ```

## Étape 2 : Déployer sur Render

### Option A : Déploiement automatique avec Blueprint

1. Forkez ce repo sur GitHub
2. Sur Render, cliquez "New" → "Blueprint"
3. Connectez votre repo GitHub
4. Render détectera le fichier `render.yaml` et créera les services

### Option B : Déploiement manuel

#### Backend (FastAPI)

1. Sur Render : "New" → "Web Service"
2. Connectez votre repo GitHub
3. Configuration :
   - **Name** : `trading-ai-backend`
   - **Region** : Frankfurt (EU)
   - **Branch** : main
   - **Root Directory** : `backend`
   - **Runtime** : Python 3
   - **Build Command** : `pip install -r requirements.render.txt`
   - **Start Command** : `python -m uvicorn server_render:app --host 0.0.0.0 --port $PORT`

4. Variables d'environnement :
   ```
   MONGO_URL=mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/trading_ai_platform
   DB_NAME=trading_ai_platform
   JWT_SECRET=votre_secret_jwt_securise
   OPENAI_API_KEY=sk-proj-xxxxx
   STRIPE_API_KEY=sk_test_xxxxx (optionnel)
   FRONTEND_URL=https://trading-ai-frontend.onrender.com
   ```

#### Frontend (Next.js)

1. Sur Render : "New" → "Web Service"
2. Configuration :
   - **Name** : `trading-ai-frontend`
   - **Region** : Frankfurt (EU)
   - **Root Directory** : `frontend`
   - **Runtime** : Node
   - **Build Command** : `yarn install && yarn build`
   - **Start Command** : `yarn start`

3. Variables d'environnement :
   ```
   NEXT_PUBLIC_API_URL=https://trading-ai-backend.onrender.com
   NODE_ENV=production
   ```

## Étape 3 : Initialiser les données

Après le déploiement, exécutez le script de seed pour créer les challenges, badges et récompenses :

```bash
# Connectez-vous au shell Render du backend
cd backend
python scripts/seed_gamification.py
```

Ou via l'API :
```bash
curl -X POST https://trading-ai-backend.onrender.com/api/admin/seed
```

## Coûts estimés

| Service | Plan | Coût |
|---------|------|------|
| Render Backend | Starter | $7/mois |
| Render Frontend | Starter | $7/mois |
| MongoDB Atlas | M0 (Free) | Gratuit |
| OpenAI API | Pay-as-you-go | ~$5-20/mois selon usage |
| **Total** | | **~$14-34/mois** |

### Plan gratuit Render

Render offre un plan gratuit avec :
- Services web spin down après 15 min d'inactivité
- 750 heures/mois de compute
- Suffisant pour tester

## Structure des fichiers pour Render

```
/
├── backend/
│   ├── server_render.py      # Point d'entrée Render
│   ├── requirements.render.txt
│   ├── routers/
│   │   ├── ai_openai.py      # Version OpenAI standard
│   │   ├── backtest_openai.py
│   │   └── ...
│   └── ...
├── frontend/
│   ├── package.json
│   └── ...
└── render.yaml               # Blueprint Render
```

## Dépannage

### Le backend ne démarre pas
- Vérifiez les logs dans Render Dashboard
- Assurez-vous que `MONGO_URL` est correct
- Testez la connexion MongoDB avec `mongosh`

### Erreurs CORS
- Vérifiez que `FRONTEND_URL` pointe vers votre frontend Render
- Le backend doit autoriser l'origine du frontend

### L'IA ne fonctionne pas
- Vérifiez que `OPENAI_API_KEY` est valide
- Testez avec : `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

## Support

Pour toute question, ouvrez une issue sur GitHub.
