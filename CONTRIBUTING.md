# Contributing to Gitagotchi

First off, thank you for considering contributing to Gitagotchi! ✨ Projects like this thrive because of people like you.

---

## 📜 Guiding Principles

Gitagotchi is intentionally designed with specific architectural constraints:

1. **Zero Runtime Dependencies**: Keep the engine lightweight and secure.
2. **Pure & Deterministic**: The simulation engine (`src/engine/simulation.ts`) must remain pure—given state, events, and a clock timestamp, output must be 100% deterministic with no side-effects or network calls.
3. **No External Assets**: All pixel sprites and cards are generated mathematically as pure vector SVGs.

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **Git**

### Installation

```bash
# Fork & clone your repository
git clone https://github.com/<your-username>/gitagotchi.git
cd gitagotchi

# Install development dependencies
npm install

# Test the offline demo
npm run dev
```

---

## 🧪 Testing and Verification

Before submitting a Pull Request, ensure that the full verification suite passes locally:

```bash
# Run Vitest unit tests
npm test

# Run full project checks (types + lint + format + tests)
npm run check
```

If you modify formatting, run Prettier:

```bash
npm run format
```

---

## 🔀 Submitting a Pull Request

1. **Fork the repository** on GitHub.
2. **Create a topic branch** from `main`:
   ```bash
   git checkout -b feat/new-achievement
   ```
3. **Make your changes**:
   - Write clean, type-safe TypeScript code.
   - Add unit tests under `test/` for any new engine logic or stat modifications.
4. **Ensure `npm run check` passes** with 0 errors.
5. **Commit your changes** using conventional commit messages:
   - `feat: add night-owl streak bonus`
   - `fix: correct hunger calculation on month boundaries`
   - `docs: update setup instructions in README`
6. **Push to your fork**:
   ```bash
   git push origin feat/new-achievement
   ```
7. **Open a Pull Request** against `sarawagh27/gitagotchi:main` using our PR template.

---

## 💡 Ideas for Contributions

- New unlockable achievements and badges
- Additional accessories or pixel-art moods
- New personality dialogues in `src/pet/personality.ts`
- Documentation and localization improvements

Thank you for helping keep our virtual pets alive and happy! 🐾
