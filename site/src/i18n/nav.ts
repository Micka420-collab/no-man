import type { Lang, Tab } from '../types'

export interface NavItem { id: Tab; fr: string; en: string; icon: string }
export interface NavGroup { fr: string; en: string; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  { fr: 'Explorer', en: 'Explore', items: [
    { id: 'accueil', fr: 'Accueil', en: 'Home', icon: '◈' },
    { id: 'direct', fr: 'En direct', en: 'Live feed', icon: '◉' },
    { id: 'progress', fr: 'Ma progression', en: 'My progress', icon: '◎' },
  ]},
  { fr: 'Univers', en: 'Universe', items: [
    { id: 'ships', fr: 'Vaisseaux', en: 'Starships', icon: '▲' },
    { id: 'fauna', fr: 'Faune', en: 'Fauna', icon: '❋' },
    { id: 'galaxies', fr: 'Galaxies', en: 'Galaxies', icon: '✺' },
    { id: 'elements', fr: 'Éléments', en: 'Elements', icon: '⬡' },
    { id: 'multitool', fr: 'Multi-outil', en: 'Multi-tool', icon: '⚙' },
  ]},
  { fr: 'Communauté', en: 'Community', items: [
    { id: 'expeditions', fr: 'Expéditions', en: 'Expeditions', icon: '⬖' },
    { id: 'war', fr: 'Bulletin de guerre', en: 'War bulletin', icon: '⚔' },
    { id: 'updates', fr: 'Mises à jour', en: 'Update log', icon: '◷' },
  ]},
  { fr: 'Codex', en: 'Codex', items: [
    { id: 'guides', fr: 'Guides & Wiki', en: 'Guides & Wiki', icon: '❯' },
    { id: 'database', fr: 'Base de données', en: 'Database', icon: '▦' },
    { id: 'recipes', fr: 'Recettes', en: 'Recipes', icon: '⚗' },
    { id: 'portal', fr: 'Portail', en: 'Portal', icon: '⎚' },
  ]},
]

/** 24×24 stroke path for each section's nav icon. */
const ICON_D: Record<string, string> = {
  accueil: 'M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5',
  direct: 'M3 12h3.5L9 5.5l4.5 13L16 12h5',
  progress: 'M12 21a9 9 0 1 1 8.6-11.7M9 11.5l2.6 2.6L20.5 5.5',
  updates: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 7.5V12l3.2 1.8',
  ships: 'M5 19c-.4-1.9.5-3.9 2-5.4l3.4 3.4C8.9 18.5 6.9 19.4 5 19zM9.8 12.6 8.2 11c1.6-4.6 5.3-8.4 12.3-9.5-1.1 7-4.9 10.7-9.5 12.3l-1.6-1.6z',
  fauna: 'M7.1 9.7a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2ZM12 8.4a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2ZM16.9 9.7a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2ZM12 11.6c2.8 0 5.1 2.2 5.1 4.7 0 1.9-1.4 2.9-2.6 2.9-1 0-1.7-.5-2.5-.5s-1.5.5-2.5.5c-1.2 0-2.6-1-2.6-2.9 0-2.5 2.3-4.7 5.1-4.7Z',
  galaxies: 'M12 12h.01M16.6 9.2A5.5 5.5 0 1 0 17.5 12M12 3.5A8.5 8.5 0 1 0 20.5 12',
  elements: 'M12 3.2 19.3 7.4v9.2L12 20.8l-7.3-4.2V7.4L12 3.2zM12 11.9h.01',
  multitool: 'M14.4 6.1a4.7 4.7 0 0 0-6 6L3 17.6 6.4 21l5.5-5.5a4.7 4.7 0 0 0 6-6l-3.2 3.2-3.5-3.5 3.2-3.1z',
  expeditions: 'M6 21V4c3.5-1.8 7 1.8 12 0v10.5c-5 1.8-8.5-1.8-12 0',
  war: 'M12 3l7 3v5.5c0 4.6-3 7.6-7 9.5-4-1.9-7-4.9-7-9.5V6l7-3zM12 8.5v5M9.5 11h5',
  guides: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21V5.5zM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2V5.5z',
  database: 'M12 3c4.4 0 8 1.4 8 3.1s-3.6 3.1-8 3.1-8-1.4-8-3.1S7.6 3 12 3zM4 6.1V18c0 1.7 3.6 3 8 3s8-1.3 8-3V6.1M4 12c0 1.7 3.6 3.1 8 3.1s8-1.4 8-3.1',
  recipes: 'M9.5 3v6L4.2 18a2 2 0 0 0 1.8 3h12a2 2 0 0 0 1.8-3L14.5 9V3M8 3h8M6.8 14.5h10.4',
  portal: 'M5 21v-6.5a7 7 0 1 1 14 0V21M3.5 21h17M12 21v-3.5',
}

export function iconD(id: string): string {
  return ICON_D[id] || 'M12 12h.01'
}

const SHORT_FR: Record<string, string> = {
  accueil: 'Accueil', direct: 'Direct', updates: 'MàJ', ships: 'Vaisseaux', fauna: 'Faune',
  galaxies: 'Galaxies', elements: 'Éléments', expeditions: 'Expéd.', war: 'Guerre', guides: 'Guides',
  database: 'Base', recipes: 'Recettes', progress: 'Progrès', portal: 'Portail', multitool: 'Outil',
}
const SHORT_EN: Record<string, string> = {
  accueil: 'Home', direct: 'Live', updates: 'Log', ships: 'Ships', fauna: 'Fauna',
  galaxies: 'Galaxies', elements: 'Elements', expeditions: 'Exped.', war: 'War', guides: 'Guides',
  database: 'Data', recipes: 'Recipes', progress: 'Progress', portal: 'Portal', multitool: 'Tool',
}

export function shortLabel(id: string, lang: Lang): string {
  return (lang === 'fr' ? SHORT_FR : SHORT_EN)[id] || id
}
