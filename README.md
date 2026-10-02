<p align="center">
  <h1 align="center">👾 Gitagotchi</h1>
  <p align="center">
    <strong>Your GitHub activity keeps your virtual pet alive and evolving in your README.</strong>
  </p>
  <p align="center">
    <a href="https://github.com/sarawagh27/gitagotchi/releases"><img src="https://img.shields.io/github/v/release/sarawagh27/gitagotchi?color=7c3aed&label=Release&logo=github" alt="Latest Release"></a>
    <a href="https://github.com/sarawagh27/gitagotchi/actions/workflows/gitagotchi.yml"><img src="https://github.com/sarawagh27/gitagotchi/actions/workflows/gitagotchi.yml/badge.svg" alt="Gitagotchi Status"></a>
    <a href="https://github.com/sarawagh27/gitagotchi/actions/workflows/ci.yml"><img src="https://github.com/sarawagh27/gitagotchi/actions/workflows/ci.yml/badge.svg" alt="CI Status"></a>
    <a href="https://vitest.dev"><img src="https://img.shields.io/badge/Tests-59%20Passed-10b981?logo=vitest&logoColor=white" alt="Vitest Tests"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  </p>
</p>

<p align="center">
  <a href="https://github.com/sarawagh27/gitagotchi">
    <img src="assets/pet.svg" alt="Live Gitagotchi Card" width="560">
  </a>
  <br>
  <sub>⚡ <em>Live preview: Nova (hatched for <a href="https://github.com/sarawagh27">@sarawagh27</a>). Updates automatically every 3 hours.</em></sub>
</p>

---

### ⚡ What is Gitagotchi?

Gitagotchi is a zero-maintenance virtual pet that lives directly inside your GitHub repository.

- **Commits, PRs, and Issues** feed and energize your pet.
- **Go inactive** and it gets hungry and tired—code again to nurse it back to full health.
- **Never dies**: Neglect makes it sleepy and hungry, but it will always wait for your next commit.
- **Zero infrastructure**: 100% pure TypeScript + GitHub Actions. No servers, no databases, no external APIs.

---

## ⚡ 60-Second Setup

### 1. Enable GitHub Actions Write Permissions

In your repository:

> **Settings** → **Actions** → **General** → Scroll to **Workflow permissions** → Select **Read and write permissions** → **Save**.

### 2. Hatch Your Pet

> Go to the **Actions** tab → Click **Gitagotchi** → **Run workflow**.

### 3. Embed in Your Profile README

Choose the embed style that matches your profile:

#### Option A: Mini Companion Sticker _(Recommended for Profiles — Compact & Clean)_

```markdown
<p align="center">
  <a href="https://github.com/sarawagh27/gitagotchi">
    <img src="https://raw.githubusercontent.com/sarawagh27/gitagotchi/main/assets/pet-mini.svg" alt="Gitagotchi" width="130">
  </a>
</p>
```

#### Option B: Pure Pet Sprite _(100% Transparent — Zero UI Chrome)_

```markdown
<p align="center">
  <a href="https://github.com/sarawagh27/gitagotchi">
    <img src="https://raw.githubusercontent.com/sarawagh27/gitagotchi/main/assets/pet-sprite.svg" alt="Gitagotchi" width="105">
  </a>
</p>
```

#### Option C: Full RPG Telemetry Dashboard _(Detailed Stats & Meters)_

```markdown
<p align="center">
  <a href="https://github.com/sarawagh27/gitagotchi">
    <img src="https://raw.githubusercontent.com/sarawagh27/gitagotchi/main/assets/pet.svg" alt="Gitagotchi Dashboard" width="540">
  </a>
</p>
```

_(Optional variables under **Settings → Secrets and variables → Actions → Variables**: `PET_NAME` (default: `Nova`), `PET_TIMEZONE` (default: `UTC` or `Asia/Kolkata`))._

---

## 🧬 Evolution Stages

Your pet gains XP from daily coding activity and evolves through 6 distinct pixel-art forms:

<p align="center">
  <img src="docs/evolution.svg" alt="Evolution Stages" width="740">
</p>

