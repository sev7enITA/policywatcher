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
4. Test your changes locally with `npm run build` (must pass with zero errors).
5. Write a clear PR description explaining what changed and why.

### Development Setup

```bash
# Clone your fork
git clone https://github.com/<your-username>/policywatcher.git
cd policywatcher

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# Seed the database (optional, for demo data)
npm run dev
# Then visit http://localhost:3000/api/seed

# Start the dev server
npm run dev
```

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

Be respectful, constructive, and inclusive. Discrimination or harassment of any kind will not be tolerated.

## License

By contributing, you agree that your contributions will be licensed under the [CC BY 4.0](LICENSE) license.
