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

Gitagotchi is a small, zero-maintenance companion that lives directly inside your GitHub repository.

Every few hours, a GitHub Action checks your public activity, updates your pet's state in `data/pet.json`, and renders fresh SVGs straight into your repo for your profile README.

- **Reflects how you actually work**: At level 5, your pet branches into an archetype based on your actual Git habits—shipping PRs, squashing bugs late at night, or building out commits.
- **Real Git telemetry over productivity scores**: No fake hunger mechanics, productivity guilt, or arbitrary scores. It displays real numbers: commits, PRs, issues, streaks, and an authentic 7-day commit track.
- **7-day commit branch**: An SVG commit track with weekday markers (`S M T W T F S`) reflecting your actual commits over the past week.
- **Never dies**: If you take time off, your pet rests peacefully. It never starves or guilt-trips you when you return.
- **Zero server footprint**: 100% TypeScript + GitHub Actions. No servers, no database, no accounts, no auth.

---

## ⚡ 60-Second Setup

### 1. Enable GitHub Actions Write Permissions

In your repository:

> **Settings** → **Actions** → **General** → Scroll to **Workflow permissions** → Select **Read and write permissions** → **Save**.

### 2. Hatch Your Pet

> Go to the **Actions** tab → Click **Gitagotchi** → **Run workflow**.

### 3. Embed in Your Profile README

Choose the embed style that matches your profile:

#### Option A: Mini Companion Sticker _(Compact & clean for profiles)_

```markdown
<p align="center">
  <a href="https://github.com/sarawagh27/gitagotchi">
    <img src="https://raw.githubusercontent.com/sarawagh27/gitagotchi/main/assets/pet-mini.svg" alt="Gitagotchi" width="130">
  </a>
</p>
```

#### Option B: Pure Pet Sprite _(100% transparent pixel sprite)_

```markdown
<p align="center">
  <a href="https://github.com/sarawagh27/gitagotchi">
    <img src="https://raw.githubusercontent.com/sarawagh27/gitagotchi/main/assets/pet-sprite.svg" alt="Gitagotchi" width="105">
  </a>
</p>
```

#### Option C: Full Activity Card _(Pet sprite, 7-day commit track, and Git telemetry)_

```markdown
<p align="center">
  <a href="https://github.com/sarawagh27/gitagotchi">
    <img src="https://raw.githubusercontent.com/sarawagh27/gitagotchi/main/assets/pet.svg" alt="Gitagotchi Card" width="540">
  </a>
</p>
```

_(Optional variables under **Settings → Secrets and variables → Actions → Variables**: `PET_NAME` (default: `Nova`), `PET_TIMEZONE` (default: `UTC` or `Asia/Kolkata`))._

---

## 🌿 Evolutionary Branches

Your pet branches deterministically based on your actual Git activity when reaching Level 5:

<p align="center">
  <img src="docs/evolution.svg" alt="Evolution Branches" width="880">
</p>

| Branch                   | Stage (Lv 1–4)     | Specialization (Lv 5–19) | Ascended Form (Lv 20+) | Deterministic Trigger                                       |
| :----------------------- | :----------------- | :----------------------- | :--------------------- | :---------------------------------------------------------- |
| **`feature/builder`**    | 🥚 Egg → 🌱 Sprout | 🔨 **Code Builder**      | 🏛️ **Grand Architect** | Default branch: Steady commits & continuous building        |
| **`feature/shipwright`** | 🥚 Egg → 🌱 Sprout | ⚓ **Shipwright**        | 👑 **Fleet Admiral**   | PR-driven: ≥ 25% PR activity (opens & merges)               |
| **`feature/hunter`**     | 🥚 Egg → 🌱 Sprout | 🦉 **Night Owl**         | 🌌 **Void Walker**     | Bug & night-driven: ≥ 25% closed issues or midnight commits |

$$\text{Level } n \text{ requires } 25 \times (n - 1) \times n \text{ total XP}$$

---

## 📊 Real Git Telemetry

Rather than scoring your productivity or treating commits like food pellets, Gitagotchi surfaces real GitHub activity directly on the card:

- 🔨 **Commits**: Total all-time commits and your past 7 days volume.
- 🔀 **Pull Requests**: Total PRs opened and total PRs merged.
- 🐛 **Issues**: Total issues opened and closed.
- 🔥 **Streak**: Current consecutive active days and your all-time best streak.

The pet's mood and speech bubble naturally reflect these events without nagging or productivity guilt.

### XP Engine (Anti-Abuse Daily Caps)

| Action                  |        XP        | Daily Cap                                       |
| :---------------------- | :--------------: | :---------------------------------------------- |
| **Commit**              |      `+10`       | 10 commits / day _(100 XP max)_                 |
| **Pull Request Opened** |      `+25`       | 4 PRs / day _(100 XP max)_                      |
| **Pull Request Merged** |      `+50`       | 4 merges / day _(200 XP max)_                   |
| **Issue Opened**        |       `+5`       | 5 issues / day _(25 XP max)_                    |
| **Issue Closed**        |      `+20`       | 3 issues / day _(60 XP max)_                    |
| **Repo Created**        |      `+75`       | 2 repos / day _(150 XP max)_                    |
| **Daily Streak**        |      `+10`       | Daily streak bonus (2+ consecutive active days) |
| **Streak Milestones**   | `+50` to `+1000` | Milestone bursts at 7, 30, 100, and 365 days    |

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