| Stage | Level  | XP Required | Form              |
| :---: | :----: | :---------: | :---------------- |
|  🥚   | **1**  |   `0 XP`    | **Egg**           |
|  🐣   | **2**  |   `50 XP`   | **Hatchling**     |
|  💻   | **5**  |  `500 XP`   | **Developer**     |
|  👾   | **10** | `2,250 XP`  | **Code Beast**    |
|  🐉   | **20** | `9,500 XP`  | **Git Monster**   |
|  👑   | **50** | `61,250 XP` | **GitHub Legend** |

$$\text{Level } n \text{ requires } 25 \times (n - 1) \times n \text{ total XP}$$

---

## 📊 Stats & XP Engine

### XP Values (Anti-Abuse Daily Caps)

| Action                  |        XP        | Daily Cap                                        |
| :---------------------- | :--------------: | :----------------------------------------------- |
| **Commit**              |      `+10`       | 10 commits / day _(100 XP max)_                  |
| **Pull Request Opened** |      `+25`       | 4 PRs / day _(100 XP max)_                       |
| **Pull Request Merged** |      `+50`       | 4 merges / day _(200 XP max)_                    |
| **Issue Opened**        |       `+5`       | 5 issues / day _(25 XP max)_                     |
| **Issue Closed**        |      `+20`       | 3 issues / day _(60 XP max)_                     |
| **Repo Created**        |      `+75`       | 2 repos / day _(150 XP max)_                     |
| **Daily Streak**        |      `+10`       | Daily streak bonus (2+ consecutive active days)  |
| **Streak Milestones**   | `+50` to `+1000` | Big milestone bursts at 7, 30, 100, and 365 days |

### Vitals (0 – 100)

- 🍖 **Food**: Rises when you push code; slowly drops on inactive days.
- ⚡ **Energy**: Recharges with consistent coding activity.
- 💖 **Joy**: Multiplies with streaks and milestone achievements.
- 🩺 **Health**: Dynamic composite: `0.4 × Food + 0.3 × Energy + 0.3 × Joy`.

---

## 🏆 Unlockable Achievements

| Achievement      | Requirement          | Badge | Achievement         | Requirement                  | Badge |
| :--------------- | :------------------- | :---: | :------------------ | :--------------------------- | :---: |
| **First Commit** | 1 commit             |  🌱   | **Centurion**       | 100 total commits            |  💯   |
| **First PR**     | Open 1 PR            |  🔀   | **Repo Collector**  | Create 10 repositories       |  📦   |
| **First Merge**  | Merge 1 PR           |  🚀   | **Night Owl**       | 5 commits between 12am – 5am |  🦉   |
| **Warming Up**   | 3-day active streak  |  🔥   | **Weekend Warrior** | Active on Saturday & Sunday  |  🏖️   |
| **Week Warrior** | 7-day active streak  |  ⚡   | **PR Machine**      | Open 25 pull requests        |  ⚙️   |
| **Unstoppable**  | 30-day active streak |  🛡️   | **Bug Hunter**      | Close 10 issues              |  🐛   |

---

## 🏗️ Architecture

```text
GitHub Activity API ──▶ Event Normalizer ──▶ Pure Simulation Engine ──▶ data/pet.json
                                                        │
                                                        └──▶ SVG Renderer ──▶ assets/pet.svg
```

- **Pure & Deterministic**: `simulation.ts` is network-free and completely deterministic. State + Events = Next State.
- **Smart Commits**: The workflow compares cached diffs and only creates a Git commit if stats or sprites changed.

---

## 💻 Local Testing & Offline Demo

```bash
# Clone and install
git clone https://github.com/sarawagh27/gitagotchi.git
cd gitagotchi
npm install

# Generate offline demo card (writes to out/demo.svg)
npm run dev

# Run unit tests
npm test

# Full verification (types + lint + format + tests)
npm run check
```

---

## 📦 Releases

Check the [Releases](https://github.com/sarawagh27/gitagotchi/releases) page for changelogs and release notes.

- **[v0.1.0](https://github.com/sarawagh27/gitagotchi/releases/tag/v0.1.0)** — Initial Release: Hatch Nova, 6 evolution stages, 12 achievements, and automated GitHub Actions updater.

---

## 📄 License

[MIT](LICENSE) © [Sara Wagh](https://github.com/sarawagh27)
