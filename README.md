<p align="center">
  <h1 align="center">👾 Gitagotchi</h1>
  <p align="center">
    <strong>A GitHub-native virtual pet that evolves with your real code activity.</strong>
  </p>
  <p align="center">
    <a href="https://github.com/sarawagh27/gitagotchi/actions/workflows/gitagotchi.yml"><img src="https://github.com/sarawagh27/gitagotchi/actions/workflows/gitagotchi.yml/badge.svg" alt="Gitagotchi Workflow Status"></a>
    <a href="https://github.com/sarawagh27/gitagotchi/actions/workflows/ci.yml"><img src="https://github.com/sarawagh27/gitagotchi/actions/workflows/ci.yml/badge.svg" alt="CI Status"></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
    <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-%3E%3D20-22c55e?logo=node.js&logoColor=white" alt="Node.js"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
    <a href="https://vitest.dev"><img src="https://img.shields.io/badge/Tests-57%20Passed-success?logo=vitest&logoColor=white" alt="Vitest"></a>
    <a href="#"><img src="https://img.shields.io/badge/Dependencies-0%20runtime-8b5cf6" alt="Zero Runtime Dependencies"></a>
  </p>
</p>

<p align="center">
  <a href="https://github.com/sarawagh27/gitagotchi">
    <img src="assets/pet.svg" alt="Your Gitagotchi Pet" width="560">
  </a>
  <br>
  <em>Live Card: Nova, hatched for <a href="https://github.com/sarawagh27">@sarawagh27</a>. Updates automatically every 3 hours via GitHub Actions.</em>
</p>

---

## 🌟 Overview

**Gitagotchi** is a tiny, interactive virtual pet that lives entirely inside your GitHub repository.

- 🌿 **Commits, Pull Requests, and Issues** feed and energize your pet.
- ⏳ **Idle days** make it hungry and sluggish, but it **never dies**—just code to nurse it back to full health!
- 🎨 **A scheduled GitHub Action** reads your recent public activity, executes a pure deterministic simulation engine, and renders an animated SVG card ready to embed anywhere.
- ⚡ **Zero Servers. Zero Databases. Zero AI APIs. Zero Cost.** Just pure TypeScript, stateful JSON, and GitHub Actions.

---

## ✨ Features

- 🥚 **6 Evolution Stages**: Evolves dynamically from an **Egg** to a legendary **GitHub Legend** based on total XP.
- 📊 **Dynamic Pet Moods & Stats**: Real-time tracking of **Health**, **Energy**, **Food (Hunger)**, and **Joy (Happiness)**.
- 🎯 **XP, Daily Streaks & Milestones**: Anti-abuse daily caps ensure legitimate coding habits are rewarded.
- 🏆 **12 Unlockable Achievements**: From _First Commit_ to _Night Owl_ and _PR Machine_.
- 💬 **Adaptive Personality Messages**: Context-aware quips based on streak status, hunger levels, or recent PR activity.
- 🌙 **Dark-Mode Native Animated SVG**: Smooth pixel-art animations with `@media (prefers-reduced-motion)` support. No external fonts or images required.
- 🧪 **100% Deterministic & Unit Tested**: Comprehensive test coverage across all game logic and edge cases.

<p align="center">
  <img src="docs/evolution.svg" alt="Gitagotchi Evolution Stages" width="760">
</p>

---

## 🧭 Table of Contents

