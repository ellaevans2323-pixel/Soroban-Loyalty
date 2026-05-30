# Contributing to Soroban Loyalty

Thank you for your interest in contributing to Soroban Loyalty! We welcome contributions from developers of all skill levels.

---

## 🚀 New Contributors

**First time contributing?** Start here:

👉 **[Onboarding Guide](docs/onboarding.md)** - Complete step-by-step guide for new contributors

The onboarding guide covers:
- Setting up your development environment
- Finding your first issue
- Making changes and testing
- Submitting your first pull request
- Getting help when you need it

---

## 📋 Quick Start for Experienced Contributors

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR-USERNAME/soroban-loyalty.git
cd soroban-loyalty
git remote add upstream https://github.com/your-org/soroban-loyalty.git
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name-issue-number
```

### 3. Make Changes

Follow the code style and conventions used in the project.

### 4. Test Your Changes

```bash
# Smart contracts
cargo test

# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### 5. Commit and Push

```bash
git add .
git commit -m "Your descriptive commit message

Closes #issue-number"
git push origin feature/your-feature-name-issue-number
```

### 6. Create Pull Request

Open a PR on GitHub with a clear description of your changes.

---

## 🏷️ Finding Issues to Work On

We use labels to help you find issues that match your interests and skill level:

- **`good first issue`** - Perfect for newcomers
- **`documentation`** - Writing or improving docs
- **`bug`** - Fixing broken functionality
- **`enhancement`** - Adding new features
- **`frontend`** - React/Next.js work
- **`backend`** - Node.js/API work
- **`smart-contracts`** - Rust/Soroban work
- **`help wanted`** - We need your expertise!

**Before starting work on an issue:**
1. Check if it's already assigned
2. Comment on the issue to claim it
3. Wait for a maintainer to assign it to you

---

## 💻 Development Setup

### Prerequisites

