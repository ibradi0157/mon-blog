# 📦 Guide de migration - Anciens éditeurs vers Novel

## Vue d'ensemble

Ce guide vous aide à migrer progressivement les anciens composants d'éditeur vers Novel.

---

## ✅ Déjà migré

- **`ArticleEditor.tsx`** - ✅ Utilise maintenant `NovelEditor`

---

## 📋 Composants à migrer (optionnel)

Les composants suivants utilisent encore l'ancien éditeur basé sur Tiptap 3.x :

### 1. `EnhancedEditor.tsx`
**Utilisé par :** `ArticleEditor` (déjà migré ✅)
**Statut :** Peut être supprimé si non utilisé ailleurs

### 2. `ModernRichTextEditor.tsx`
**Utilisé par :**
- `src/app/dashboard/legal/[slug]/page.tsx`
- Possiblement d'autres pages

**Migration :**
```tsx
// Avant
import { ModernRichTextEditor } from '@/app/components/ModernRichTextEditor';

<ModernRichTextEditor
  value={content}
  onChange={setContent}
/>

// Après
import { NovelEditor } from '@/app/components/NovelEditor';

<NovelEditor
  initialContent={content}
  onChange={setContent}
/>
```

### 3. `RichTextEditor.tsx`
**Utilisé par :**
- `src/app/dashboard/articles/components/ArticleForm.tsx`
- `src/app/member/articles/[id]/edit/page.tsx`
- `src/app/member/articles/new/page.tsx`

**Migration :**
```tsx
// Avant
import { RichTextEditor } from '@/app/components/RichTextEditor';

<RichTextEditor
  content={content}
  onUpdate={setContent}
/>

// Après
import { NovelEditor } from '@/app/components/NovelEditor';

<NovelEditor
  initialContent={content}
  onChange={setContent}
/>
```

---

## 🔄 Étapes de migration

### Étape 1 : Identifier les usages

Recherchez les imports de l'ancien éditeur :

```bash
# Dans blog-frontend/
grep -r "ModernRichTextEditor\|RichTextEditor\|EnhancedEditor" src/
```

### Étape 2 : Remplacer l'import

```tsx
// ❌ Ancien
import { ModernRichTextEditor } from '@/app/components/ModernRichTextEditor';

// ✅ Nouveau
import { NovelEditor } from '@/app/components/NovelEditor';
```

### Étape 3 : Adapter les props

| Ancien prop | Nouveau prop | Notes |
|------------|--------------|-------|
| `value` | `initialContent` | Contenu initial |
| `content` | `initialContent` | Contenu initial |
| `onUpdate` | `onChange` | Callback de changement |
| `onChange` | `onChange` | Identique |
| `placeholder` | `placeholder` | Identique |
| `readOnly` | `editable={false}` | Inversé |
| `maxLength` | - | Non supporté directement |

### Étape 4 : Tester

1. Démarrer le serveur : `npm run dev`
2. Naviguer vers la page modifiée
3. Tester l'édition, la sauvegarde, etc.
4. Vérifier qu'il n'y a pas d'erreurs dans la console

---

## 📝 Exemple de migration complète

### Avant (RichTextEditor)

```tsx
'use client';

import { useState } from 'react';
import { RichTextEditor } from '@/app/components/RichTextEditor';

export default function ArticleForm() {
  const [content, setContent] = useState('');

  const handleSave = async () => {
    await fetch('/api/articles', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  };

  return (
    <div>
      <RichTextEditor
        content={content}
        onUpdate={setContent}
        placeholder="Écrivez votre article..."
        maxLength={10000}
      />
      <button onClick={handleSave}>Sauvegarder</button>
    </div>
  );
}
```

### Après (NovelEditor)

```tsx
'use client';

import { useState } from 'react';
import { NovelEditor } from '@/app/components/NovelEditor';

export default function ArticleForm() {
  const [content, setContent] = useState('');

  const handleSave = async () => {
    await fetch('/api/articles', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  };

  const handleImageUpload = async (file: File) => {
    // Votre logique d'upload
    return { url: URL.createObjectURL(file) };
  };

  return (
    <div>
      <NovelEditor
        initialContent={content}
        onChange={setContent}
        onImageUpload={handleImageUpload}
        placeholder="Écrivez votre article..."
      />
      <button onClick={handleSave}>Sauvegarder</button>
    </div>
  );
}
```

---

## ⚠️ Points d'attention

### 1. Format du contenu

**Ancien éditeur** : Peut utiliser un format personnalisé
**Novel** : Utilise HTML standard

Si vous avez du contenu existant, assurez-vous qu'il est compatible HTML.

### 2. Gestion des images

Novel nécessite une fonction `onImageUpload`. Implémentez-la pour gérer l'upload :

```tsx
const handleImageUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  return { url: data.imageUrl };
};
```

### 3. Validation de longueur

Si vous utilisiez `maxLength`, implémentez la validation manuellement :

```tsx
const [content, setContent] = useState('');

const handleChange = (newContent: string) => {
  if (newContent.length <= 10000) {
    setContent(newContent);
  }
};

<NovelEditor
  initialContent={content}
  onChange={handleChange}
/>
```

---

## 🗑️ Nettoyage (optionnel)

Une fois tous les composants migrés, vous pouvez supprimer les anciens fichiers :

```bash
# ⚠️ Attention : Vérifiez d'abord qu'ils ne sont plus utilisés !

# Supprimer les anciens composants
rm src/app/components/EnhancedEditor.tsx
rm src/app/components/ModernRichTextEditor.tsx
rm src/app/components/RichTextEditor.tsx
rm src/app/components/ModernRTE.extensions.tsx

# Désinstaller les dépendances inutilisées (si aucun autre composant ne les utilise)
npm uninstall @vueup/vue-quill quill-image-resize-module-react
```

---

## 📊 Checklist de migration

- [ ] Identifier tous les usages des anciens éditeurs
- [ ] Migrer `ModernRichTextEditor` dans les pages légales
- [ ] Migrer `RichTextEditor` dans ArticleForm
- [ ] Migrer `RichTextEditor` dans les pages d'édition d'articles
- [ ] Tester toutes les pages migrées
- [ ] Implémenter l'upload d'images en production
- [ ] Vérifier qu'il n'y a pas d'erreurs dans la console
- [ ] Supprimer les anciens composants (optionnel)
- [ ] Désinstaller les dépendances inutilisées (optionnel)

---

## 🆘 Besoin d'aide ?

Si vous rencontrez des problèmes lors de la migration :

1. Vérifiez les erreurs dans la console du navigateur
2. Vérifiez les erreurs TypeScript : `npx tsc --noEmit`
3. Consultez la documentation : `NOVEL_INTEGRATION.md`
4. Consultez les exemples dans `NovelEditor.tsx`

---

## ✨ Avantages de la migration

- ✅ Éditeur plus moderne et professionnel
- ✅ Plus de fonctionnalités (slash commands, bubble menu, etc.)
- ✅ Meilleure expérience utilisateur
- ✅ Support Markdown natif
- ✅ Mieux maintenu (Novel est activement développé)
- ✅ Utilisé par Vercel et d'autres grandes entreprises
- ✅ Code plus simple et plus propre

**La migration est optionnelle mais recommandée !** 🚀
