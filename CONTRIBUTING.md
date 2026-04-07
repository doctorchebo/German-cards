# Contributing Guide

This project values code quality, maintainability, and steady delivery.

## Engineering Rules

- Build the simplest solution that meets the requirement.
- Do not overengineer.
- Keep modules/components small and single-purpose.
- Refactor before complexity becomes entrenched.
- Apply DRY thoughtfully; avoid duplication of business logic.
- Favor explicit, readable code over clever shortcuts.

## Project Structure

- Avoid "god files" and oversized classes/components.
- Split UI into reusable components.
- Split backend/domain logic into focused services/modules.
- Keep shared utilities in clearly named common locations.

## Testing Policy

- Every main feature must include tests.
- Add/adjust tests in the same PR as feature changes.
- Prefer deterministic tests with clear assertions.
- Cover:
  - expected behavior
  - meaningful edge cases
  - failure paths for core flows

## Database & Migrations

- All schema changes require migrations.
- Never edit production schema manually as a substitute for migrations.
- Keep migration files atomic and descriptive.
- Validate migrations against existing data assumptions.

## Pull Request Checklist

- Code is clean, readable, and scoped.
- No unnecessary abstractions.
- Repetition in logic has been reduced appropriately.
- Main flows are tested.
- Schema changes include migrations (if applicable).
- Docs/comments updated when behavior changes.

