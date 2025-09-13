// Script de diagnostic pour le mode sombre
// À exécuter dans la console du navigateur (F12)

console.log('=== DIAGNOSTIC MODE SOMBRE ===');

// 1. Vérifier l'élément HTML
const html = document.documentElement;
console.log('1. Classes HTML actuelles:', html.className);
console.log('   Contient "dark":', html.classList.contains('dark'));

// 2. Vérifier localStorage
const savedTheme = localStorage.getItem('theme');
console.log('2. Theme dans localStorage:', savedTheme);

// 3. Vérifier les préférences système
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
console.log('3. Système préfère sombre:', systemDark);

// 4. Tester l'ajout/suppression manuelle de la classe dark
console.log('4. Test manuel de la classe dark:');
console.log('   Avant:', html.classList.contains('dark'));

// Ajouter dark
html.classList.add('dark');
console.log('   Après ajout "dark":', html.classList.contains('dark'));
console.log('   Classes HTML:', html.className);

// Attendre 2 secondes puis supprimer
setTimeout(() => {
  html.classList.remove('dark');
  console.log('   Après suppression "dark":', html.classList.contains('dark'));
  console.log('   Classes HTML:', html.className);
}, 2000);

// 5. Vérifier si Tailwind CSS est chargé
const testElement = document.createElement('div');
testElement.className = 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white';
document.body.appendChild(testElement);

const styles = window.getComputedStyle(testElement);
console.log('5. Test Tailwind CSS:');
console.log('   bg-white appliqué:', styles.backgroundColor);

html.classList.add('dark');
const darkStyles = window.getComputedStyle(testElement);
console.log('   dark:bg-slate-900 appliqué:', darkStyles.backgroundColor);

html.classList.remove('dark');
document.body.removeChild(testElement);

// 6. Vérifier les erreurs CSS
const stylesheets = Array.from(document.styleSheets);
console.log('6. Feuilles de style chargées:', stylesheets.length);

stylesheets.forEach((sheet, index) => {
  try {
    console.log(`   Feuille ${index}:`, sheet.href || 'inline');
  } catch (e) {
    console.log(`   Feuille ${index}: Erreur d'accès (CORS?)`, e.message);
  }
});

// 7. Vérifier si le ThemeToggle existe
const themeToggle = document.querySelector('[title*="thème"], [title*="theme"], [aria-label*="thème"], [aria-label*="theme"]');
console.log('7. Bouton ThemeToggle trouvé:', !!themeToggle);
if (themeToggle) {
  console.log('   Element:', themeToggle);
  console.log('   Classes:', themeToggle.className);
}

// 8. Fonction de test rapide
window.testDarkMode = function() {
  console.log('=== TEST RAPIDE ===');
  const isDark = html.classList.contains('dark');
  
  if (isDark) {
    html.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    console.log('Passé en mode clair');
  } else {
    html.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    console.log('Passé en mode sombre');
  }
  
  console.log('Classes HTML:', html.className);
  console.log('Theme localStorage:', localStorage.getItem('theme'));
};

console.log('=== FIN DIAGNOSTIC ===');
console.log('Pour tester manuellement, tapez: testDarkMode()');
