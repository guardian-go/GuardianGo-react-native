/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        'primary-light': '#DBEAFE',
        'primary-dark': '#1E40AF',
        success: '#16A34A',
        'success-light': '#DCFCE7',
        warning: '#D97706',
        'warning-light': '#FEF3C7',
        danger: '#DC2626',
        'danger-light': '#FEE2E2',
        purple: '#7C3AED',
        'purple-light': '#EDE9FE',
        background: '#F8FAFC',
        card: '#FFFFFF',
        border: '#E2E8F0',
        divider: '#F1F5F9',
        'text-primary': '#0F172A',
        'text-secondary': '#64748B',
        'text-light': '#CBD5E1',
      },
    },
  },
  plugins: [],
};
