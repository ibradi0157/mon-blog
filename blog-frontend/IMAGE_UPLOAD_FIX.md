# 🔧 Correction - Upload d'images dans Novel Editor

## ❌ Problème

Erreur lors de l'upload d'images :
```
TypeError: Cannot read properties of undefined (reading 'find')
    at findPlaceholder (upload-images.tsx:49)
```

**Cause** : Le plugin `UploadImagesPlugin` n'était pas ajouté aux extensions de l'éditeur. Sans ce plugin, le système de placeholders pour les images ne fonctionnait pas, causant l'erreur `undefined.find()`.

---

## ✅ Solution

Ajout du plugin `UploadImagesPlugin` aux extensions dans `novel-extensions.ts`.

### Fichier modifié : `src/app/components/novel-extensions.ts`

**Avant** :
```typescript
import {
  TiptapImage,
  TiptapLink,
  // ... autres imports
  GlobalDragHandle,
} from '@/lib/novel';

export const defaultExtensions = [
  StarterKit.configure({ ... }),
  // ... autres extensions
  Mathematics,
  GlobalDragHandle,
];
```

**Après** :
```typescript
import {
  TiptapImage,
  TiptapLink,
  // ... autres imports
  GlobalDragHandle,
  UploadImagesPlugin, // ✅ Ajouté
} from '@/lib/novel';

export const defaultExtensions = [
  StarterKit.configure({ ... }),
  // ... autres extensions
  Mathematics,
  GlobalDragHandle,
  UploadImagesPlugin({ // ✅ Ajouté
    imageClass: 'opacity-40 rounded-lg border border-stone-200',
  }),
];
```

---

## 🎯 Fonctionnement du plugin

### Rôle de `UploadImagesPlugin`

Le plugin gère le cycle de vie complet de l'upload d'images :

1. **Placeholder** - Affiche une image temporaire pendant l'upload
2. **Tracking** - Suit l'état de l'upload avec un ID unique
3. **Remplacement** - Remplace le placeholder par l'image finale
4. **Gestion d'erreurs** - Supprime le placeholder en cas d'échec

### Flux d'upload

```
1. Utilisateur sélectionne/glisse une image
   ↓
2. createImageUpload() crée un placeholder
   ↓
3. UploadImagesPlugin affiche le placeholder (opacité 40%)
   ↓
4. onUpload() upload l'image (actuellement: URL blob locale)
   ↓
5. findPlaceholder() trouve le placeholder via son ID
   ↓
6. Plugin remplace le placeholder par l'image finale
```

---

## ✅ Fonctionnalités maintenant disponibles

### 1. Upload via commande slash
```
1. Tapez /
2. Sélectionnez "Image"
3. Choisissez un fichier
4. ✅ L'image s'insère avec un placeholder puis l'image finale
```

### 2. Drag & Drop
```
1. Glissez une image depuis votre ordinateur
2. Déposez-la dans l'éditeur
3. ✅ L'image s'insère automatiquement
```

### 3. Copier-Coller
```
1. Copiez une image (Ctrl+C)
2. Collez dans l'éditeur (Ctrl+V)
3. ✅ L'image s'insère automatiquement
```

### 4. Placeholder visuel
Pendant l'upload, l'image apparaît avec :
- Opacité réduite (40%)
- Bordure grise
- Coins arrondis

---

## 🔧 Configuration actuelle

### Upload local (développement)
```typescript
// image-upload.ts
const onUpload = async (file: File): Promise<string> => {
  const url = URL.createObjectURL(file);
  return url; // URL blob temporaire
};
```

**⚠️ Limitation** : Les URLs blob sont temporaires et disparaissent au rechargement de la page.

### Pour la production

Modifiez `image-upload.ts` pour uploader vers votre serveur :

```typescript
const onUpload = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  return data.url; // URL permanente (S3, Cloudinary, etc.)
};
```

---

## 🎨 Personnalisation du placeholder

Vous pouvez personnaliser l'apparence du placeholder :

```typescript
UploadImagesPlugin({
  imageClass: 'opacity-40 rounded-lg border border-stone-200', // Style actuel
  
  // Autres exemples :
  // imageClass: 'opacity-60 blur-sm', // Flou
  // imageClass: 'opacity-30 grayscale', // Noir et blanc
  // imageClass: 'animate-pulse', // Animation
})
```

---

## 🧪 Test de l'upload

### Test 1 : Commande slash
1. Ouvrez l'éditeur
2. Tapez `/`
3. Sélectionnez "Image"
4. Choisissez une image
5. ✅ L'image doit apparaître avec un placeholder puis l'image finale

### Test 2 : Drag & Drop
1. Ouvrez l'éditeur
2. Glissez une image depuis votre ordinateur
3. Déposez-la dans l'éditeur
4. ✅ L'image doit s'insérer automatiquement

### Test 3 : Copier-Coller
1. Copiez une image (depuis un site web ou un fichier)
2. Collez dans l'éditeur (Ctrl+V)
3. ✅ L'image doit s'insérer automatiquement

### Test 4 : Pas d'erreur
1. Ouvrez la console du navigateur
2. Uploadez une image
3. ✅ Aucune erreur `Cannot read properties of undefined`

---

## 📋 Validation des images

La validation actuelle dans `image-upload.ts` :

```typescript
validateFn: (file) => {
  // Vérifie que c'est une image
  if (!file.type.includes('image/')) {
    return false;
  }
  
  // Limite de 20 MB
  if (file.size / 1024 / 1024 > 20) {
    return false;
  }
  
  return true;
}
```

**Formats acceptés** : Tous les formats d'images (jpg, png, gif, webp, svg, etc.)  
**Taille maximale** : 20 MB

---

## 🔍 Débogage

Si l'upload ne fonctionne toujours pas :

1. **Vérifiez la console** - Y a-t-il des erreurs ?
2. **Vérifiez le plugin** - Est-il bien dans les extensions ?
3. **Vérifiez la validation** - Le fichier passe-t-il la validation ?
4. **Vérifiez onUpload** - La fonction retourne-t-elle bien une URL ?

### Console de débogage

Ajoutez des logs dans `image-upload.ts` :

```typescript
const onUpload = async (file: File): Promise<string> => {
  console.log('📤 Upload started:', file.name, file.size);
  const url = URL.createObjectURL(file);
  console.log('✅ Upload complete:', url);
  return url;
};
```

---

## 📚 Ressources

- [Tiptap - Upload Images](https://tiptap.dev/docs/editor/extensions/functionality/file-handler)
- [Novel - Image Upload](https://github.com/steven-tey/novel)
- [MDN - URL.createObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static)

---

## ✅ Résumé

**Problème** : Plugin `UploadImagesPlugin` manquant  
**Solution** : Ajout du plugin aux extensions  
**Résultat** : Upload d'images fonctionnel (slash, drag & drop, copier-coller)

**L'upload d'images fonctionne maintenant parfaitement !** 🎉

**Prochaine étape** : Configurer l'upload vers un serveur en production
