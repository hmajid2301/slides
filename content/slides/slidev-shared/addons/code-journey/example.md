---
theme: default
addons:
  - '@/'
title: Code Journey · component examples
clicks: 2
canvasWidth: 1280
aspectRatio: 16/9
colorSchema: auto
lineNumbers: false
monaco: false
twoslash: false
fonts:
  provider: none
---

# A code view for your own project

<NeovimCode filename="worker.py" directory-label="src/" filetype="python" :directory="$clicks === 0" :picker="$clicks === 1" :files="['worker.py', 'config.py']" selected="worker.py">

```python
def check(url):
    return client.head(url)
```

<template #preview>

```python
def check(url):
    return client.head(url)
```

</template>
</NeovimCode>

---

# A Starship prompt and coloured output

<TerminalWindow cwd="lettucego" go="1.26.4" command="pre-commit run --all-files">

<pre>
sqlfluff-lint............................<span class="ok">Passed</span>
</pre>

</TerminalWindow>

---
clicks: 3
---

# Files become a package

<GoProjectDiagram scene="packages" :step="$clicks" />

---
clicks: 3
---

# Goroutine, thread, execution resource

<SchedulerDiagram scene="roles" :step="$clicks" />

---
clicks: 4
---

# A full channel buffer

<ChannelDiagram scene="buffer" :step="$clicks" />
