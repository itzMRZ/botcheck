# BotCheck

Robotics hardware compatibility checker for a brain, actuator, and power source loadout.

## Vercel setup

1. Create a Vercel project from this repository.
2. Add `OPENAI_API_KEY` in Vercel Environment Variables.
3. Optional: add `OPENAI_MODEL` to override the default `gpt-4o-mini`.
4. Deploy.

The browser sends only selected component names to `/api/validate`. The serverless function keeps the OpenAI key and prompt server-side, recomputes deterministic checks, uses a structured tool call, and returns only the JSON needed by the UI cards.

## Local checks

```bash
npm run check
```

For local serverless testing, run:

```bash
vercel dev
```
