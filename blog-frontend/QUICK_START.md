# 🚀 Guide de démarrage rapide - Novel Editor

## ✅ L'intégration est terminée !

Votre blog utilise maintenant l'éditeur **Novel** de Vercel. Voici comment l'utiliser :

---

## 🎯 Utilisation immédiate

### Le composant `ArticleEditor` utilise déjà Novel !

Toutes les pages qui utilisent `ArticleEditor` bénéficient automatiquement du nouvel éditeur :
- ✅ Création d'articles
- ✅ Édition d'articles  
- ✅ Pages légales
- ✅ Tous les formulaires d'édition

**Aucune modification nécessaire** - ça fonctionne déjà ! 🎉

---

## 🎨 Fonctionnalités principales

### 1. Menu Slash (/)
Tapez `/` n'importe où dans l'éditeur pour ouvrir le menu de commandes :

```
/ → Menu s'ouvre
  → Texte
  → Titre 1, 2, 3
  → Liste à puces
  → Liste numérotée
  → Liste de tâches
  → Citation
  → Code
  → Image
  → YouTube
```

### 2. Bubble Menu (sélection)
Sélectionnez du texte pour voir le menu contextuel :

```
Sélectionner du texte → Menu apparaît
  → B (Gras)
  → I (Italique)
  → U (Souligné)
  → S (Barré)
  → </> (Code)
  → 🎨 (Couleur)
  → 🔗 (Lien)
```

### 3. Raccourcis clavier
```
Ctrl + B     → Gras
Ctrl + I     → Italique
Ctrl + U     → Souligné
Ctrl + Z     → Annuler
Ctrl + Y     → Rétablir
/            → Menu de commandes
```

---

## 💡 Exemples d'utilisation

### Dans vos composants existants

**Aucun changement nécessaire !** Si vous utilisez déjà `ArticleEditor`, vous avez Novel :

```tsx
// Ceci utilise déjà Novel ! ✅
<ArticleEditor
  initialContent={content}
  onSave={handleSave}
  placeholder="Écrivez votre article..."
/>
```

### Utiliser Novel directement

Si vous voulez utiliser Novel dans un nouveau composant :

```tsx
import { NovelEditor } from '@/app/components/NovelEditor';

function MyNewComponent() {
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

---

## 🖼️ Upload d'images

### Configuration actuelle (développement)
Les images sont converties en URLs blob locales (temporaires).

### Pour la production
Implémentez votre propre fonction d'upload :

```tsx
const handleImageUpload = async (file: File) => {
  // 1. Créer un FormData
  const formData = new FormData();
  formData.append('image', file);
  
  // 2. Envoyer au serveur
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  // 3. Récupérer l'URL
  const data = await response.json();
  return { url: data.imageUrl };
};

// 4. Passer la fonction à NovelEditor
<NovelEditor
  initialContent={content}
  onChange={setContent}
  onImageUpload={handleImageUpload}
/>
```

---

## 🎨 Personnalisation

### Modifier les extensions disponibles

Éditez `src/app/components/novel-extensions.ts` :

```typescript
export const defaultExtensions = [
  StarterKit,
  TiptapImage,
  TiptapLink,
  // Ajoutez ou retirez des extensions ici
  Youtube,
  Mathematics,
  // ...
];
```

### Ajouter des commandes slash personnalisées

Éditez `src/app/components/slash-command.tsx` :

```typescript
export const suggestionItems = createSuggestionItems([
  {
    title: 'Ma commande',
    description: 'Description de ma commande',
    icon: <MyIcon size={18} />,
    command: ({ editor, range }) => {
      // Votre logique ici
      editor.chain().focus().deleteRange(range).run();
    },
  },
  // ... autres commandes
]);
```

### Personnaliser les styles

Éditez `src/app/globals.css` (section Novel Editor) :

```css
/* Novel Editor Styles */
:root {
  --novel-highlight-yellow: #fbf4a2; /* Changez les couleurs */
  --novel-highlight-blue: #c1ecf9;
  /* ... */
}

.ProseMirror {
  /* Personnalisez l'éditeur */
}
```

---

## 🔧 Commandes utiles

### Démarrer le serveur de développement
```bash
cd blog-frontend
npm run dev
```

### Vérifier les erreurs TypeScript
```bash
npx tsc --noEmit
```

### Installer une nouvelle dépendance
```bash
npm install --legacy-peer-deps <package-name>
```

---

## 📊 Structure des fichiers

```
blog-frontend/
├── src/
│   ├── lib/
│   │   └── novel/              # Sources Novel (ne pas modifier)
│   └── app/
│       ├── components/
│       │   ├── NovelEditor.tsx         # ⭐ Composant principal
│       │   ├── ArticleEditor.tsx       # ✅ Utilise Novel
│       │   ├── novel-extensions.ts     # 🔧 Personnalisable
│       │   ├── slash-command.tsx       # 🔧 Personnalisable
│       │   ├── image-upload.ts         # 🔧 À configurer
│       │   └── selectors/              # Menus contextuels
│       └── globals.css                 # 🎨 Styles Novel
└── NOVEL_INTEGRATION.md                # 📚 Documentation complète
```

---

## ❓ FAQ

### Q: L'éditeur ne s'affiche pas ?
**R:** Vérifiez que le serveur est démarré (`npm run dev`) et que vous êtes sur http://localhost:3001

### Q: Les images ne s'affichent pas après rechargement ?
**R:** Normal en développement (URLs blob). Implémentez l'upload vers un serveur en production.

### Q: Comment changer le placeholder ?
**R:** Passez la prop `placeholder` à `NovelEditor` ou `ArticleEditor`

### Q: Puis-je utiliser Markdown ?
**R:** Oui ! Novel supporte le Markdown. Tapez en Markdown et il sera converti automatiquement.

### Q: Comment désactiver une fonctionnalité ?
**R:** Retirez l'extension correspondante dans `novel-extensions.ts`

---

## 🎉 C'est tout !

Vous êtes prêt à utiliser Novel. L'éditeur est déjà intégré et fonctionnel dans votre blog.

**Besoin d'aide ?**
- 📚 Documentation complète : `NOVEL_INTEGRATION.md`
- 📝 Résumé technique : `INTEGRATION_SUMMARY.md` (à la racine du projet)
- 🌐 Documentation Novel : https://novel.sh/docs
- 💬 GitHub Novel : https://github.com/steven-tey/novel

**Bon développement ! 🚀**
