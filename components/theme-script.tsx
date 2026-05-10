/** Runs before paint to avoid theme flash. Must match ThemeProvider logic. */
export function ThemeScript(): string {
  return `(function(){try{var k='credex-theme';var s=localStorage.getItem(k);var d=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){document.documentElement.classList.add('dark');}})();`;
}
