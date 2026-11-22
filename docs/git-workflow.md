# Git Workflow, Developer Quality Gates & Git Hooks

## 1. Branching Strategy

Veyora follows a Trunk-Based Development model with short-lived feature branches:

```
main (production-ready release branch)
  └── develop (integration branch)
        ├── feat/catalog-filtering
        ├── fix/payment-webhook-timeout
        ├── refactor/logging-redaction
        └── chore/husky-upgrade
```

### Branch Naming Conventions

- `feat/<scope>-<description>`: New feature or capability.
- `fix/<scope>-<description>`: Bug fix.
- `chore/<description>`: Tooling, dependencies, or configuration changes.
- `docs/<description>`: Documentation additions or revisions.
- `refactor/<scope>-<description>`: Code restructuring without functional alterations.

---

## 2. Commit Message Guidelines (Conventional Commits)

All commit messages are strictly validated by **Commitlint** before commits can be completed:

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

### Allowed Types

`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

### Valid Examples

```
feat(catalog): implement faceted product filtering
fix(auth): handle expired refresh token gracefully
refactor(cart): extract cart calculation helper
perf(search): optimize MongoDB text search query
test(checkout): add checkout end-to-end journey spec
ci(github): configure monorepo validation pipeline
chore(deps): upgrade dependencies
```

---

## 3. Automated Git Hooks (Husky & lint-staged)

Veyora uses automated hooks to prevent broken, failing, or unformatted code from entering the repository:

### 1. Pre-Commit Hook (`.husky/pre-commit`)

- Triggered on `git commit`.
- Executes `npx lint-staged`.
- Staged TypeScript/JavaScript files are automatically linted with ESLint (`--fix`) and formatted with Prettier (`--write`).
- Staged JSON, Markdown, and CSS files are formatted with Prettier (`--write`).
- Any unresolvable lint errors immediately halt the commit.

### 2. Commit-Msg Hook (`.husky/commit-msg`)

- Validates the commit message against Conventional Commits using `@commitlint/cli` and `@commitlint/config-conventional`.
- Rejects non-conforming, empty, or unformatted commit messages.

### 3. Pre-Push Hook (`.husky/pre-push`)

- Triggered on `git push`.
- Runs full pre-push validation:
  1. `npm run typecheck`: Validates strict TypeScript compilation across all 8 workspaces.
  2. `npm run lint`: Verifies ESLint compliance.
  3. `npm run format:check`: Confirms all files follow Prettier code style.
  4. `npm run test`: Executes unit and integration test suites.
- Prevents pushing broken code to remote branches.

---

## 4. Standard Developer Commands

| Command                 | Purpose                                                        |
| :---------------------- | :------------------------------------------------------------- |
| `npm run dev`           | Launch API, web storefront, and admin portal concurrently      |
| `npm run check`         | Run typecheck, lint, format check, tests, and production build |
| `npm run typecheck`     | Strict TypeScript verification across all 8 workspaces         |
| `npm run lint`          | Run ESLint check across all packages and apps                  |
| `npm run lint:fix`      | Automatically fix autofixable ESLint issues                    |
| `npm run format`        | Format entire monorepo with Prettier                           |
| `npm run format:check`  | Verify formatting without modifying files                      |
| `npm run test`          | Run all package and application test suites                    |
| `npm run test:watch`    | Run test suite in interactive watch mode                       |
| `npm run test:coverage` | Run tests with coverage reporting                              |
| `npm run test:e2e`      | Run Playwright End-to-End tests                                |
| `npm run build`         | Build shared packages, API, worker, and Next.js applications   |
