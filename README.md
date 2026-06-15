# cursor-consilium-skill

Multi-model **concilium** for [Cursor](https://cursor.com): GPT, Opus, Composer debate via Cursor SDK, with a 6-step protocol and optional in-chat Task fallback.

## Install

```bash
git clone https://github.com/0xcd03/cursor-consilium-skill.git
REPO="$(cd cursor-consilium-skill && pwd)"

ln -sfn "$REPO" ~/.cursor/skills/consilium-skill
ln -sfn "$REPO/rules/concilium.md" ~/.cursor/rules/concilium.md

cd ~/.cursor/skills/consilium-skill/scripts && bash setup.sh
```

Paste your API key from [Cursor Dashboard → Integrations](https://cursor.com/dashboard/integrations) into `scripts/.env.local`.

## Usage

**In Cursor chat:**

```
проведи консилиум GPT-5.5 и Opus 4.8: your question here?
```

**SDK script:**

```bash
cd ~/.cursor/skills/consilium-skill/scripts
node concilium.mjs --list-models
node concilium.mjs \
  --models "gpt-5.5,claude-opus-4-8" \
  --moderator composer-2.5 \
  --question "Your question"
```

Full protocol: `SKILL.md`

## Requirements

- Node.js ≥ 20
- `CURSOR_API_KEY` from Cursor Dashboard
