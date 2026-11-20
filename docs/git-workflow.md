# Git Workflow & Conventions

## 1. Branching Strategy

Veyora follows a Trunk-Based Development model with short-lived feature branches:

```
main (production-ready trunk)
  └── feat/monorepo-foundation
  └── fix/api-error-handling
  └── chore/upgrade-dependencies
```

### Branch Naming Conventions

- `feat/<scope>-<description>`: New capability or application skeleton.
- `fix/<scope>-<description>`: Bug fix.
- `chore/<description>`: Tooling, dependencies, or configuration changes.
- `docs/<description>`: Documentation additions or revisions.
- `refactor/<scope>-<description>`: Code restructuring without functional alterations.

---

## 2. Commit Message Guidelines

All commit messages must adhere to the **Conventional Commits** specification:

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

### Allowed Types

- `feat`: A new feature or capability.
- `fix`: A bug fix.
- `docs`: Documentation only changes.
- `style`: Changes that do not affect the meaning of the code (whitespace, formatting).
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `test`: Adding missing tests or correcting existing tests.
- `chore`: Changes to build process or auxiliary tools/libraries.

### Recognized Scopes

- `web`: `apps/web`
- `admin`: `apps/admin`
- `api`: `apps/api`
- `worker`: `apps/worker`
- `types`: `packages/types`
- `validators`: `packages/validators`
- `utils`: `packages/utils`
- `config`: `packages/config`
- `infra`: Docker, compose, CI/CD

### Example Commits

```
feat(web): initialize Next.js 15 storefront with Tailwind v4 and shadcn
chore(repo): configure Turborepo task pipeline and root scripts
fix(api): handle uncaught errors in express error middleware
docs(monorepo): document workspace package dependency structure
```

---

## 3. Pull Request Requirements

Before submitting or merging any pull request:

1. **Branch Freshness**: Rebase against the latest `main`.
2. **Quality Gate Checks**:
   - `npm run lint` passes with 0 errors.
   - `npm run typecheck` passes with 0 errors.
   - `npm run build` passes for all workspaces.
   - `npm run format:check` reports code is properly formatted.
3. **Review**: Minimum of one code owner review approval.
