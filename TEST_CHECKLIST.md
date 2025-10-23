# ✅ Checklist de Test - Enhanced Novel Editor

## 🎯 Tests de base

### Chargement de l'éditeur
- [ ] L'éditeur se charge sans erreur
- [ ] La toolbar fixe s'affiche en haut
- [ ] La barre d'informations s'affiche
- [ ] Le placeholder s'affiche

### Toolbar fixe
- [ ] Les 2 onglets (Formatage, Insertion) sont visibles
- [ ] L'onglet Formatage est actif par défaut
- [ ] Cliquer sur un onglet change le contenu
- [ ] La toolbar reste fixe lors du scroll

## 📝 Tests de formatage (Onglet Formatage)

### Titres
- [ ] Bouton H1 crée un titre de niveau 1
- [ ] Bouton H2 crée un titre de niveau 2
- [ ] Bouton H3 crée un titre de niveau 3
- [ ] Le bouton actif est surligné en bleu

### Styles de texte
- [ ] Bouton Gras (B) fonctionne
- [ ] Bouton Italique (I) fonctionne
- [ ] Bouton Souligné (U) fonctionne
- [ ] Bouton Barré (S) fonctionne
- [ ] Bouton Code (</>)fonctionne
- [ ] Les boutons actifs sont surlignés

### Exposant/Indice
- [ ] Bouton Exposant (x²) fonctionne
- [ ] Bouton Indice (x₂) fonctionne

### Couleurs
- [ ] Cliquer sur le bouton Couleur ouvre la palette
- [ ] Sélectionner une couleur l'applique au texte
- [ ] Le sélecteur personnalisé fonctionne
- [ ] Cliquer sur Surlignage ouvre la palette
- [ ] Sélectionner une couleur surligne le texte
- [ ] Le bouton "Supprimer" enlève le surlignage

### Alignement
- [ ] Bouton Gauche aligne à gauche
- [ ] Bouton Centre centre le texte
- [ ] Bouton Droite aligne à droite
- [ ] Bouton Justifié justifie le texte
- [ ] Le bouton actif est surligné

### Listes
- [ ] Bouton Liste à puces crée une liste
- [ ] Bouton Liste numérotée crée une liste
- [ ] Bouton Citation crée une citation
- [ ] Les boutons actifs sont surlignés

### Historique
- [ ] Bouton Annuler (↶) fonctionne
- [ ] Bouton Refaire (↷) fonctionne
- [ ] Les boutons sont désactivés si impossible

## 📥 Tests d'insertion (Onglet Insertion)

### Éléments de base
- [ ] Bouton Tableau demande lignes/colonnes
- [ ] Un tableau est inséré avec les dimensions
- [ ] Bouton Image demande une URL
- [ ] Une image est insérée avec l'URL
- [ ] Bouton Lien demande une URL
- [ ] Un lien est inséré
- [ ] Bouton YouTube demande une URL
- [ ] Une vidéo YouTube est insérée
- [ ] Bouton Séparateur insère une ligne

### Contrôles de tableau
- [ ] Les contrôles apparaissent quand dans un tableau
- [ ] Bouton "+ Col" ajoute une colonne
- [ ] Bouton "- Col" supprime une colonne
- [ ] Bouton "+ Ligne" ajoute une ligne
- [ ] Bouton "- Ligne" supprime une ligne
- [ ] Bouton "Supprimer" supprime le tableau
- [ ] Une confirmation est demandée avant suppression

## 💬 Tests du Bubble Menu (Novel natif)

### Apparition
- [ ] Sélectionner du texte fait apparaître le menu
- [ ] Le menu apparaît au-dessus du texte
- [ ] Le menu disparaît si on clique ailleurs

### Fonctionnalités
- [ ] Node Selector fonctionne
- [ ] Link Selector fonctionne
- [ ] Boutons de texte (B, I, U) fonctionnent
- [ ] Color Selector fonctionne

## ⚡ Tests des Slash Commands (Novel natif)

### Apparition
- [ ] Tapez "/" fait apparaître la liste
- [ ] La liste affiche toutes les commandes
- [ ] Tapez du texte filtre les commandes

### Commandes
- [ ] /h1 crée un titre 1
- [ ] /h2 crée un titre 2
- [ ] /h3 crée un titre 3
- [ ] /ul crée une liste à puces
- [ ] /ol crée une liste numérotée
- [ ] /quote crée une citation
- [ ] /code crée un bloc de code
- [ ] /table insère un tableau
- [ ] /image insère une image
- [ ] /youtube insère une vidéo

## ⌨️ Tests des raccourcis clavier

### Formatage
- [ ] Ctrl+B met en gras
- [ ] Ctrl+I met en italique
- [ ] Ctrl+U souligne
- [ ] Ctrl+Z annule
- [ ] Ctrl+Y refait

### Navigation
- [ ] Home va au début de ligne
- [ ] End va à la fin de ligne
- [ ] Ctrl+Home va au début du document
- [ ] Ctrl+End va à la fin du document

