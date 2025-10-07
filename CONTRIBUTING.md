# Contributing to CryptoSense

Thank you for your interest in contributing to CryptoSense! This document provides guidelines and instructions for contributing.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Report unacceptable behavior to support@coinsphere.io

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Coinsphere.git`
3. Add upstream remote: `git remote add upstream https://github.com/mkelam/Coinsphere.git`
4. Follow the [Developer Onboarding Guide](./Documentation/DEVELOPER_ONBOARDING.md)

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following our [Code Style Guide](./Documentation/CODE_STYLE_GUIDE.md)
   - Add tests for new features
   - Update documentation if needed

3. **Test your changes**
   ```bash
   # Frontend
   cd frontend && npm test

   # Backend
   cd backend && npm test

   # ML Service
   cd ml-service && pytest
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template

## Coding Standards

### TypeScript/JavaScript
- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting
- Write JSDoc comments for public APIs

### Python
- Follow PEP 8
- Use Black for formatting
- Use type hints
- Write docstrings (Google style)

### General
- Write self-documenting code
- Add comments for complex logic
- Keep functions small and focused
- Avoid premature optimization

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

**Format:** `<type>(<scope>): <subject>`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling

**Examples:**
```
feat(portfolio): add risk score column to holdings table
fix(api): handle 429 rate limit errors from CoinGecko
docs(readme): update installation instructions
refactor(hooks): extract portfolio fetching to usePortfolio hook
```

## Pull Request Process

1. **PR Requirements:**
   - [ ] All tests pass
   - [ ] Code follows style guide
   - [ ] Documentation updated (if needed)
   - [ ] No merge conflicts
   - [ ] Linked to related issue

2. **PR Description Template:**
   ```markdown
   ## Summary
   Brief description of what this PR does (1-2 sentences)

   ## Changes
   - Added WhaleAlert component
   - Implemented whale transaction detection service
   - Updated AlertService to support whale alerts

   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Manual testing completed
   - [ ] Tested on mobile viewport (if UI change)

   ## Screenshots (if UI change)
   [Attach screenshots or GIFs]

   ## Related Issues
   Closes #123
   Related to #456
   ```

3. **Review Process:**
   - Maintainers will review within 48 hours
   - Address feedback and update PR
   - Once approved, maintainers will merge

4. **After Merge:**
   - Delete your branch
   - Pull latest changes: `git pull upstream master`

## Types of Contributions

### Bug Reports
- Use GitHub Issues
- Include: steps to reproduce, expected vs actual behavior, environment info
- Add `bug` label

### Feature Requests
- Use GitHub Issues
- Describe the problem you're solving
- Add `enhancement` label

### Documentation
- Fix typos, improve clarity, add examples
- Update docs when changing APIs

### Code
- New features (discuss in issue first)
- Bug fixes
- Performance improvements
- Refactoring

## Questions?

- Check [Documentation](./Documentation)
- Ask in GitHub Discussions
- Email: dev@coinsphere.io

Thank you for contributing! 🚀
