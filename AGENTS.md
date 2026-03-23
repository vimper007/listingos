# Agent Instructions

Before doing anything:

1. At the start of every session, read `./memory.md` before any other task
2. Treat `memory.md` as the canonical source of truth for all future work
3. Use `./codex.md` and `./CLAUDE.md` only as compatibility mirrors
4. If the mirrors disagree with `memory.md`, `memory.md` wins

When making changes:

- If a bug is fixed or a reusable pattern is learned:
  - update `memory.md` first
  - then sync `codex.md` and `CLAUDE.md`

- If the user reports a repeated mistake:
  - add it to the `memory.md` MISTAKE LOG before fixing

- Keep all memory files concise, ASCII-safe, and aligned
