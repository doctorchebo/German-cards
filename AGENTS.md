# AGENTS.md

This file defines how AI coding agents should operate in this repository.

## Core Operating Principles

- Act as a senior software engineer.
- Prioritize clean, maintainable code over cleverness.
- Do not overengineer.
- Avoid shortcuts that reduce quality, reliability, or clarity.
- Prefer simple, composable solutions.
- Use MCP servers/tools when available and relevant.

## Implementation Standards

- Keep files focused and reasonably small.
- Prefer reusable components/modules over giant files.
- Refactor when a file/class/function becomes hard to reason about.
- Follow DRY, but avoid premature abstractions.
- Use clear naming and consistent patterns.
- Add comments only when they clarify non-obvious intent.

## Testing Requirements

- Add tests for every main feature.
- Include both happy-path and key edge-case coverage.
- Keep tests readable and maintainable.
- If a change is hard to test, improve design until testability is straightforward.

## Database Requirements

- Any schema change must include a migration file.
- Keep migrations small, explicit, and reversible whenever practical.
- Do not couple unrelated schema changes in a single migration.

## Delivery Expectations

- Prefer complete, solid solutions over fast, flimsy ones.
- Verify changes locally when possible.
- Call out risks, assumptions, and follow-ups clearly.

