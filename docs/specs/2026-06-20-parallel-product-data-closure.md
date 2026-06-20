# 2026-06-20 Parallel Product/Data Closure Spec

## 背景

当前 App 已具备可试用 MVP：存档扫描、核心解析、今日计划、社区中心可交付推荐、友谊礼物、拥有物品、国际化和 Tauri 打包均已跑通。本轮优先处理四个会明显影响产品可信度和后续维护性的缺口：

1. 社区中心完整进度视图。
2. 农场地块/空地扫描。
3. 探索进度 Tab 信息架构重构。
4. 静态数据外置化基础设施。

## 非目标

- 不写回或修改游戏存档。
- 不接入实时 Mod。
- 不一次性迁移所有 TypeScript 静态表到 JSON。
- 不承诺一次完成所有星露谷特殊规则校准。
- 不在没有真实字段证据时声称“精确空地数量”。

## Task A: 社区中心完整进度视图

状态：数据层已完成，UI 待集成。

已完成：
- 新增 `src/app/communityCenterProgress.ts`。
- 新增 `createCommunityCenterProgress(snapshot)`，按房间和收集包输出进度模型。
- 模型包含 `roomName`、`bundleName`、`completed`、`requirements`。
- requirement 包含 `itemId`、`itemName`、`requiredStack`、`availableStack`、`deliverable`、`completed`。
- 已完成 bundle 的需求仍展示，但不作为可交付项高亮。

待做：
- 在 App 中新增社区中心完整视图入口，建议放在主线分支区域或探索进度重构后的路线进度 section。
- UI 支持按房间折叠/展开。
- 可交付项使用高亮和物品图标。

验收：
- 社区中心中期存档能看到每个房间/收集包完成态。
- 已完成收集包不会提示交付。
- 未完成收集包中库存可交付项有明确视觉标记。

## Task B: 农场地块/空地扫描

状态：worker 进行中。

目标：
- 从存档 XML 中保守解析农场地块相关证据。
- 至少区分：已种植作物数量、已耕地数量、农场对象/障碍物数量。
- 输出 parsed/unknown 状态，避免把未验证字段当成精确空地。

建议文件：
- `src/stardew/saves/parseSave.ts`
- `src/stardew/saves/parseSave.test.ts`
- `src/app/farmPlotStatus.ts`
- `src/app/farmPlotStatus.test.ts`

验收：
- 小型 XML fixture 中的 HoeDirt + crop 可被计数。
- 农场 object/resource clump 至少一种可被计数。
- 种植建议后续可基于该摘要降级：没有可靠空地时不输出“可种 N 格”的强说法。

## Task C: 探索进度 Tab 重构

状态：worker 进行中。

目标：
- 将“探索进度”拆成更贴近玩家心智的分组：
  - 地图解锁：沙漠、姜岛、头骨山洞、火山地牢。
  - 矿洞进度：普通矿洞最深层、头骨山洞状态、火山地牢状态。
  - 钓鱼可达性：鱼竿、鱼饵、今日可钓鱼类、水域/时间窗口置信度。
  - 商店与路线：商店开放、社区中心/Joja 进度。
- 食物、武器不作为探索进度主项；后续如需要，放入“出行准备/战斗准备”模型。

建议文件：
- `src/app/explorationStatus.ts`
- `src/app/explorationStatus.test.ts`

验收：
- 新纯函数输出 section 化结构。
- 旧 `createExplorationStatusItems` 暂时兼容，避免 UI 一次性大改。
- UI 后续只渲染 section，不再把食物/武器混在探索进度里。

## Task D: 静态数据外置化基础设施

状态：worker 进行中。

目标：
- 建立 data pack 校验和加载边界。
- 先提供 schema/metadata 校验、warning/fallback，不迁移大表。
- 数据损坏时 App 不崩溃，相关建议降级。

建议文件：
- `src/stardew/data/staticData.ts`
- `src/stardew/data/staticData.test.ts`
- 可新增 `src/stardew/data/staticDataLoader.ts`

验收：
- 有效 data pack 校验通过。
- 缺 metadata 返回 error/warning，而不是 throw。
- gameVersion 不匹配返回 warning。
- 缺 section 时允许 fallback 到 TypeScript 内置表。

## 真实存档夹具需求

已有且仍需要保留：
- 社区中心中期存档：用于验证 bundle 完成状态、可交付项、未完成项。
- 社区中心全完成存档：用于验证社区中心 100% 时不再生成交付压力。
- 大量箱子/冰箱/特殊物品存档：用于验证全局库存、物品名、图标、礼物匹配。

建议新增，优先级高：
- Joja 中期存档：至少购买 1-3 个 Joja 项目，金币不足或刚好不足更好。
- Joja 全完成存档：验证不再推荐 Joja 项目，也不展示社区中心路线建议。
- 姜岛已开放存档：验证姜岛地图解锁字段。
- 火山地牢已进入/推进存档：验证火山地牢状态字段。
- 头骨山洞已解锁且有层数/钥匙相关状态的存档：验证头骨山洞展示。

可选但有价值：
- 第一年早期未解锁社区中心/Joja 的存档：验证路线 unknown。
- 多人房主存档：验证 warning 和基础解析。
- 温室已修复存档：后续校准温室/跨季节种植逻辑。

每份真实存档最好附带人工备注：
- 存档名/角色名/农场名。
- 游戏内日期。
- 路线状态：社区中心、Joja、未确认。
- 已知关键状态：沙漠、姜岛、温室、矿洞、头骨山洞、火山地牢。
- 箱子/冰箱里刻意用于测试的关键物品。

## 集成顺序

1. 合并 Task A 数据层。
2. 等 Task B/C/D worker 结果并检查冲突。
3. 先接社区中心完整进度 UI。
4. 再接探索进度 section UI。
5. 农场地块扫描先进入探索/农业证据，不立即强改推荐排序。
6. 静态数据外置化先作为测试和边界层，后续逐表迁移。

## 验证命令

每个 task focused tests 后，集成必须运行：

```bash
npm run typecheck
npm test
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri:build
```
