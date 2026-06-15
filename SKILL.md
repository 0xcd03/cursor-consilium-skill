---
name: concilium-skill
description: >-
  Multi-model concilium (package ~/.cursor/skills/consilium-skill). Activate when
  user asks for concilium/консилиум in Russian OR English (see Triggers section).
  Cursor Task subagents ONLY support composer-2.5-fast; for GPT-5.5/Opus use
  scripts/concilium.mjs with CURSOR_API_KEY. Never curl, env grep, or claude CLI
  — except bash setup.sh reads .env.local locally.
---

# Concilium

## Триггеры / Triggers

**Активируй этот skill**, если сообщение пользователя содержит **любой** из паттернов ниже (RU или EN), даже вперемешку с моделями и вопросом.

### Русский

| Паттерн | Пример |
|---------|--------|
| `консилиум` | «консилиум: Redis или in-memory?» |
| `проведи консилиум` | «проведи консилиум GPT и Opus» |
| `запусти консилиум` | «запусти консилиум по архитектуре кэша» |
| `организуй консилиум` | «организуй консилиум из 3 моделей» |
| `сделай консилиум` | «сделай консилиум Composer + Opus» |
| `мультимодельный консилиум` | «мультимодельный консилиум: …» |
| `совет моделей` | «совет моделей — что выбрать?» |

Регистр не важен. Допустимы варианты: «Консилиум», «КОНСИЛИУМ».

### English

| Pattern | Example |
|---------|---------|
| `concilium` | «concilium: Redis vs in-memory?» |
| `run concilium` | «run concilium with GPT and Opus» |
| `start concilium` | «start concilium on cache architecture» |
| `hold a concilium` | «hold a concilium with 3 models» |
| `multi-model concilium` | «multi-model concilium: …» |
| `model council` | «model council — which option?» |
| `debate council` | «debate council GPT vs Opus» |

Case-insensitive.

### Что извлечь из запроса

1. **Модели** — имена из UI (GPT-5.5, Opus 4.8, Composer 2.5, …) или slug’и.
2. **Вопрос** — всё после двоеточия, тире или глагола-триггера; отвечай на **том же языке**, что и вопрос.
3. Если модели не указаны — уточни одним вопросом или предложи дефолт (2 дебатёра + модератор из `--list-models`).

**Не активируй** при случайном упоминании «council» вне контекста AI-дебата (например «security council» в доменной документации) — смотри намерение: мультимодельный дебат в Cursor.

## Расположение

Канонический пакет: **`~/.cursor/skills/consilium-skill/`** (симлинк на clone репозитория).

Скрипты: **`~/.cursor/skills/consilium-skill/scripts/`** — всегда используй этот путь в Shell.

### First install (новая машина / clone)

```bash
git clone https://github.com/0xcd03/cursor-consilium-skill.git
REPO="$(cd cursor-consilium-skill && pwd)"

# Симлинки для Cursor
ln -sfn "$REPO" ~/.cursor/skills/consilium-skill
ln -sfn "$REPO/rules/concilium.md" ~/.cursor/rules/concilium.md

# Зависимости и API key (Dashboard → Integrations → вставить в scripts/.env.local)
cd ~/.cursor/skills/consilium-skill/scripts && bash setup.sh
```

## Ограничение Cursor

На **2026-06-13** subagent `Task` принимал только:

```
composer-2.5-fast
```

Список может измениться — при ошибке Task смотри `Allowed model slugs` в ответе.

Модели **GPT-5.5**, **Opus 4.8** в UI чата **≠** доступны для Task. Не обходить через curl, env, `claude` CLI.

---

## Выбор режима

| Ситуация | Действие |
|----------|----------|
| Запрошены GPT/Opus/… (не Task) | **SDK-скрипт** (вариант A): `node concilium.mjs --list-models` или полный прогон |
| Только slug’и Task (`composer-2.5-fast`) | **In-chat Task** — каждый Task с **разной ролью** |
| SDK недоступен (нет ключа) | Скрипт сам сообщит; предложи режим перспектив (B) с согласия |

**Не проверяй** `CURSOR_API_KEY` через `env` / `grep` — только запуск скрипта. **Исключение:** `bash setup.sh` локально читает `.env.local` (не для агента).

**Одна модель в нескольких Task:** только с **разными ролями**. Без ролей — не консилиум.

### Сообщение при недоступных моделях

```markdown
Task subagent не поддерживает запрошенные модели (см. Allowed model slugs в ошибке Task).

**Варианты:**
1. **SDK** — probe или полный прогон (без env grep):
   cd ~/.cursor/skills/consilium-skill/scripts && npm install
   node concilium.mjs --list-models
   node concilium.mjs --models "gpt-5.5,claude-opus-4-8" --moderator composer-2.5 --question "…"
   (--moderator не входит в --models)
2. **Режим перспектив** — 2× или 3× Task(composer-2.5-fast), роли advocate/skeptic/pragmatist.
3. **Отмена** — уточнить slug через --list-models.

Shell только для npm install / node concilium.mjs. Не curl/env/claude CLI.
```

---

## Маппинг UI → slug

| UI / запрос | Task | SDK |
|-------------|------|-----|
| Composer 2.5 | `composer-2.5-fast` | `composer-2.5` |
| GPT-5.5 | ❌ | `--list-models` |
| Opus 4.8 | ❌ | часто `claude-opus-4-8` |