- [Rust](https://rustup.rs/) + `wasm32-unknown-unknown` target
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/install-stellar-cli)
- [Docker + Docker Compose](https://docs.docker.com/get-docker/)
- [Node.js 20+](https://nodejs.org/)

### Environment Setup

See the [README.md](README.md#quick-start) for detailed setup instructions.

**Quick start with Docker:**

```bash
cp .env.example .env
docker-compose up --build
```

---

## 📝 Code Style Guidelines

### Smart Contracts (Rust)

- Follow Rust naming conventions (snake_case for functions, PascalCase for types)
- Run `cargo fmt` before committing
- Run `cargo clippy` to catch common issues
- Add tests for all new functionality
- Document public functions with doc comments (`///`)

### Backend (TypeScript)

- Use TypeScript strict mode
- Follow existing code structure and patterns
- Add JSDoc comments for exported functions
- Use meaningful variable and function names
- Handle errors appropriately

### Frontend (React/TypeScript)

- Use functional components with hooks
- Follow React best practices
- Ensure responsive design (mobile, tablet, desktop)
- Use TypeScript for type safety
- Keep components focused and reusable

### Documentation

- Use clear, concise language
- Include code examples where helpful
- Check spelling and grammar
- Follow Markdown best practices
- Keep documentation up to date with code changes

---

## 🧪 Testing Requirements

All contributions should include appropriate tests:

### Smart Contracts

```bash
# Run all tests
cargo test

# Run specific contract tests
cargo test -p soroban-loyalty-token
```

**Required test coverage:**
- Happy path scenarios
- Error cases and edge cases
- Authorization checks
- Overflow/underflow protection

### Backend

```bash
cd backend
npm test
```

**Test requirements:**
- API endpoint tests
- Service layer tests
- Error handling tests
- Database interaction tests (if applicable)

### Frontend

```bash
cd frontend
npm test
```

**Test requirements:**
- Component rendering tests
- User interaction tests
- Integration tests for critical flows

---

## 📤 Pull Request Process

### PR Title Format

Use clear, descriptive titles:

```
Add user authentication to dashboard
Fix responsive layout on mobile devices
Update API documentation for campaigns endpoint
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Changes
- List of specific changes made
- Another change
- And another

## Testing
- How you tested these changes
- What scenarios you covered

## Screenshots (if applicable)
Add screenshots for UI changes

Closes #issue-number
```

### PR Checklist

Before submitting, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] New tests added for new functionality
- [ ] Documentation updated (if needed)
- [ ] Commit messages are clear and descriptive
- [ ] PR description explains the changes
- [ ] Issue number referenced with `Closes #XXX`

### Review Process

1. **Automated checks** - CI/CD runs tests and linters
2. **Code review** - Maintainers review your code
3. **Feedback** - Address any requested changes
4. **Approval** - Maintainer approves the PR
5. **Merge** - Your contribution is merged! 🎉

**Response time**: We aim to review PRs within 1-3 business days.

---

## 🔄 Keeping Your Fork Updated

Regularly sync your fork with the upstream repository:

```bash
# Fetch upstream changes
git fetch upstream

# Switch to main branch
git checkout main

# Merge upstream changes
git merge upstream/main

# Push to your fork
git push origin main
```

---

## 🐛 Reporting Bugs

Found a bug? Please open an issue with:

1. **Clear title** - Summarize the bug
2. **Description** - What happened vs. what you expected
3. **Steps to reproduce** - How to trigger the bug
4. **Environment** - OS, browser, Node version, etc.
5. **Screenshots** - If applicable
6. **Logs** - Any error messages or console output

---

## 💡 Suggesting Features

Have an idea for a new feature? Open an issue with:

1. **Clear title** - Summarize the feature
2. **Problem statement** - What problem does this solve?
3. **Proposed solution** - How should it work?
4. **Alternatives** - Other approaches you considered
5. **Additional context** - Mockups, examples, etc.

---

## 🤝 Code of Conduct

### Our Standards

- **Be respectful** - Treat everyone with respect and kindness
- **Be collaborative** - Work together to improve the project
- **Be constructive** - Provide helpful feedback
- **Be patient** - Remember that everyone is learning
- **Be inclusive** - Welcome contributors from all backgrounds

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Spam or off-topic discussions
- Sharing private information without permission

**Violations**: Report to project maintainers. We take these issues seriously.

---

## 📚 Additional Resources

- **[Onboarding Guide](docs/onboarding.md)** - Detailed guide for new contributors
- **[README.md](README.md)** - Project overview and setup
- **[Stellar Documentation](https://developers.stellar.org/)** - Stellar blockchain docs
- **[Soroban Documentation](https://soroban.stellar.org/)** - Soroban smart contracts
- **[Next.js Documentation](https://nextjs.org/docs)** - Frontend framework
- **[TypeScript Documentation](https://www.typescriptlang.org/docs/)** - TypeScript language

---

## 🎯 Contribution Areas

We welcome contributions in many areas:

### Code
- Smart contract development (Rust)
- Backend API development (Node.js/TypeScript)
- Frontend development (React/Next.js)
- Testing and test coverage
- Performance optimizations

### Documentation
- Code documentation and comments
- User guides and tutorials
- API documentation
- Architecture diagrams
- Translation to other languages

### Design
- UI/UX improvements
- Accessibility enhancements
- Mobile responsiveness
- Design system and components

### Community
- Answering questions in issues
- Reviewing pull requests
- Helping new contributors
- Writing blog posts or tutorials
- Spreading the word about the project

---

## 🏆 Recognition

All contributors are recognized in:
- GitHub's contributor list
- Project commit history
- Release notes (for significant contributions)

We appreciate every contribution, no matter how small!

---

## ❓ Questions?

- **General questions**: Open a GitHub Discussion
- **Issue-specific questions**: Comment on the issue
- **PR questions**: Comment on the pull request
- **Private concerns**: Contact maintainers directly

---

## 📄 License

By contributing to Soroban Loyalty, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to Soroban Loyalty!** 🚀

We're excited to have you as part of our community. Whether you're fixing a typo or adding a major feature, your contribution matters.

Happy coding! 💻
