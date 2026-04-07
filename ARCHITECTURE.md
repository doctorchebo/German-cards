# Architecture Guidelines

## Design Goals

- Maintainability first.
- Clear separation of concerns.
- Low coupling, high cohesion.
- Incremental evolution over big rewrites.

## Practical Boundaries

- UI components handle presentation and local UI behavior.
- Business logic lives in dedicated domain/service modules.
- Data access is isolated behind repository/data-layer interfaces.
- Cross-cutting helpers (logging, validation, formatting) are centralized.

## Complexity Triggers (Refactor Signals)

Refactor when any of the following is true:

- A file grows too large to understand quickly.
- A function has multiple responsibilities.
- Similar logic appears in 2+ places.
- Changes in one area repeatedly break unrelated behavior.
- Testing requires heavy setup for simple logic.

## Anti-Patterns To Avoid

- Giant files/components with mixed responsibilities.
- Hidden side effects in shared helpers.
- Tight coupling between UI and persistence layers.
- Premature generic abstractions.
- Fast patches that skip tests for core flows.

## Evolution Rules

- Prefer small, safe refactors.
- Keep public interfaces stable when possible.
- Add migration files for database schema evolution.
- Update tests and docs alongside behavior changes.

