# 游戏助手

> 面向《星露谷物语》的本地存档解析与每日计划助手。

游戏助手是一个基于 Tauri + React + TypeScript 的桌面应用。当前版本聚焦《星露谷物语》，通过读取本地存档生成当天的重要提醒、推荐行动、角色技能、友谊维系、探索进度和拥有物品视图，帮助玩家更快判断今天该做什么。

[English README](./README_EN.md)

## 功能特性

- 自动扫描《星露谷物语》本地存档，也支持手动选择存档文件夹导入。
- 基于睡觉后的存档日期、天气、库存、技能、装备、路线进度和地图解锁状态生成每日计划。
- 重要提醒覆盖生日、节日、天气、季末种植风险、动物饲料不足等事项。
- 推荐行动覆盖收获、加工、动物产物收取、钓鱼、种植、社区中心交付、Joja 项目、矿洞推进、装备升级和农场维护。
- 友谊维系会按 NPC 好感度排序，并根据背包、储物箱和冰箱中的物品推荐可送礼物。
- 拥有物品会按分类展示物品，并标记来源位置。
- 支持中文和英文界面。
- 数据与备注保存在本地，不上传存档。

## 当前支持范围

- 游戏：Stardew Valley / 星露谷物语
- 平台：macOS；Windows 可通过 Windows 构建环境生成安装包
- 存档类型：单人存档优先，多人存档只按主玩家基础字段解析
- 规则数据：基于原版游戏规则和内置静态数据，不保证覆盖所有 Mod 内容

## 技术栈

- Tauri 2
- React 19
- TypeScript 6
- Vite 8
- Zustand
- fast-xml-parser
- Node.js `node:test`
- Rust 2021

## 开发环境

```bash
npm install
npm run dev
```

启动 Tauri 开发模式：

```bash
npm run tauri:dev
```

运行测试：

```bash
npm test
```

构建前端：

```bash
npm run build
```

构建桌面应用：

```bash
npm run tauri:build
```

## Release 构建

macOS DMG：

```bash
npm run tauri:build -- --bundles dmg
```

Windows 安装包需要在 Windows 构建环境中执行：

```bash
npm run tauri:build -- --bundles nsis
```

也可以在 GitHub Actions 中手动运行 `.github/workflows/release.yml`，它会分别生成 macOS DMG 和 Windows NSIS `.exe` 安装器。

生成产物通常位于：

- macOS: `src-tauri/target/release/bundle/dmg/`
- Windows: `src-tauri/target/release/bundle/nsis/`

## 隐私说明

应用只读取用户主动选择或默认扫描到的本地《星露谷物语》存档。存档解析、备注和配置均在本机处理，不包含上传服务。

## 数据免责声明

推荐结果来自存档字段解析和内置规则数据。由于游戏版本、Mod、多人存档、玩家进入游戏后的操作都会影响真实状态，建议把推荐视为辅助判断，而不是绝对攻略。

## 许可证

本项目基于 [Apache License 2.0](./LICENSE) 开源。
