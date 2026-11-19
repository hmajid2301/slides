// "Gopher Arcade" syntax theme: bright 8-bit hues on the navy dialog box.
// Scopes checked against Shiki's Go and x86 asm grammars.
const theme = {
  name: 'gopher-arcade',
  type: 'dark',
  colors: { 'editor.background': '#0b1b2b', 'editor.foreground': '#e8f6fb' },
  tokenColors: [
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#b8d3e0' } },
    { scope: ['keyword.operator'], settings: { foreground: '#9cc3d5' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#93abc2', fontStyle: 'italic' } },
    { scope: ['keyword', 'keyword.function', 'keyword.var', 'keyword.control', 'keyword.control.import'], settings: { foreground: '#ff7aa2', fontStyle: 'bold' } },
    { scope: ['storage.type', 'entity.name.type', 'support.type', 'storage.modifier'], settings: { foreground: '#7ee787' } },
    { scope: ['entity.name.function'], settings: { foreground: '#5dc9e2', fontStyle: 'bold' } },
    { scope: ['entity.name.function.support', 'support.function'], settings: { foreground: '#fddd00' } },
    { scope: ['variable.parameter'], settings: { foreground: '#ffd8a8' } },
    { scope: ['constant.numeric'], settings: { foreground: '#ffb86b' } },
    { scope: ['string', 'entity.name.import', 'punctuation.definition.string'], settings: { foreground: '#a5e3a0' } },
    // asm
    { scope: ['keyword.operator.word.mnemonic'], settings: { foreground: '#ff7aa2', fontStyle: 'bold' } },
    { scope: ['constant.language.register'], settings: { foreground: '#5dc9e2' } },
    { scope: ['entity.name.function.asm'], settings: { foreground: '#fddd00', fontStyle: 'bold' } },
    // shell
    { scope: ['variable.other.normal.shell', 'variable.other.assignment.shell'], settings: { foreground: '#ffd8a8' } },
  ],
}

export default function () {
  return { themes: { dark: theme, light: theme } }
}
