---
description: Консилиум — мультимодельный дебат. Применяй когда пользователь пишет «консилиум», «concilium», «проведи консилиум». Task только composer-2.5-fast; GPT/Opus — SDK-скрипт. Запрещены curl, env, claude CLI кроме bash setup.sh.
alwaysApply: false
---

# Concilium (кратко)

Полный протокол: `~/.cursor/skills/consilium-skill/SKILL.md`

- **Task** — только `composer-2.5-fast`; иначе SDK или режим перспектив (с согласия).
- **Запрещено:** curl, env/API keys (`env | grep`), `claude`/`codex` CLI, gateway, симуляция чужих моделей без Task/SDK.
- **Shell разрешён** только для: `cd ~/.cursor/skills/consilium-skill/scripts && npm install && node concilium.mjs …`
- **Не проверяй** `CURSOR_API_KEY` через env — запусти `node concilium.mjs --list-models`; если нет ключа, скрипт сам сообщит. **Исключение:** `bash setup.sh` локально читает `.env.local` (не для агента).

При GPT/Opus: по умолчанию предложи SDK (вариант A). Иначе — B/C из skill.
