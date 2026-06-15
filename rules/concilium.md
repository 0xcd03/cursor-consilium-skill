---
description: >-
  Concilium / консилиум — мультимодельный дебат. Activate on RU or EN triggers:
  консилиум, проведи/запусти консилиум, concilium, run/start concilium, model council.
  Task only composer-2.5-fast; GPT/Opus — SDK script. No curl/env/claude CLI except setup.sh.
alwaysApply: false
---

# Concilium (кратко)

Полный протокол: `~/.cursor/skills/consilium-skill/SKILL.md`

**Триггеры (RU):** консилиум, проведи/запусти/организуй/сделай консилиум, мультимодельный консилиум, совет моделей.

**Triggers (EN):** concilium, run/start concilium, hold a concilium, multi-model concilium, model council, debate council.

- **Task** — только `composer-2.5-fast`; иначе SDK или режим перспектив (с согласия).
- **Запрещено:** curl, env/API keys (`env | grep`), `claude`/`codex` CLI, gateway, симуляция чужих моделей без Task/SDK.
- **Shell разрешён** только для: `cd ~/.cursor/skills/consilium-skill/scripts && npm install && node concilium.mjs …`
- **Не проверяй** `CURSOR_API_KEY` через env — запусти `node concilium.mjs --list-models`; если нет ключа, скрипт сам сообщит. **Исключение:** `bash setup.sh` локально читает `.env.local` (не для агента).

При GPT/Opus: по умолчанию предложи SDK (вариант A). Иначе — B/C из skill.
