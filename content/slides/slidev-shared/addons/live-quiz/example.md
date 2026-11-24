# Example quiz

`quiz.yaml` next to `slides.md`:

```yaml
version: 1
title: My talk quiz
questions:
  - id: q1
    prompt: How many lanes does a 256-bit register hold for float32?
    options: ['4', '8', '16', '32']
    correct: B
    explanation: 256 / 32 = 8.
```

`slides.md`:

```md
---
addons:
  - slidev-addon-live-quiz
---

# Welcome

<QuizJoin compact />

---
clicks: 3
---

<QuizQuestion id="q1" :step="$clicks" />

---

<QuizWinner />
```
