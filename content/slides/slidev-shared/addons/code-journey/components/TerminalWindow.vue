<script setup lang="ts">
withDefaults(defineProps<{
  command?: string
  title?: string
  cwd?: string
  go?: string
  python?: string
  prompt?: string
}>(), {
  title: 'bash',
  prompt: '❯',
})
</script>

<template>
  <figure class="terminal-window" :aria-label="`Terminal${command ? `: ${command}` : ''}`">
    <header class="titlebar">
      <span class="traffic" aria-hidden="true"><i /><i /><i /></span>
      <span class="title">{{ title }}</span>
    </header>
    <div class="screen">
      <p v-if="cwd || go || python" class="context-line">
        <span v-if="cwd" class="dir">{{ cwd }}</span>
        <template v-if="go"><span class="sep">via</span><span class="go">🐹 v{{ go }}</span></template>
        <template v-if="python"><span class="sep">via</span><span class="python">🐍 v{{ python }}</span></template>
      </p>
      <p v-if="command" class="command-line">
        <span class="prompt" aria-hidden="true">{{ prompt }}</span>
        <span class="command">{{ command }}</span>
        <span class="cursor" aria-hidden="true"></span>
      </p>
      <div class="output"><slot /></div>
    </div>
  </figure>
</template>

<style scoped>
.terminal-window {
  border: 1px solid var(--_journey-border);
  border-radius: 10px;
  background: var(--_journey-paper);
  color: var(--_journey-ink);
  font: 22px/1.5 var(--_journey-mono);
  overflow: hidden;
  box-shadow: 0 12px 28px #0002;
}
.titlebar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 16px;
  background: var(--_journey-surface);
  border-bottom: 1px solid var(--_journey-border);
  font-size: 18px;
}
.traffic { display: flex; gap: 7px; }
.traffic i { width: 12px; height: 12px; border-radius: 50%; }
.traffic i:nth-child(1) { background: #ff5f57; }
.traffic i:nth-child(2) { background: #febc2e; }
.traffic i:nth-child(3) { background: #28c840; }
.title { color: var(--_journey-muted); }
.screen { padding: 18px 22px 22px; }
.context-line { margin: 0 0 14px; white-space: pre-wrap; overflow-wrap: anywhere; }
.context-line > span { margin-right: 0.7ch; }
.sep { color: var(--_journey-muted); margin-left: 0.3ch; }
.dir { color: #94e2d5; font-weight: 700; }
.go { color: #94e2d5; font-weight: 700; }
.python { color: #f9e2af; font-weight: 700; }
.command-line { margin: 0 0 16px; white-space: pre-wrap; overflow-wrap: anywhere; }
.prompt { color: #a6e3a1; font-weight: 700; margin-right: 1ch; }
.command { color: var(--_journey-ink); }
.cursor {
  display: inline-block;
  width: 9px;
  height: 1.15em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: var(--_journey-ink);
  animation: terminal-blink 1.1s steps(1) infinite;
}
@keyframes terminal-blink { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .cursor { animation: none; } }
.output :deep(pre),
.output :deep(pre.shiki),
.output :deep(.slidev-code-wrapper) {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent !important;
  box-shadow: none;
}
.output :deep(pre) { font-size: 22px; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
.output :deep(code) {
  background: transparent !important;
  color: var(--_journey-ink);
  font-family: inherit;
  padding: 0;
}
.output :deep(.ok),
.output :deep(.pass) { color: #a6e3a1; font-weight: 700; }
.output :deep(.fail),
.output :deep(.err) { color: #f38ba8; font-weight: 700; }
.output :deep(.warn),
.output :deep(.timeout) { color: #f9e2af; }
.output :deep(.info),
.output :deep(.path) { color: #94e2d5; }
.output :deep(.dim) { color: var(--_journey-muted); }
@media print { .terminal-window { box-shadow: none; } }
</style>
