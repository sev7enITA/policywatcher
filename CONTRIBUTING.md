# Contributing to PolicyWatcher

Thank you for your interest in contributing to PolicyWatcher. This document explains how to get involved.

## How to Contribute

### Reporting Issues

- Use GitHub Issues to report bugs or suggest features.
- Include steps to reproduce, expected behavior, and actual behavior.
- Attach screenshots or error logs when relevant.

### Pull Requests

1. Fork the repository and create a feature branch from `main`.
2. Follow the existing code style (TypeScript strict mode, CSS Modules).
3. Add JSDoc comments to all new exported functions and interfaces.
4. Add or update focused tests when changing shared logic, parsing, security,
   data-quality, or API behavior.
5. Test your changes locally with the quality commands below.
6. Write a clear PR description explaining what changed and why.

### Development Setup

```bash
# Clone your fork
git clone https://github.com/<your-username>/policywatcher.git
cd policywatcher

# Install dependencies
npm ci

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# Seed the database locally when needed
npx prisma db seed

# Repair and validate dataset evidence
npm run db:repair
npm run db:backfill-check-logs
npm run qa:dataset

# Start the dev server
npm run dev
```

### Local Quality Gate

Run these before opening a pull request:

```bash
npm run test
npm run qa:dataset
npm run lint
npm run build
```

Use `npm run test:coverage` when changing core library logic.

### Code Style

- **Language**: TypeScript (strict mode enabled).
- **Components**: React functional components with CSS Modules.
- **Comments**: English only. JSDoc on all exports.
- **Naming**: camelCase for variables/functions, PascalCase for components/interfaces.
- **Imports**: Group by: external packages, internal modules, styles, types.

### Areas Where Help Is Welcome

- Adding new companies to the monitored portfolio (edit `prisma/seed.ts`).
- Improving scraper resilience against new anti-bot patterns.
- Adding support for additional languages beyond EN/IT.
- Writing automated tests (unit, integration, e2e).
- Accessibility improvements (ARIA, keyboard navigation).
- Documentation translations.

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Security Reports

Do not open public issues for vulnerabilities or leaked secrets. See
[SECURITY.md](SECURITY.md) and report privately to security@policywatcher.online.

## License

By contributing, you agree that your contributions will be licensed under the [CC BY 4.0](LICENSE) license.
