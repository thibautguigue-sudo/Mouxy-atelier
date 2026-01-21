# 🗳️ Atelier Nom de Liste Municipale

Application web collaborative pour animer un atelier de 45 minutes permettant à une équipe de converger vers un nom de liste municipale.

## ✨ Fonctionnalités

### Workflow en 3 phases

1. **Phase 1 - Brainstorm** : Les participants soumettent des mots-clés avec des tags (Rassembler, Apaiser, Dynamiser, Proximité, Autre)
2. **Phase 2 - Propositions** : Les groupes proposent des noms de liste selon 5 formes prédéfinies
3. **Votes en 2 tours** : Tour 1 (3 votes), Tour 2 sur le Top 3 (1 vote) → Top 1 + 2 alternatives

### Caractéristiques techniques

- ⚡ **Temps réel** : Synchronisation via Upstash Redis (REST)
- 📱 **Mobile-first** : Interface tactile optimisée pour tablettes/téléphones
- 🔒 **Simple mais sécurisé** : Clé admin pour le pilotage, localStorage pour l'anti-double vote
- ⏰ **Auto-expiration** : TTL de 8h sur toutes les données
- 🖨️ **Export** : Page imprimable A4 avec récapitulatif complet

---

## 📋 Prérequis

- Node.js 18+ 
- npm ou yarn
- Compte [Upstash](https://console.upstash.com/) (gratuit)
- Compte [Vercel](https://vercel.com/) pour le déploiement (gratuit)

---

## 🚀 Installation locale

### 1. Cloner et installer

```bash
git clone <votre-repo>
cd atelier-nom-muxila
npm install
```

### 2. Configurer les variables d'environnement

Copier le fichier d'exemple :

```bash
cp .env.example .env.local
```

Éditer `.env.local` avec vos clés Upstash :

```env
# Upstash Redis - Récupérer sur https://console.upstash.com/
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxx

# Clé secrète pour l'admin (changez-la !)
ADMIN_KEY=mouxy2026admin

# TTL des sessions en secondes (8h par défaut)
SESSION_TTL_SECONDS=28800
```

### 3. Créer une base Redis sur Upstash

1. Aller sur [console.upstash.com](https://console.upstash.com/)
2. Créer une nouvelle base Redis
3. Copier `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` depuis l'onglet "REST API"

### 4. Lancer en développement

```bash
npm run dev
```

L'application est accessible sur `http://localhost:3000`

---

## 🌐 Déploiement sur Vercel

### Option A : Déploiement depuis GitHub (recommandé)

1. Push votre code sur GitHub
2. Connectez-vous à [Vercel](https://vercel.com/)
3. Importez votre repository GitHub
4. Ajoutez les variables d'environnement dans Settings > Environment Variables :
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `ADMIN_KEY`
   - `SESSION_TTL_SECONDS` (optionnel)
5. Déployez !

### Option B : Déploiement CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

Ajoutez ensuite les variables d'environnement via le dashboard Vercel.

---

## 🎯 Mode opératoire - Jour J

### Avant l'atelier (30 min avant)

1. **Créer la session**
   - Aller sur `https://votre-domaine.vercel.app`
   - Cliquer sur "Créer une session"
   - Entrer :
     - Nom de la commune (ex: "Mouxy")
     - Gentilé (ex: "Moussards")
     - Clé admin (celle définie dans `ADMIN_KEY`)
   - Noter le code session généré (ex: `MUXILA23`)

2. **Préparer les QR codes**
   - URL à partager : `https://votre-domaine.vercel.app/s/MUXILA23`
   - Générer un QR code avec [qr-code-generator.com](https://www.qr-code-generator.com/) ou similaire
   - Imprimer ou afficher sur écran

3. **Tester l'accès admin**
   - Dashboard : `https://votre-domaine.vercel.app/s/MUXILA23/admin?key=mouxy2026admin`
   - Vérifier que tout fonctionne

### Organisation des groupes

- 5 tablettes ou téléphones, une par groupe (G1 à G5)
- Chaque groupe rejoint la session avec le code et un nom (ex: "Groupe 1")
- L'écran principal peut afficher le dashboard admin en mode "Vue d'ensemble"

### Déroulé de l'atelier (45 min)

| Temps | Phase | Action Admin | Action Participants |
|-------|-------|--------------|---------------------|
| 0-5 min | Accueil | Vérifier connexions | Scanner QR, rejoindre session |
| 5-15 min | Phase 1 | Activer "Phase 1 - Mots" | Soumettre des mots-clés |
| 15-30 min | Phase 2 | Activer "Phase 2 - Noms" | Proposer des noms de liste |
| 30-35 min | Sélection | Créer shortlist (max 12) | Attendre |
| 35-40 min | Vote T1 | Activer "Vote Tour 1" | 3 votes par personne |
| 40-43 min | Vote T2 | Activer "Vote Tour 2" | 1 vote sur le Top 3 |
| 43-45 min | Résultats | Activer "Terminé" | Découvrir le Top 1 ! |

### Contrôles Admin

Le dashboard admin (`/s/XXXX/admin?key=XXXX`) permet de :

- **Piloter les phases** : Cliquer sur le bouton de la phase souhaitée
- **Voir les mots** : Nuage interactif avec filtres par tag
- **Gérer les propositions** : Table complète avec sélection pour shortlist
- **Publier la shortlist** : Cocher les propositions (max 12), cliquer "Publier"
- **Suivre les votes** : Voir les compteurs en temps réel
- **Exporter** : Générer un PDF via la page Export

### Après l'atelier

1. Aller sur `/s/XXXX/export?key=XXXX`
2. Cliquer "Imprimer / PDF"
3. Sélectionner "Enregistrer en PDF" dans les options d'impression

---

## 📂 Structure du projet

```
atelier-nom-muxila/
├── app/
│   ├── api/
│   │   ├── admin/route.ts      # API admin (phases, shortlist)
│   │   ├── proposals/route.ts  # CRUD propositions
│   │   ├── session/
│   │   │   ├── create/route.ts # Création session
│   │   │   ├── join/route.ts   # Rejoindre session
│   │   │   └── route.ts        # Info session
│   │   ├── shortlist/route.ts  # Shortlist publique
│   │   ├── vote/route.ts       # Soumission votes
│   │   └── words/route.ts      # CRUD mots
│   ├── s/[sessionCode]/
│   │   ├── page.tsx            # Hub session (choix groupe)
│   │   ├── g/[groupId]/page.tsx # Vue groupe (phases 1-2)
│   │   ├── admin/page.tsx      # Dashboard admin
│   │   ├── vote/page.tsx       # Interface de vote
│   │   ├── results/page.tsx    # Page résultats publique
│   │   └── export/page.tsx     # Export imprimable
│   ├── globals.css             # Styles Tailwind + print
│   ├── layout.tsx              # Layout racine
│   └── page.tsx                # Accueil (créer/rejoindre)
├── components/
│   ├── OfflineIndicator.tsx    # Détection hors-ligne
│   ├── PhaseIndicator.tsx      # Indicateur de phase
│   ├── Toast.tsx               # Notifications
│   └── WordCloud.tsx           # Nuage de mots
├── lib/
│   ├── redis.ts                # Client Upstash + opérations
│   ├── types.ts                # Types TypeScript
│   └── utils.ts                # Utilitaires (validation, etc.)
├── .env.example
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 🔑 Clés Redis

| Clé | Type | Description |
|-----|------|-------------|
| `session:{code}:info` | String (JSON) | Infos session (commune, gentilé, dates) |
| `session:{code}:phase` | String | Phase actuelle (lobby, phase1, phase2, vote1, vote2, done) |
| `session:{code}:words` | Hash | Mots : `{tag}:{word}` → count |
| `session:{code}:proposals` | List | Propositions (JSON strings) |
| `session:{code}:shortlist` | List | Shortlist pour votes (JSON strings) |
| `session:{code}:votes:r1` | Hash | Votes tour 1 : proposalId → count |
| `session:{code}:votes:r2` | Hash | Votes tour 2 : proposalId → count |
| `session:{code}:voters:r1` | Set | IDs des votants tour 1 |
| `session:{code}:voters:r2` | Set | IDs des votants tour 2 |
| `session:{code}:participants` | Hash | Participants : id → JSON |

Toutes les clés ont un TTL de 8h (configurable).

---

## 🛠️ Personnalisation

### Changer les formes de noms (Phase 2)

Éditer `lib/types.ts` :

```typescript
export const FORM_TYPES = [
  { value: 'ensemble', label: 'Ensemble/Unis/Réunis', example: 'Ensemble pour Mouxy' },
  { value: 'commun', label: 'Mouxy + commun/lien', example: 'Mouxy en commun' },
  // ... ajouter/modifier ici
];
```

### Changer les tags de mots (Phase 1)

Éditer `lib/types.ts` :

```typescript
export const WORD_TAGS = ['Rassembler', 'Apaiser', 'Dynamiser', 'Proximité', 'Autre'] as const;
```

### Ajuster le TTL

Modifier `SESSION_TTL_SECONDS` dans `.env.local` (défaut : 28800 = 8h).

---

## ❓ FAQ / Dépannage

**Q: Les participants ne voient pas les changements de phase**
- Vérifier que le polling fonctionne (rafraîchissement automatique toutes les 5s)
- Vérifier la connexion internet des appareils
- Forcer un rafraîchissement de la page

**Q: "Session non trouvée"**
- Vérifier le code session (sensible à la casse)
- La session a peut-être expiré (TTL 8h)

**Q: Problème de double vote**
- Le système utilise localStorage + Redis pour empêcher les doublons
- En cas de changement d'appareil, le même utilisateur peut revoter (limitation volontaire pour simplifier)

**Q: L'export PDF ne fonctionne pas**
- Utiliser la fonction "Imprimer" du navigateur
- Sélectionner "Enregistrer en PDF" comme destination
- Chrome recommandé pour un meilleur rendu

---

## 📄 Licence

MIT - Libre d'utilisation et de modification.

---

## 🙏 Crédits

Développé pour les ateliers de co-construction de campagnes municipales.

- Stack : Next.js 14, TypeScript, Tailwind CSS
- Base de données : Upstash Redis
- Hébergement : Vercel
