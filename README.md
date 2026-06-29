# Auto Maroc

Application web (Next.js) alignée sur le cahier des charges : catalogue Maroc, filtres, fiches, comparateur avec conclusion, avis anonymisés (modération admin), auth JWT cookie, i18n **arabe (RTL par défaut)** + **français**, squelettes assistant / photo IA / OBD2 / PDF.

## Prérequis

- Node.js 20+
- Docker (optionnel) pour PostgreSQL

## Configuration

Un fichier **`.env`** est fourni à la racine (valeurs locales alignées sur `docker-compose.yml`). Sinon, copier `.env.example` vers `.env`.

Variables obligatoires :

- `DATABASE_URL` — PostgreSQL (`docker compose up -d` puis URL du conteneur)
- `AUTH_SECRET` — au moins 16 caractères (JWT cookies)

## API catalogue (import & lecture)

| Méthode | Route | Rôle |
|--------|--------|------|
| `POST` | `/api/admin/import/catalog` | Admin : `{ "source": "morocco-bundle" }` importe `data/morocco-catalog.json` (marques, `imageUrl`, specs). Idempotent (clé : brandAr + modelAr + year + versionAr). |
| `POST` | `/api/admin/import/catalog` | Admin : `{ "source": "json-body", "data": { "vehicles": [...] } }` importe un lot JSON validé. |
| `GET` | `/api/catalog/marques` | Public : marques + nombre de véhicules. |
| `GET` | `/api/catalog/complet` | Public : toutes les marques groupées avec véhicules + `specs`. |

Après `db:push`, connectez-vous en **admin**, puis cliquez sur **Importer le lot** dans `/ar/admin` (ou `/fr/admin`) pour charger le fichier démo, ou appelez l’API ci-dessus.

2. Pousser le schéma et charger les données de démo :

```bash
docker compose up -d
npm run db:push
npm run db:seed
```

Comptes seed :

- Admin : `admin@auto-maroc.ma` / `Admin123!`
- Démo : `demo@auto-maroc.ma` / `Demo123!`

## Développement

```bash
npm install
npm run dev
```

Ouvrir `http://localhost:3000` (redirection vers `/ar`).

## Déploiement Vercel

SQLite ne fonctionne pas sur Vercel (fichiers éphémères). Le projet utilise **PostgreSQL** en production.

### 1. Base de données (Neon gratuit recommandé)

1. Créer un projet sur [neon.tech](https://neon.tech)
2. Copier l’URL **pooled** (ex. `postgresql://…-pooler…/neondb?sslmode=require`)
3. Dans le dashboard Vercel → **Settings → Environment Variables** :
   - `DATABASE_URL` = URL Neon pooled
   - `AUTH_SECRET` = chaîne aléatoire ≥ 32 caractères
   - `OPENAI_API_KEY` = (optionnel) pour l’assistant IA
   - `OPENAI_MODEL` = (optionnel) ex. `gpt-4o-mini`

### 2. Initialiser la base production (une fois)

Depuis votre machine, avec `DATABASE_URL` pointant vers Neon :

```bash
npm run db:deploy
npm run db:seed
```

Puis en admin sur le site : **Importer le lot** (`/fr/admin`).

### 3. Déployer

**Option A — CLI** (dossier du projet, compte Vercel connecté) :

```bash
npx vercel login
npx vercel --prod
```

**Option B — GitHub** : pousser le dépôt, importer le repo sur [vercel.com/new](https://vercel.com/new), laisser *Framework Preset* sur Next.js.

Le fichier `vercel.json` fixe la région **Paris (cdg1)** pour de meilleures latences au Maroc.

## Build

```bash
set AUTH_SECRET=votre_secret_32_chars_minimum
npm run build
npm start
```

## Phases suivantes (hors MVP code complet)

- Brancher un modèle **RAG** pour l’assistant (sans hallucination hors base).
- **Vision** + floutage plaques/visages + stockage objet pour le diag photo.
- **Module natif** (React Native) + ELM327 pour OBD2 en production.
- **PDF** RTL arabe (ex. templates serveur dédiés).
