# Intégration de Novel Editor

## ✅ Intégration Terminée

L'éditeur Novel de Vercel a été intégré avec succès dans votre blog !

## 📦 Ce qui a été fait

### 1. Installation des dépendances
- ✅ Toutes les dépendances Novel installées (Tiptap 2.x, Jotai, etc.)
- ✅ Résolution des conflits de versions entre Tiptap 2.x et 3.x
- ✅ Installation de `@radix-ui/react-popover` pour les menus contextuels

### 2. Copie des sources Novel
- ✅ Sources copiées dans `src/lib/novel/`
- ✅ Composants, extensions, plugins et utilitaires disponibles

### 3. Composants créés

#### `NovelEditor.tsx`
Le composant principal qui encapsule Novel avec toutes les fonctionnalités :
- Éditeur WYSIWYG complet
- Menu slash (/) pour les commandes
- Bubble menu pour le formatage rapide
- Support des images avec upload
- Support des vidéos YouTube
- Listes de tâches
- Tables
- Code blocks avec syntax highlighting
- Markdown

#### Composants de support
- `novel-extensions.ts` - Configuration des extensions Tiptap
- `slash-command.tsx` - Menu de commandes slash
- `image-upload.ts` - Gestion de l'upload d'images
- `novel-ui.tsx` - Composants UI de base
- `text-buttons.tsx` - Boutons de formatage de texte
- `selectors/node-selector.tsx` - Sélecteur de type de nœud
- `selectors/link-selector.tsx` - Sélecteur de liens
- `selectors/color-selector.tsx` - Sélecteur de couleurs

### 4. Styles CSS
- ✅ Styles Novel ajoutés dans `globals.css`
- ✅ Support du mode sombre
- ✅ Styles pour ProseMirror, tables, listes de tâches, etc.

### 5. Mise à jour d'ArticleEditor
- ✅ `ArticleEditor.tsx` utilise maintenant `NovelEditor` au lieu de l'ancien éditeur

## 🚀 Utilisation

### Utilisation basique

```tsx
import { NovelEditor } from '@/app/components/NovelEditor';

function MyComponent() {
  const [content, setContent] = useState('');

  return (
    <NovelEditor
      initialContent={content}
      onChange={setContent}
      placeholder="Commencez à écrire..."
    />
  );
}
```

### Avec upload d'images

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

<NovelEditor
  initialContent={content}
  onChange={setContent}
  onImageUpload={handleImageUpload}
/>
```

## 🎨 Fonctionnalités

### Commandes Slash (/)
Tapez `/` pour ouvrir le menu de commandes :
- Texte, Titres (H1, H2, H3)
- Listes à puces et numérotées
- Listes de tâches
- Citations
- Blocs de code
- Images
- Vidéos YouTube

### Bubble Menu
Sélectionnez du texte pour afficher le menu contextuel :
- Gras, Italique, Souligné, Barré
- Couleur du texte et surlignage
- Liens
- Type de paragraphe (Normal, Titre, Liste)

### Raccourcis clavier
- `Ctrl+B` - Gras
- `Ctrl+I` - Italique
- `Ctrl+U` - Souligné
- `Ctrl+Z` - Annuler
- `Ctrl+Y` - Rétablir
- `/` - Menu de commandes

## 📝 Configuration

### Personnaliser les extensions

Modifiez `novel-extensions.ts` pour ajouter/retirer des extensions :

```typescript
export const defaultExtensions = [
  StarterKit,
  TiptapImage,
  // Ajoutez vos extensions ici
];
```

### Personnaliser le menu slash

Modifiez `slash-command.tsx` pour ajouter des commandes personnalisées :

```typescript
export const suggestionItems = createSuggestionItems([
  {
    title: 'Ma commande',
    description: 'Description',
    icon: <Icon />,
    command: ({ editor, range }) => {
      // Votre logique
    },
  },
  // ...
]);
```

## ⚠️ Notes importantes

1. **Versions Tiptap** : Novel utilise Tiptap 2.x. Ne pas mélanger avec Tiptap 3.x
2. **Upload d'images** : Par défaut, les images sont converties en URLs locales. Implémentez votre propre logique d'upload en production
3. **Anciens composants** : Les anciens éditeurs (`EnhancedEditor`, `ModernRichTextEditor`) peuvent être supprimés progressivement

## 🔧 Dépannage

### Erreur "Module not found"
- Vérifiez que toutes les dépendances sont installées : `npm install`
- Vérifiez les versions de Tiptap (doivent être 2.x)

### Styles manquants
- Vérifiez que `globals.css` est importé dans votre layout
- Vérifiez que les styles Novel sont présents à la fin du fichier

### Images ne s'affichent pas
- Implémentez la fonction `onImageUpload` 
- Vérifiez que l'URL retournée est accessible

## 📚 Ressources

- [Documentation Novel](https://novel.sh/docs)
- [Documentation Tiptap](https://tiptap.dev/)
- [Dépôt GitHub Novel](https://github.com/steven-tey/novel)
