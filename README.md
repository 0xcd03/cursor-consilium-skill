# cursor-consilium-skill

Multi-model **concilium** (debate council) for [Cursor](https://cursor.com): GPT, Opus, Composer and other models argue through a 6-step protocol via the Cursor SDK, with an optional in-chat Task fallback.

Мультимодельный **консилиум** для [Cursor](https://cursor.com): GPT, Opus, Composer и другие модели проходят 6-шаговый протокол дебата через Cursor SDK, с fallback через in-chat Task.

---

## English

### What it does

- Runs a structured multi-model debate: initial proposals → 3 critique rounds → final positions → moderator synthesis.
- **SDK mode** (recommended for GPT-5.5, Opus, etc.): `scripts/concilium.mjs` with `CURSOR_API_KEY`.
- **In-chat Task mode**: only `composer-2.5-fast` subagents; uses role-based perspectives (advocate / skeptic / pragmatist).
- Trigger in Cursor chat (RU or EN), e.g.:
  - `проведи консилиум GPT-5.5 и Opus 4.8: …`
  - `run concilium with GPT-5.5 and Opus 4.8: …`
  - `concilium: Redis or in-memory TTL?`
  - `консилиум: Redis или in-memory?`

### Requirements

- [Cursor](https://cursor.com) IDE
- **Node.js ≥ 20**
- **CURSOR_API_KEY** from [Dashboard → Integrations](https://cursor.com/dashboard/integrations)

### Install

```bash
git clone https://github.com/0xcd03/cursor-consilium-skill.git
REPO="$(cd cursor-consilium-skill && pwd)"

# Symlinks so Cursor discovers the skill and rule
ln -sfn "$REPO" ~/.cursor/skills/consilium-skill
ln -sfn "$REPO/rules/concilium.md" ~/.cursor/rules/concilium.md

# Install deps and create scripts/.env.local
cd ~/.cursor/skills/consilium-skill/scripts && bash setup.sh
```

`setup.sh` opens the Dashboard. Paste your API key into `scripts/.env.local`:

```env
CURSOR_API_KEY=cursor_your_key_here
```

Verify:

```bash
node concilium.mjs --list-models
```

### Usage

**In Cursor chat:**

```
проведи консилиум GPT-5.5 и Opus 4.8: Redis or in-memory TTL for report cache?
```

**SDK script (full concilium):**

```bash
cd ~/.cursor/skills/consilium-skill/scripts

node concilium.mjs --list-models

node concilium.mjs \
  --models "gpt-5.5,claude-opus-4-8" \
  --moderator composer-2.5 \
  --cwd "/path/to/your/project" \
  --question "Your question here"
```

| Flag | Description |
|------|-------------|
| `--models` | Comma-separated model ids that **debate** (≥ 2) |
| `--moderator` | Model **outside** `--models` that synthesizes consensus (required if ≥ 3 debaters) |
| `--question` | Debate topic |
| `--cwd` | Project directory for agent context (optional, default: current dir) |
| `--sequential` | Run model calls one-by-one (use if rate-limited) |
| `--list-models` | Print available model ids |

**Example:** user asks for Composer + GPT + Opus → typically 2 debaters + 1 moderator:

```bash
node concilium.mjs \
  --models "gpt-5.5,claude-opus-4-8" \
  --moderator composer-2.5 \
  --question "…"
```

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Runtime error (model failure, empty response) |
| `2` | Missing `CURSOR_API_KEY` |
| `3` | API error |
| `4` | Usage / validation error |

### Security

- **Never commit** `scripts/.env.local` — it is in `.gitignore`.
- Rotate your API key in the Dashboard if it was ever exposed.

### Full protocol

See [`SKILL.md`](SKILL.md) for the complete agent protocol, Task limitations, and perspective mode.

---

## Русский

### Что это

- Структурированный мультимодельный дебат: начальные предложения → 3 раунда критики → финальные позиции → синтез модератора.
- **Режим SDK** (для GPT-5.5, Opus и др.): скрипт `scripts/concilium.mjs` + `CURSOR_API_KEY`.
- **Режим in-chat Task**: только subagent `composer-2.5-fast`; роли advocate / skeptic / pragmatist.
- Триггер в чате Cursor (RU или EN), например:
  - `проведи консилиум GPT-5.5 и Opus 4.8: …`
  - `run concilium with GPT-5.5 and Opus 4.8: …`
  - `concilium: Redis or in-memory TTL?`
  - `консилиум: Redis или in-memory?`

### Требования

- [Cursor](https://cursor.com) IDE
- **Node.js ≥ 20**
- **CURSOR_API_KEY** из [Dashboard → Integrations](https://cursor.com/dashboard/integrations)

### Установка

```bash
git clone https://github.com/0xcd03/cursor-consilium-skill.git
REPO="$(cd cursor-consilium-skill && pwd)"

# Симлинки — Cursor подхватит skill и rule
ln -sfn "$REPO" ~/.cursor/skills/consilium-skill
ln -sfn "$REPO/rules/concilium.md" ~/.cursor/rules/concilium.md

# Зависимости и создание scripts/.env.local
cd ~/.cursor/skills/consilium-skill/scripts && bash setup.sh
```

`setup.sh` откроет Dashboard. Вставьте ключ в `scripts/.env.local`:

```env
CURSOR_API_KEY=cursor_your_key_here
```

Проверка:

```bash
node concilium.mjs --list-models
```

### Использование

**В чате Cursor:**

```
проведи консилиум GPT-5.5 и Opus 4.8: Redis или in-memory TTL для кэша отчётов?
```

**SDK-скрипт (полный консилиум):**

```bash
cd ~/.cursor/skills/consilium-skill/scripts

node concilium.mjs --list-models

node concilium.mjs \
  --models "gpt-5.5,claude-opus-4-8" \
  --moderator composer-2.5 \
  --cwd "/path/to/your/project" \
  --question "Ваш вопрос"
```

| Флаг | Описание |
|------|----------|
| `--models` | Id моделей, которые **спорят** (≥ 2), через запятую |
| `--moderator` | Модель **вне** `--models`, синтезирует консенсус (обязателен при ≥ 3 дебатёрах) |
| `--question` | Тема дебата |
| `--cwd` | Каталог проекта для контекста агента (опционально) |
| `--sequential` | Последовательные вызовы (при rate limit) |
| `--list-models` | Список доступных id моделей |

**Пример:** запрос «Composer + GPT + Opus» → обычно 2 дебатёра + 1 модератор:

```bash
node concilium.mjs \
  --models "gpt-5.5,claude-opus-4-8" \
  --moderator composer-2.5 \
  --question "…"
```

### Коды выхода

| Код | Значение |
|-----|----------|
| `0` | Успех |
| `1` | Runtime (сбой модели, пустой ответ) |
| `2` | Нет `CURSOR_API_KEY` |
| `3` | Ошибка API |
| `4` | Ошибка аргументов / валидации |

### Безопасность

- **Не коммитьте** `scripts/.env.local` — файл в `.gitignore`.
- При утечке ключа — ротация в Dashboard.

### Полный протокол

См. [`SKILL.md`](SKILL.md) — протокол агента, ограничения Task, режим перспектив.

---

## Repository layout

```
cursor-consilium-skill/
├── README.md           # This file
├── SKILL.md            # Full agent protocol (for Cursor skills)
├── rules/concilium.md  # Short Cursor rule (symlink to ~/.cursor/rules/)
└── scripts/
    ├── concilium.mjs   # SDK multi-model debate script
    ├── setup.sh        # npm install + .env.local bootstrap
    ├── package.json
    └── .env.local.example
```