Нормализация: пробелы → `-`, `.` → `-`, lowercase.

---

## Единый протокол (6 шагов)

| Шаг | Содержание | In-chat `description` |
|-----|------------|------------------------|
| 1 | Начальные предложения | `Concilium S1 — {role} initial` |
| 2 | Раунд 1 — критика чужих | `Concilium S2 — {role} R1 critique` |
| 3 | Раунд 2 — пересмотр | `Concilium S3 — {role} revision` |
| 4 | Раунд 3 — финальная критика | `Concilium S4 — {role} R3 critique` |
| 5 | Финальные позиции | `Concilium S5 — {role} final` |
| 6 | **Решение консилиума** | оркестратор или SDK `--moderator` |

### In-chat: промпты по шагам

Каждый Task: `model: composer-2.5-fast`, `readonly: true`, в промпт — бриф + prior work.

| Шаг | Task instruction |
|-----|------------------|
| 1 | `Initial proposal: independent answer.` |
| 2 | `Round 1 critique: critique ALL other proposals; accept/reject by name.` |
| 3 | `Round 2 revision: revise using critiques of you.` |
| 4 | `Round 3 final critique: critique ALL revised proposals.` |
| 5 | `Final position: accept/reject from others; bottom line.` |
| 6 | Оркестратор синтезирует (без Task): Final decision \| Consensus \| Resolved conflicts \| Open risks |

Шаги 1–5: параллельные Task по ролям. Не пропускай шаги.

**Роли по числу участников (in-chat / перспективы):**

| Участников | Роли шагов 1–5 | Шаг 6 |
|------------|----------------|-------|
| 2 | **Advocate**, **Skeptic** | Оркестратор (pragmatist-синтез) |
| 3+ | **Advocate**, **Skeptic**, **Pragmatist** (+ при необходимости доп. роли) | Оркестратор или SDK `--moderator` |

**Запрещено:** curl, env/API, CLI LLM, gateway, ответы «от имени Opus» без Task.

Контекст кода: `Read` / `codegraph_*` в бриф.

---

## SDK-скрипт

```bash
cd ~/.cursor/skills/consilium-skill/scripts && bash setup.sh   # создаёт .env.local, открывает Dashboard
# вставьте ключ в .env.local → CURSOR_API_KEY=cursor_…
node concilium.mjs --list-models
node concilium.mjs \
  --models "gpt-5.5,claude-opus-4-8" \
  --moderator composer-2.5 \
  --question "Ваш вопрос"
# --sequential  # при rate limits
```

- **`--moderator`** — модель **вне** `--models` (нейтральный синтез). **Обязателен**, если в `--models` ≥ 3 участника.
- Без `--moderator` при 2 участниках — auto-pick (в stderr: `Auto-selected moderator: …`).
- Зависимость: `@cursor/sdk@1.0.18` (pin); периодически `npm audit`.
- Exit codes скрипта: `1` = runtime (сбой модели / пустой ответ / неожиданная ошибка), `2` = нет `CURSOR_API_KEY`, `3` = API, `4` = usage/validation.

### N участников + 1 модератор

Дебатируют только модели из `--models`. Модератор **не спорит**, только синтезирует (шаг 6).

Если пользователь назвал **3 модели** (например Composer, GPT, Opus) **без 4-й**:

- две — в `--models` (дебат);
- одна — в `--moderator` (вне дебата);
- объясни пользователю, кто дебатирует, кто модерирует.

Пример: запрос «Composer + GPT + Opus» → `--models gpt-5.5,claude-opus-4-8 --moderator composer-2.5`.

Чтобы **все три** спорили — нужна **4-я** модель для `--moderator` (см. `--list-models`).

Ключ: https://cursor.com/dashboard/integrations — храни только в `scripts/.env.local` (в `.gitignore`, не коммить). При утечке — ротация в Dashboard.

Оркестратор: Shell → `node concilium.mjs`; вставь вывод; при необходимости резюмируй **Решение консилиума**.

---

## Режим перспектив (только с согласия)

2× или 3× Task(`composer-2.5-fast`) по таблице ролей выше:

- **Advocate** — аргумент «за» вариант A
- **Skeptic** — аргумент «за» B / риски A
- **Pragmatist** — trade-offs (только при 3+ Task; при 2 — шаг 6 делает оркестратор)

Заголовок: **«Режим перспектив — не запрошенные модели, ограничение Cursor Task»**.

Протокол 6 шагов (таблица выше). Шаг 6 — оркестратор.

---

## Формат итога

```markdown
## Решение консилиума
Final decision | Consensus | Resolved conflicts | Open risks
```

---

## Чеклист

- [ ] Нет curl / env grep / CLI LLM
- [ ] 6 шагов
- [ ] «Решение консилиума»
- [ ] GPT/Opus — SDK или явный режим перспектив

## Примеры / Examples

**RU:**
```
проведи консилиум composer 2.5, GPT-5.5 и Opus 4.8: Redis или in-memory TTL?
```

**EN:**
```
run concilium with Composer 2.5, GPT-5.5 and Opus 4.8: Redis or in-memory TTL?
```

→ объясни: 2 дебатера + Composer модератор (`--models gpt-5.5,claude-opus-4-8 --moderator composer-2.5`); все три в дебате — только с 4-й моделью-модератором.
