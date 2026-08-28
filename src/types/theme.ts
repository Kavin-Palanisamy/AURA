/**
 * AURA Theme Definitions (Day 6: Polish & Quality Assurance)
 */

export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  effectiveTheme: 'dark' | 'light';
}
