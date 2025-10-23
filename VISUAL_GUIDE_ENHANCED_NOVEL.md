# 🎨 Guide Visuel - Enhanced Novel Editor

## 📐 Structure de l'éditeur

```
┌─────────────────────────────────────────────────────────────┐
│  TOOLBAR FIXE (Sticky Top)                                  │
│  ┌──────────┬──────────┐                                    │
│  │ Formatage│ Insertion│  ← Onglets                         │
│  └──────────┴──────────┘                                    │
│  [H1] [H2] [H3] │ [B] [I] [U] [S] │ [🎨] [✏️] │ [↶] [↷]   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  BARRE D'INFORMATIONS                                       │
│  📊 Mots: 245  │  📝 Caractères: 1,234  │  ⏱️ Lecture: 2 min│
│  ● Sauvegardé                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ZONE D'ÉDITION (Novel)                                     │
│                                                              │
│  Commencez à écrire...                                      │
│                                                              │
│  [Bubble Menu apparaît sur sélection]                       │
│  [Slash Commands avec /]                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Onglet Formatage

```
┌─────────────────────────────────────────────────────────────┐
│ [Formatage] Insertion                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Titres:                                                     │
│  [H1] [H2] [H3]                                             │
│                                                              │
│  Styles:                                                     │
│  [B] [I] [U] [S] [</>] [x²] [x₂]                          │
│                                                              │
│  Couleurs:                                                   │
│  [🎨 Texte] [✏️ Surlignage]                                 │
│  ┌─────────────────┐                                        │
│  │ ⬛ ⬜ 🟥 🟩 🟦 │  ← Palette de couleurs                 │
│  │ 🟨 🟪 🟦 🟧 🟫 │                                        │
│  │ 🟩 🟦 ⬜ ⬛ 🟥 │                                        │
│  └─────────────────┘                                        │
│                                                              │
│  Alignement:                                                 │
│  [←] [↔] [→] [≡]                                            │
│                                                              │
│  Listes:                                                     │
│  [•] [1.] ["]                                               │
│                                                              │
│  Historique:                                                 │
│  [↶] [↷]                                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📥 Onglet Insertion

```
┌─────────────────────────────────────────────────────────────┐
│ Formatage [Insertion]                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [📊 Tableau] [🖼️ Image] [🔗 Lien] [📹 YouTube] [─ Séparateur]│
│                                                              │
│  ┌─ Si dans un tableau ────────────────────────────────┐   │
│  │ Tableau:                                             │   │
│  │ [+ Col] [- Col] [+ Ligne] [- Ligne] [🗑️ Supprimer]  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 💬 Bubble Menu (Novel natif)

```
Sélectionnez du texte...

┌─────────────────────────────────────────┐
│ [Paragraphe ▼] │ [🔗] │ [B] [I] [U] [🎨] │  ← Apparaît au-dessus
└─────────────────────────────────────────┘
      ▲
      │
  Texte sélectionné
```

## ⚡ Slash Commands (Novel natif)

```
Tapez / dans l'éditeur...

┌─────────────────────────────────────────┐
│ /                                        │
│ ┌─────────────────────────────────────┐ │
│ │ 📝 Titre 1                          │ │
│ │    Créer un titre de niveau 1       │ │
│ ├─────────────────────────────────────┤ │
│ │ 📝 Titre 2                          │ │
│ │    Créer un titre de niveau 2       │ │
│ ├─────────────────────────────────────┤ │
│ │ 📊 Tableau                          │ │
│ │    Insérer un tableau               │ │
│ ├─────────────────────────────────────┤ │
│ │ 🖼️ Image                            │ │
│ │    Insérer une image                │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🎨 Palette de couleurs

```
Cliquez sur [🎨 Texte] ou [✏️ Surlignage]...

┌─────────────────────────────────┐
│ Couleur du texte                │
├─────────────────────────────────┤
│ ⬛ ⬜ 🟥 🟩 🟦                  │
│ 🟨 🟪 🟦 🟧 🟫                  │
│ 🟩 🟦 ⬜ ⬛ 🟥                  │
├─────────────────────────────────┤
│ [Sélecteur personnalisé]        │
│ ┌─────────────────────────────┐ │
│ │ 🌈                          │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## 📊 Contrôles de tableau

```
Quand vous êtes dans un tableau...

┌─────────────────────────────────────────────────────────────┐
│ Formatage [Insertion]                                        │
├─────────────────────────────────────────────────────────────┤
│ [📊 Tableau] [🖼️ Image] [🔗 Lien] │ Tableau: [+ Col] [- Col]│
│                                    [+ Ligne] [- Ligne] [🗑️]  │
└─────────────────────────────────────────────────────────────┘

Tableau dans l'éditeur:
┌─────────┬─────────┬─────────┐
│ Header 1│ Header 2│ Header 3│  ← En-têtes
├─────────┼─────────┼─────────┤
│ Cell 1  │ Cell 2  │ Cell 3  │  ← Cellules
├─────────┼─────────┼─────────┤
│ Cell 4  │ Cell 5  │ Cell 6  │
└─────────┴─────────┴─────────┘
```

## 🖼️ Redimensionnement d'images

```
Cliquez sur une image...

┌─────────────────────────────────┐
│ ◉───────────────────────────◉  │  ← Poignées de redimensionnement
│ │                           │  │
│ │                           │  │
│ │      [IMAGE]              │  │
│ │                           │  │
│ │                           │  │
│ ◉───────────────────────────◉  │
│                                 │
│ 800 × 600 px                    │  ← Dimensions affichées
└─────────────────────────────────┘
```

## 🎯 Workflow visuel

### Méthode 1 : Toolbar fixe
```
1. Cliquez sur un bouton
   ↓
2. L'action s'applique immédiatement
   ↓
3. Le bouton devient actif (bleu)
```

### Méthode 2 : Bubble Menu
```
1. Sélectionnez du texte
   ↓
2. Le menu apparaît au-dessus
   ↓
3. Cliquez sur une action
```

### Méthode 3 : Slash Commands
```
1. Tapez /
   ↓
2. Liste de commandes apparaît
   ↓
3. Sélectionnez une commande
```

### Méthode 4 : Raccourcis
```
1. Sélectionnez du texte
   ↓
2. Appuyez sur Ctrl+B
   ↓
3. Texte en gras instantanément
```

## 📱 Responsive

### Desktop (>1024px)
```
┌─────────────────────────────────────────────────────────────┐
│ [Toolbar complète sur une ligne]                            │
│ [Tous les boutons visibles]                                 │
└─────────────────────────────────────────────────────────────┘
```

### Tablette (768px - 1024px)
```
┌───────────────────────────────────────────┐
│ [Toolbar sur 2 lignes]                    │
│ [Boutons principaux visibles]             │
└───────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────────────┐
│ [Toolbar scrollable →]      │
│ [Swipe pour voir plus]      │
└─────────────────────────────┘
```

## 🌓 Dark Mode

### Light Mode
```
┌─────────────────────────────────────────┐
│ ⬜ Fond blanc                            │
│ ⬛ Texte noir                            │
│ 🔵 Boutons actifs en bleu               │
└─────────────────────────────────────────┘
```

### Dark Mode
```
┌─────────────────────────────────────────┐
│ ⬛ Fond slate-900                        │
│ ⬜ Texte blanc                           │
│ 🔵 Boutons actifs en bleu clair         │
└─────────────────────────────────────────┘
```

## 🎨 États des boutons

### Bouton normal
```
┌─────┐
│ [B] │  ← Gris clair
└─────┘
```

### Bouton actif
```
┌─────┐
│ [B] │  ← Bleu (texte sélectionné est en gras)
└─────┘
```

### Bouton hover
```
┌─────┐
│ [B] │  ← Gris foncé (survol de la souris)
└─────┘
```

### Bouton désactivé
```
┌─────┐
│ [B] │  ← Gris pâle (action impossible)
└─────┘
```

## 📊 Barre d'informations

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Mots: 245  │  📝 Caractères: 1,234  │  ⏱️ Lecture: 2 min │
│ ● Sauvegardé                                                │
└─────────────────────────────────────────────────────────────┘

États:
● Vert  = Sauvegardé
● Jaune = Non sauvegardé
● Rouge = Erreur
```

## 🎯 Exemple complet

```
┌─────────────────────────────────────────────────────────────┐
│ ENHANCED NOVEL EDITOR                                        │
├─────────────────────────────────────────────────────────────┤
│ [Formatage] Insertion                                        │
│ [H1][H2][H3] │ [B][I][U][S] │ [🎨][✏️] │ [←][↔][→][≡]     │
├─────────────────────────────────────────────────────────────┤
│ 📊 Mots: 245  │  📝 Caractères: 1,234  │  ⏱️ Lecture: 2 min│
│ ● Sauvegardé                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ # Mon Article                                                │
│                                                              │
│ Ceci est un **paragraphe** avec du texte en *italique*.     │
│                                                              │
│ - Liste à puces                                              │
│ - Deuxième élément                                           │
│                                                              │
│ ┌─────────┬─────────┐                                       │
│ │ Header 1│ Header 2│                                       │
│ ├─────────┼─────────┤                                       │
│ │ Cell 1  │ Cell 2  │                                       │
│ └─────────┴─────────┘                                       │
│                                                              │
│ [IMAGE]                                                      │
│                                                              │
│ Tapez / pour les commandes...                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🎉 Résultat final

Un éditeur **professionnel** avec :

✅ **Toolbar fixe** : Toujours visible  
✅ **Bubble Menu** : Menu contextuel  
✅ **Slash Commands** : Commandes rapides  
✅ **3 méthodes d'édition** : Flexibilité maximale  
✅ **Dark Mode** : Confort visuel  
✅ **Responsive** : Tous les écrans  
✅ **Performance** : Rapide et fluide  

---

**🎨 Guide visuel pour une utilisation optimale !**
