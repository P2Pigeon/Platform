# Contributing to P2Pigeon

Thank you for your interest in contributing to P2Pigeon! We welcome contributions from the community to help build a more secure and private communication platform.

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Git

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/P2Pigeon/Platform.git
   cd Platform
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the development servers**
   ```bash
   # Backend (port 3060)
   cd app && pnpm dev

   # Frontend (port 3000)
   cd frontend && pnpm dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
├── app/                 # Backend server (Express, Socket.IO)
│   ├── src/
│   │   ├── api/        # REST API routes
│   │   ├── dataroom/   # Hyperdrive data room management
│   │   └── hypernat/   # NAT traversal utilities
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API and protocol services
│   │   └── hooks/      # Custom React hooks
└── shared/             # Shared types and utilities
```

## How to Contribute

### Reporting Bugs

- Check existing issues to avoid duplicates
- Use the bug report template
- Include steps to reproduce, expected behavior, and actual behavior
- Include browser/OS version and any relevant logs

### Suggesting Features

- Open an issue with the feature request template
- Describe the use case and why it would benefit users
- Be open to discussion and feedback

### Submitting Pull Requests

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Write meaningful commit messages
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   pnpm test
   pnpm lint
   ```

4. **Push and create a PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a Pull Request on GitHub.

### Code Style

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Use meaningful variable and function names
- Keep functions focused and small
- Add JSDoc comments for public APIs

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add end-to-end encryption for file transfers
fix: resolve duplicate message issue in Nostr chat
docs: update README with installation instructions
refactor: simplify WebRTC connection handling
```

## Areas for Contribution

We especially welcome contributions in these areas:

- **Security audits** - Review encryption implementations
- **Performance** - Optimize P2P connections and data transfer
- **Accessibility** - Improve screen reader support and keyboard navigation
- **Documentation** - Improve guides, tutorials, and API docs
- **Testing** - Add unit tests and integration tests
- **Localization** - Translate the UI to other languages

## Security

If you discover a security vulnerability, please do NOT open a public issue. Instead, email security concerns privately to the maintainers.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- No harassment or discrimination

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 license.

## Questions?

Feel free to open a discussion or reach out to the maintainers if you have any questions about contributing.

Thank you for helping make P2Pigeon better! 🐦