- [Quick Start (Offline Demo)](#-quick-start-offline-demo)
- [GitHub Actions Setup (1-Minute Guide)](#-github-actions-setup-1-minute-guide)
- [How It Works](#-how-it-works)
- [Pet Mechanics](#-pet-mechanics)
  - [XP System & Daily Caps](#xp-system--daily-caps)
  - [Evolution Stages](#evolution-stages)
  - [Pet Vital Stats](#pet-vital-stats-0100)
  - [Achievements](#achievements)
- [Configuration](#-configuration)
- [Local Development](#-local-development)
- [Project Architecture](#-project-architecture)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Quick Start (Offline Demo)

Try Gitagotchi on your local machine in under a minute without modifying any repository files:

```bash
# Clone the repository
git clone https://github.com/sarawagh27/gitagotchi.git
cd gitagotchi

# Install dependencies
npm install

# Run the offline demo (generates out/demo.svg)
npm run dev
```

Open `out/demo.svg` in any browser to inspect the rendered SVG card! _(Requires Node 20+)_.

---

## ⚙️ GitHub Actions Setup (1-Minute Guide)

Setting up Gitagotchi on your own repository takes less than 60 seconds:

### 1. Enable GitHub Actions Permissions

1. In your repository on GitHub, navigate to **Settings** → **Actions** → **General**.
2. Under **Workflow permissions**, select **Read and write permissions**.
3. Click **Save**.

> [!IMPORTANT]
> Write permission is strictly used by the workflow to commit the updated `data/pet.json` and `assets/pet.svg` back to your repo.

### 2. (Optional) Custom Variables

Under **Settings** → **Secrets and variables** → **Actions** → **Variables**, you can optionally add:

- `PET_NAME`: Your pet's name _(default: `Nova`)_.
- `PET_TIMEZONE`: Your IANA timezone identifier, e.g. `Asia/Kolkata` or `America/New_York` _(default: `UTC`)_.

### 3. Run the Initial Hatch

1. Navigate to the **Actions** tab on GitHub.
2. Select **Gitagotchi** in the left sidebar.
3. Click **Run workflow** → **Run workflow**.
4. Within 15 seconds, your pet will hatch and commit `data/pet.json` and `assets/pet.svg`.

### 4. Embed on Your GitHub Profile or README

Add the following snippet to your profile README (`<username>/<username>`) or any project README:

```markdown
<p align="center">
  <a href="https://github.com/sarawagh27/gitagotchi">
    <img src="https://raw.githubusercontent.com/sarawagh27/gitagotchi/main/assets/pet.svg" alt="My Gitagotchi Pet" width="540">
  </a>
</p>
```

---

## 🧠 How It Works

```text
┌─────────────────────────┐
│ GitHub Events REST API  │ ── (fetches public commits, PRs, issues)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│  Activity Normalizer    │ ── (converts raw payloads into typed events)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Pure Simulation Engine  │ ── simulate(previousState, events, clock)
└───────────┬─────────────┘
            │
            ├───────────────▶ data/pet.json (persisted state & event deduplication)
            ▼
┌─────────────────────────┐
│ Pure SVG Card Renderer  │ ── (embedded vector sprites & animations)
└───────────┬─────────────┘
            ▼
       assets/pet.svg (ready for your README)
```

1. **GitHub Events API**: Retrieves recent public events (up to 300 events / 90 days) via GitHub REST API.
2. **Deterministic Engine**: `src/engine/simulation.ts` is an idempotent, pure mathematical function: `(state, events, clock) => nextState`. No hidden state, no nondeterministic network calls.
3. **Smart Commits**: The GitHub Action checks `git diff --cached --quiet` and only pushes a commit when your pet's state or appearance has genuinely changed.

---

## 🎮 Pet Mechanics

### XP System & Daily Caps

Daily caps are built-in to prevent artificial farming and encourage consistent, healthy development habits.

| Activity                 |     XP Awarded      | Daily Limit / Cap                       |
| :----------------------- | :-----------------: | :-------------------------------------- |
| **Commit**               |      `+10 XP`       | Max 10 per day _(100 XP max)_           |
| **Pull Request Opened**  |      `+25 XP`       | Max 4 per day _(100 XP max)_            |
| **Pull Request Merged**  |      `+50 XP`       | Max 4 per day _(200 XP max)_            |
| **Issue Opened**         |       `+5 XP`       | Max 5 per day _(25 XP max)_             |
| **Issue Closed**         |      `+20 XP`       | Max 3 per day _(60 XP max)_             |
| **Repository Created**   |      `+75 XP`       | Max 2 per day _(150 XP max)_            |
| **Daily Streak**         |      `+10 XP`       | Awarded once per consecutive active day |
| **Streak Milestones**    | `+50` to `+1000 XP` | Milestones at 7, 30, 100, and 365 days  |
| **Achievement Unlocked** |      `+25 XP`       | Awarded once per unlocked achievement   |

### Evolution Stages

Reaching level $n$ requires $25 \times (n - 1) \times n$ total XP.

| Stage | Level Required |   Min XP    | Title             |
| :---: | :------------: | :---------: | :---------------- |
|  🥚   |  **Level 1**   |   `0 XP`    | **Egg**           |
|  🐣   |  **Level 2**   |   `50 XP`   | **Hatchling**     |
|  💻   |  **Level 5**   |  `500 XP`   | **Developer**     |
|  👾   |  **Level 10**  | `2,250 XP`  | **Code Beast**    |
|  🐉   |  **Level 20**  | `9,500 XP`  | **Git Monster**   |
|  👑   |  **Level 50**  | `61,250 XP` | **GitHub Legend** |

### Pet Vital Stats (0–100)

- 🍖 **Food (Fullness)**: Replenished when active; depletes daily when idle.
- ⚡ **Energy**: Recharged by consistent development sessions.
- 💖 **Joy (Happiness)**: Multiplies with streaks and milestone achievements.
- 🩺 **Health**: Derived formula:
  $$\text{Health} = 0.4 \times \text{Food} + 0.3 \times \text{Energy} + 0.3 \times \text{Joy}$$

> [!NOTE]
> Your pet never dies! If life gets busy and you step away from coding, your pet will merely nap or look hungry until your next commit.

---

## 🏆 Achievements

| Achievement         | Requirement                                 | Badge |
| :------------------ | :------------------------------------------ | :---: |
| **First Commit**    | Commit your first code change               |  🌱   |
| **First PR**        | Open your first Pull Request                |  🔀   |
| **First Merge**     | Merge a Pull Request                        |  🚀   |
| **Warming Up**      | Maintain a 3-day active streak              |  🔥   |
| **Week Warrior**    | Maintain a 7-day active streak              |  ⚡   |
| **Unstoppable**     | Maintain a 30-day active streak             |  🛡️   |
| **Centurion**       | Reach 100 total commits                     |  💯   |
| **Repo Collector**  | Create 10 repositories                      |  📦   |
| **Night Owl**       | Push 5 commits between 12:00 AM and 5:00 AM |  🦉   |
| **Weekend Warrior** | Active on both Saturday and Sunday          |  🏖️   |
| **PR Machine**      | Open 25 Pull Requests                       |  ⚙️   |
| **Bug Hunter**      | Close 10 issues                             |  🐛   |

---

## 🔧 Configuration

All configurations are managed via environment variables (automatically handled in GitHub Actions):

| Variable                | Default                        | Description                                                    |
| :---------------------- | :----------------------------- | :------------------------------------------------------------- |
| `GITHUB_USERNAME`       | Repository Owner               | GitHub user whose public activity feeds the pet                |
| `GITHUB_TOKEN`          | Built-in `${{ github.token }}` | Bearer token used to authenticate GitHub API calls             |
| `GITAGOTCHI_TOKEN`      | None                           | Optional personal access token (PAT) for private repo activity |
| `PET_NAME`              | `Nova`                         | Name displayed on your SVG pet card (1-16 characters)          |
| `PET_TIMEZONE`          | `UTC`                          | IANA Timezone used for daily rollups and streak boundaries     |
| `GITAGOTCHI_BACKFILL`   | `true`                         | Backfills initial 90 days of history when hatching             |
| `GITAGOTCHI_STATE_PATH` | `data/pet.json`                | Relative path where state is stored                            |
| `GITAGOTCHI_SVG_PATH`   | `assets/pet.svg`               | Relative path where card SVG is rendered                       |

---

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/sarawagh27/gitagotchi.git
cd gitagotchi

# Install development dependencies
npm install

# Run the test suite (Vitest)
npm test

# Run full project verification (typecheck + lint + format + tests)
npm run check

# Regenerate gallery showcase in docs/
npm run gallery

# Build production TypeScript distribution
npm run build
```

---

## 📁 Project Architecture

```text
gitagotchi/
├── .github/
│   ├── workflows/
│   │   ├── gitagotchi.yml    # Scheduled 3-hour cron pet updater
│   │   └── ci.yml            # Automated CI verification suite
│   ├── ISSUE_TEMPLATE/       # Structured bug & feature templates
│   └── pull_request_template.md
├── assets/
│   └── pet.svg               # Live generated pet badge (embedded in README)
├── data/
│   └── pet.json              # Pet state, stats, XP, and seen event IDs
├── docs/
│   ├── demo.svg              # Offline demo badge
│   ├── evolution.svg         # Evolution banner strip
│   └── stages/               # Rendered sprites for each evolution stage
├── src/
│   ├── achievements/         # Achievement definitions & criteria
│   ├── engine/               # Pure simulation state transitions
│   ├── github/               # GitHub REST API client & event normalization
│   ├── pet/                  # Evolution, levels, stats, streaks, personality
│   ├── svg/                  # Vector pixel renderer & sprite templates
│   ├── config.ts             # Environment configuration validation
│   ├── storage.ts            # Atomic file system I/O
│   └── index.ts              # CLI & action runner entrypoint
└── test/                     # Vitest test suites (100% deterministic)
```

---

## 🗺️ Roadmap

- [ ] **Species Selection**: Choose between blob, dragon, cat, and robot companions.
- [ ] **Branching Evolutions**: Distinct career paths (e.g. _Frontend Magician_, _DevOps Titan_, _Systems Architect_).
- [ ] **Custom Accessories**: Unlockable hats, glasses, and badges tied to achievements.
- [ ] **GitHub Pages Companion Web App**: Interactive pet playground with animations and sound effects.

---

## 🤝 Contributing

Contributions, issues, and feature ideas are warmly welcome!

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feat/epic-accessory`).
3. Commit your Changes (`git commit -m 'feat: add wizard hat accessory'`).
4. Ensure all checks pass: `npm run check`.
5. Push to the Branch (`git push origin feat/epic-accessory`).
6. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

<p align="center">
  <sub>Built with 💖 for developers who love virtual pets. Keep your streaks alive!</sub>
</p>
