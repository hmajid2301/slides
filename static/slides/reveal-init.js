Reveal.initialize({
  ...window.revealConfig,
  plugins: [RevealMarkdown, RevealHighlight, RevealNotes, RevealZoom],
});

let mermaid;
async function renderDiagrams(event) {
  for (const code of event.currentSlide.querySelectorAll('pre code.mermaid, pre code.language-mermaid')) {
    const diagram = document.createElement('pre');
    diagram.className = 'mermaid';
    diagram.textContent = code.textContent;
    code.parentElement.replaceWith(diagram);
  }
  const nodes = event.currentSlide.querySelectorAll('.mermaid:not([data-processed])');
  if (!nodes.length) return;
  mermaid ??= import('./mermaid/mermaid.esm.min.mjs').then(({ default: api }) => {
    api.initialize({ startOnLoad: false });
    return api;
  });
  await (await mermaid).run({ nodes });
}
Reveal.on('ready', event => renderDiagrams(event).catch(console.error));
Reveal.on('slidechanged', event => renderDiagrams(event).catch(console.error));
