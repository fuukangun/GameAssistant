# Game Assistant

> A local save parser and daily planning assistant for Stardew Valley.

Game Assistant is a desktop app built with Tauri, React, and TypeScript. The current version focuses on Stardew Valley. It reads local save files and generates daily reminders, recommended actions, skill summaries, friendship maintenance, exploration progress, and owned-item views to help players decide what to do next.

[中文 README](./README.md)

## Features

- Automatically scans local Stardew Valley saves and supports manually importing a save folder.
- Generates a daily plan from the after-sleep save date, weather, inventory, skills, equipment, route progress, and map unlock state.
- Important reminders cover birthdays, festivals, weather, end-of-season planting risk, and low animal feed.
- Recommended actions cover harvesting, processing, animal product collection, fishing, planting, Community Center delivery, Joja projects, mine progress, equipment upgrades, and farm maintenance.
- Friendship maintenance sorts NPCs by friendship and recommends giftable owned items from the backpack, chests, and fridge.
- Owned items are grouped by category and show where each item is stored.
- Supports Chinese and English UI.
- Save parsing and local notes stay on the user's machine.

## Supported Scope

- Game: Stardew Valley
- Platform: macOS; Windows installers should be built on a Windows build environment
- Save type: single-player saves first; multiplayer saves are parsed only from host/basic player fields
- Rule data: based on vanilla game rules and built-in static data; Mod content is not guaranteed

## Tech Stack

- Tauri 2
- React 19
- TypeScript 6
- Vite 8
- Zustand
- fast-xml-parser
- Node.js `node:test`
- Rust 2021

## Development

```bash
npm install
npm run dev
```

Run Tauri in development mode:

```bash
npm run tauri:dev
```

Run tests:

```bash
npm test
```

Build the frontend:

```bash
npm run build
```

Build the desktop app:

```bash
npm run tauri:build
```

## Release Builds

macOS DMG:

```bash
npm run tauri:build -- --bundles dmg
```

Windows installer, from a Windows build environment:

```bash
npm run tauri:build -- --bundles nsis
```

You can also run `.github/workflows/release.yml` manually in GitHub Actions. It builds the macOS DMG and Windows NSIS `.exe` installer as separate artifacts.

Generated artifacts are usually written to:

- macOS: `src-tauri/target/release/bundle/dmg/`
- Windows: `src-tauri/target/release/bundle/nsis/`

## Privacy

The app only reads local Stardew Valley save files that are discovered from default folders or selected by the user. Save parsing, notes, and configuration are processed locally and are not uploaded.

## Data Disclaimer

Recommendations are derived from parsed save fields and built-in rule data. Game version differences, Mods, multiplayer data, and actions taken after entering the game can change the actual state. Treat the plan as decision support, not an absolute walkthrough.

## License

This project is licensed under the [Apache License 2.0](./LICENSE).