### Sélection
- [ ] Ctrl+A sélectionne tout
- [ ] Shift+Flèches sélectionne du texte
- [ ] Ctrl+Shift+Flèches sélectionne des mots

## 🖼️ Tests des images

### Upload
- [ ] Drag & drop d'une image fonctionne
- [ ] Ctrl+V colle une image
- [ ] L'image s'affiche dans l'éditeur

### Redimensionnement (Novel natif)
- [ ] Cliquer sur une image la sélectionne
- [ ] Les poignées de redimensionnement apparaissent
- [ ] Glisser une poignée redimensionne l'image
- [ ] Les dimensions s'affichent en temps réel

## 📊 Tests de la barre d'informations

### Statistiques
- [ ] Le nombre de mots s'affiche
- [ ] Le nombre de caractères s'affiche
- [ ] Le temps de lecture s'affiche
- [ ] Les statistiques se mettent à jour en temps réel

### Statut de sauvegarde
- [ ] Le statut "Sauvegardé" s'affiche
- [ ] Le statut change en "Non sauvegardé" après modification
- [ ] Le statut revient à "Sauvegardé" après 1 seconde
- [ ] Le point indicateur change de couleur

## 🌓 Tests du Dark Mode

### Basculement
- [ ] Activer le dark mode change les couleurs
- [ ] La toolbar s'adapte au dark mode
- [ ] La barre d'informations s'adapte
- [ ] L'éditeur s'adapte
- [ ] Les boutons s'adaptent

### Lisibilité
- [ ] Le texte est lisible en dark mode
- [ ] Les boutons sont visibles
- [ ] Les couleurs sont cohérentes

## 📱 Tests Responsive

### Desktop (>1024px)
- [ ] Tous les boutons sont visibles
- [ ] La toolbar tient sur une ligne
- [ ] L'éditeur prend toute la largeur

### Tablette (768px - 1024px)
- [ ] La toolbar s'adapte
- [ ] Les boutons restent accessibles
- [ ] L'éditeur est utilisable

### Mobile (<768px)
- [ ] La toolbar est scrollable horizontalement
- [ ] Les onglets sont visibles
- [ ] L'éditeur est utilisable
- [ ] Le clavier virtuel ne cache pas l'éditeur

## ⚡ Tests de performance

### Chargement
- [ ] L'éditeur se charge en moins de 1 seconde
- [ ] Pas de lag lors de la frappe
- [ ] Les boutons répondent instantanément

### Gros documents
- [ ] Ouvrir un document de 10,000 mots
- [ ] La frappe reste fluide
- [ ] Le scroll est fluide
- [ ] Les statistiques se mettent à jour rapidement

## 🔒 Tests de sécurité

### Validation
- [ ] Les URLs sont validées
- [ ] Le HTML est sanitizé
- [ ] Pas d'injection de script possible

### Contenu
- [ ] Le contenu est sauvegardé correctement
- [ ] Le contenu est restauré correctement
- [ ] Pas de perte de données

## 🐛 Tests de bugs connus

### Conflits
- [ ] Pas de conflit entre toolbar et bubble menu
- [ ] Pas de conflit entre toolbar et slash commands
- [ ] Les 3 méthodes cohabitent sans problème

### Edge cases
- [ ] Sélectionner tout le texte et le supprimer
- [ ] Coller du contenu avec formatage complexe
- [ ] Insérer plusieurs images d'affilée
- [ ] Créer un tableau dans un tableau (devrait échouer)
- [ ] Annuler/Refaire plusieurs fois de suite

## 📝 Tests d'intégration

### ArticleEditor
- [ ] NovelEditor s'intègre dans ArticleEditor
- [ ] Le bouton Sauvegarder fonctionne
- [ ] Le contenu est passé correctement
- [ ] onChange est appelé à chaque modification

### Workflow complet
- [ ] Créer un nouvel article
- [ ] Écrire du contenu
- [ ] Formater avec la toolbar
- [ ] Insérer des images
- [ ] Créer un tableau
- [ ] Sauvegarder
- [ ] Recharger la page
- [ ] Le contenu est restauré correctement

## ✅ Résultat attendu

Tous les tests doivent passer pour considérer l'éditeur comme **production-ready**.

### Critères de succès
- ✅ 0 erreur dans la console
- ✅ 0 warning TypeScript
- ✅ Tous les tests passent
- ✅ Performance optimale
- ✅ Expérience utilisateur fluide

---

## 📊 Résumé des tests

```
Total de tests : ~120
Tests passés : ___
Tests échoués : ___
Taux de réussite : ___%
```

## 🎯 Prochaines étapes

Si tous les tests passent :
- ✅ L'éditeur est **production-ready**
- ✅ Déployez en production
- ✅ Profitez de l'expérience !

Si des tests échouent :
- 🔍 Identifiez les problèmes
- 🔧 Corrigez les bugs
- ✅ Re-testez

---

**📋 Checklist complète pour garantir la qualité !**
