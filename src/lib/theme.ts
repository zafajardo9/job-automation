/**
 * Theme persistence.
 *
 * The same storage key drives the inline script in `__root.tsx` (which applies
 * the theme before first paint) and the toggle button, so the two cannot drift.
 */
const storageKey = 'jobfinder-theme'

const darkPreference = '(prefers-color-scheme: dark)'

export const themeInitScript = `(function(){
  var root=document.documentElement;
  var theme=root.dataset.theme;
  if(!theme){try{theme=localStorage.getItem('${storageKey}')}catch(e){}}
  root.classList.toggle('dark',theme==='dark'||((!theme||theme==='system')&&matchMedia('${darkPreference}').matches));
})()`

export function syncTheme(theme: 'light' | 'dark' | 'system') {
  const preference = window.matchMedia(darkPreference)
  function apply() {
    document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && preference.matches))
  }
  apply()
  if (theme === 'system') {
    preference.addEventListener('change', apply)
    return () => preference.removeEventListener('change', apply)
  }
}

function persist(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark')

  try {
    localStorage.setItem(storageKey, theme)
  } catch {
    // Storage can be unavailable (private mode); the class still applies.
  }
}

export function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark')
  persist(isDark ? 'light' : 'dark')
}
