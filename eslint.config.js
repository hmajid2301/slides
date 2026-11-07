import eslint from '@eslint/js';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.slidev/**',
      'public/**',
      'static/slides/*',
      '!static/slides/reveal-init.js',
      'docs/**',
    ],
  },
  eslint.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    files: ['static/slides/reveal-init.js'],
    languageOptions: {
      globals: {
        Reveal: 'readonly',
        RevealMarkdown: 'readonly',
        RevealHighlight: 'readonly',
        RevealNotes: 'readonly',
        RevealZoom: 'readonly',
      },
    },
  },
  {
    // Slidev resolves layouts by filename, including default.vue and section.vue.
    files: ['content/slides/**/layouts/*.vue'],
    rules: { 'vue/multi-word-component-names': 'off' },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: ts.parser },
    },
  },
);
