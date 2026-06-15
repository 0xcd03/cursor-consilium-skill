#!/usr/bin/env node
/**
 * Multi-model concilium via Cursor SDK.
 *
 * Setup:
 *   cd ~/.cursor/skills/consilium-skill/scripts && npm install
 *   export CURSOR_API_KEY="cursor_..."
 *
 * Usage:
 *   node concilium.mjs --list-models
 *   node concilium.mjs --models "gpt-5.5,claude-opus-4-8" --moderator composer-2.5 --question "..."
 *   node concilium.mjs --models "m1,m2" --question "..." --sequential
 *
 * Moderator must NOT appear in --models (neutral synthesis).
 * Exit codes: 0 ok | 1 runtime | 2 missing CURSOR_API_KEY | 3 API | 4 usage/validation
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { Agent, Cursor } from '@cursor/sdk';

const scriptDir = dirname(fileURLToPath(import.meta.url));

const envLocalPath = join(scriptDir, '.env.local');

function loadEnvLocal() {
  if (!existsSync(envLocalPath)) {
    return;
  }
  const content = readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

const EXIT = {
  OK: 0,
  RUNTIME: 1,
  NO_KEY: 2,
  API: 3,
  USAGE: 4,
};

const { values } = parseArgs({
  options: {
    models: { type: 'string', short: 'm' },
    question: { type: 'string', short: 'q' },
    moderator: { type: 'string' },
    cwd: { type: 'string', default: process.cwd() },
    sequential: { type: 'boolean', default: false },
    'list-models': { type: 'boolean', default: false },
  },
});

function fail(message, code = EXIT.RUNTIME) {
  console.error(message);
  process.exit(code);
}

const apiKey = process.env.CURSOR_API_KEY?.trim();
if (!apiKey || apiKey.includes('REPLACE_ME')) {
  fail(
    'Set CURSOR_API_KEY in environment or scripts/.env.local (next to concilium.mjs)\n' +
      'Get key: https://cursor.com/dashboard/integrations\n' +
      'Run: bash setup.sh (from scripts/)',
    EXIT.NO_KEY
  );
}

async function listAvailableModels() {
  try {
    const listed = await Cursor.models.list({ apiKey });
    return new Map(listed.map((m) => [m.id, m.displayName ?? '']));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    fail(`API error listing models: ${message}`, EXIT.API);
  }
}

function resolveModerator(explicitModerator, participants, available) {
  const trimmed = explicitModerator?.trim();

  if (trimmed) {
    if (participants.includes(trimmed)) {
      fail(
        `Moderator "${trimmed}" must not be in --models. Use a model id outside the debate (see --list-models).`,
        EXIT.USAGE
      );
    }
    if (!available.has(trimmed)) {
      fail(`Unknown moderator "${trimmed}". Run: node concilium.mjs --list-models`, EXIT.USAGE);
    }
    return trimmed;
  }

  if (participants.length >= 3) {
    fail(
      'With 3+ participants pass --moderator explicitly (model id not in --models). See --list-models.',
      EXIT.USAGE
    );
  }

  for (const id of available.keys()) {
    if (!participants.includes(id)) {
      console.error(`Auto-selected moderator: ${id}`);
      return id;
    }
  }

  fail(
    'Cannot auto-pick moderator outside --models. Pass --moderator with a model id not listed in --models.',
    EXIT.USAGE
  );
}

function formatByModel(modelIds, texts) {
  return modelIds.map((id, i) => `### ${id}\n${texts[i]}`).join('\n\n');
}

function othersProposals(modelIds, proposals, selfIndex) {
  return modelIds
    .map((oid, j) => (j === selfIndex ? null : `### ${oid}\n${proposals[j]}`))
    .filter(Boolean)
    .join('\n\n');
}

function critiquesOfParticipant(modelIds, critiques, selfIndex) {
  return modelIds
    .map((id, j) => (j === selfIndex ? null : `### ${id}\n${critiques[j]}`))
    .filter(Boolean)
    .join('\n---\n');
}

async function main() {
  if (values['list-models']) {
    const available = await listAvailableModels();
    for (const [id, name] of available) {
      console.log(id, name);
    }
    return;
  }

  const models = (values.models ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const question = values.question?.trim();

  if (models.length < 2 || !question) {
    fail(
      'Usage: node concilium.mjs --models "m1,m2" --question "..." [--moderator m-outside-debate] [--sequential]',
      EXIT.USAGE
    );
  }

  if (new Set(models).size !== models.length) {
    fail('Duplicate model ids in --models are not allowed.', EXIT.USAGE);
  }

  const available = await listAvailableModels();
  const unknown = models.filter((id) => !available.has(id));
  if (unknown.length > 0) {
    fail(
      `Unknown model id(s): ${unknown.join(', ')}\nRun: node concilium.mjs --list-models`,
      EXIT.USAGE
    );
  }

  const moderatorId = resolveModerator(values.moderator, models, available);

  const brief = `Concilium question: ${question}

Rules: critique ideas not personas; be concrete; same language as question; ~350 words max.`;

  async function askModel(modelId, role, prior) {
    const prompt = `# Concilium — ${role} (model: ${modelId})

## Brief
${brief}

## Prior work
${prior || '(none)'}

## Task
${role}`;

    let result;
    try {
      result = await Agent.prompt(prompt, {
        apiKey,
        model: { id: modelId },
        local: { cwd: values.cwd },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      fail(`API error (${modelId}): ${message}`, EXIT.API);
    }

    if (result.status !== 'finished') {
      fail(`Model ${modelId} failed: ${result.status}`, EXIT.RUNTIME);
    }
    const text = result.result?.trim();
    if (!text) {
      fail(`Model ${modelId} returned empty response`, EXIT.RUNTIME);
    }
    return text;
  }

  async function mapParticipants(fn) {
    if (values.sequential) {
      const results = [];
      for (let i = 0; i < models.length; i += 1) {
        results.push(await fn(models[i], i));
      }
      return results;
    }
    return Promise.all(models.map((id, i) => fn(id, i)));
  }

  function block(title, body) {
    return `\n## ${title}\n\n${body.trim()}\n`;
  }

  console.log(
    `# Concilium\n\n**Participants:** ${models.join(' · ')}\n**Moderator:** ${moderatorId} (not a participant)\n**Question:** ${question}\n`
  );

  const r1 = await mapParticipants((id) =>
    askModel(id, 'Initial proposal: your independent answer to the question.', '')
  );
  console.log(block('Step 1 — initial proposals', formatByModel(models, r1)));

  const r2 = await mapParticipants((id, i) =>
    askModel(
      id,
      'Round 1 critique: critique ALL other participants\' initial proposals. Name what you accept/reject.',
      othersProposals(models, r1, i)
    )
  );
  console.log(block('Step 2 — round 1 critique', formatByModel(models, r2)));

  const r3 = await mapParticipants((id, i) => {
    const ctx = `Your initial proposal:\n${r1[i]}\n\nCritiques directed at you:\n${critiquesOfParticipant(models, r2, i)}`;
    return askModel(id, 'Round 2 revision: revise your proposal addressing critiques.', ctx);
  });
  console.log(block('Step 3 — round 2 revision', formatByModel(models, r3)));

  const r4 = await mapParticipants((id, i) =>
    askModel(
      id,
      'Round 3 final critique: critique ALL other participants\' revised proposals.',
      othersProposals(models, r3, i)
    )
  );
  console.log(block('Step 4 — round 3 final critique', formatByModel(models, r4)));

  const r5 = await mapParticipants((id, i) => {
    const ctx = `Your revision:\n${r3[i]}\n\nFinal critiques of you:\n${critiquesOfParticipant(models, r4, i)}\n\nOthers' revisions:\n${othersProposals(models, r3, i)}`;
    return askModel(
      id,
      'Final position: what you accept from others, what you reject, your bottom line.',
      ctx
    );
  });
  console.log(block('Step 5 — final positions', formatByModel(models, r5)));

  const synthesis = await askModel(
    moderatorId,
    `You are a neutral moderator and did NOT participate in the debate. Synthesize CONSENSUS from all final positions.
Output sections: Final decision | Consensus | Resolved conflicts | Open risks.`,
    formatByModel(models, r5)
  );
  console.log(block('Решение консилиума', synthesis));
}

try {
  await main();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  fail(`Concilium failed: ${message}`, EXIT.RUNTIME);
}
