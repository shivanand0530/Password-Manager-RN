// Theme colors for light and dark mode

export const lightTheme = {
  // Background colors
  background: '#f9fafb',
  card: '#ffffff',
  cardAlt: '#f3f4f6',
  
  // Text colors
  text: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#6b7280',
  
  // UI element colors
  primary: '#3b82f6',
  success: '#059669',
  danger: '#dc2626',
  warning: '#f59e0b',
  purple: '#8b5cf6',
  
  // Border colors
  border: '#e5e7eb',
  borderDark: '#d1d5db',
  
  // Icon background
  iconBackground: '#f3f4f6',
};

export const darkTheme = {
  // Background colors
  background: '#111827',
  card: '#1f2937',
  cardAlt: '#374151',
  
  // Text colors
  text: '#f9fafb',
  textSecondary: '#e5e7eb',
  textMuted: '#9ca3af',
  
  // UI element colors
  primary: '#3b82f6',
  success: '#059669',
  danger: '#dc2626',
  warning: '#f59e0b',
  purple: '#8b5cf6',
  
  // Border colors
  border: '#374151',
  borderDark: '#4b5563',
  
  // Icon background
  iconBackground: '#374151',
};

export type ThemeColors = typeof darkTheme;