import { type UIEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, ChevronDown, ChevronRight } from 'lucide-react';
import { useStore } from 'zustand';
import type { PlannerGoal, RecommendationItem, StardewSaveSnapshot, Weather } from '../shared/types.ts';
import { getBackToTopButtonA11yProps, shouldShowBackToTop } from './backToTop.ts';
import {
  groupCommunityCenterDeliverables,
  shouldShowCommunityCenterDetailButton,
} from './communityCenterActionDetails.ts';
import { createCommunityCenterProgress } from './communityCenterProgress.ts';
import type { AppLanguage } from './config/localConfig.ts';
import { createBrowserLocalConfigStorage } from './config/localConfigStorage.ts';
import {
  formatConfidence,
  formatEquipmentList,
  formatEquipmentValue,
  formatLuck,
  formatNpcName,
  formatPriority,
  formatRoute,
} from './displayFormat.ts';
import { createInitialAppData } from './appInitialData.ts';
import { formatDateTime } from './formatDateTime.ts';
import {
  createExplorationProgressSections,
} from './explorationStatus.ts';
import { type GiftOption } from './giftSuggestions.ts';
import { createFriendshipPanelRows } from './friendshipPanelModel.ts';
import { formatGoalLabel, formatPlanTitle, formatWeatherLabel, t } from './i18n.ts';
import { groupInventoryBySource } from './inventoryGroups.ts';
import { getItemIconPath } from './itemIcons.ts';
import { formatJojaProjectName } from './jojaProjectDisplay.ts';
import { createJojaProgress } from './jojaProgress.ts';
import { formatItemName, formatItemSource } from './itemDisplay.ts';
import { groupProducedItemsBySource, shouldShowProducedItemDetailButton } from './producedItemActionDetails.ts';
import {
  localizeCommunityCenterBundleName,
  localizeCommunityCenterItemName,
  localizeCommunityCenterRoomName,
  localizeRecommendationItem,
} from './recommendationDisplay.ts';
import { resolveRecommendationTabForSaveClick, resolveRecommendationTabForSaveSelection } from './recommendationTabState.ts';
import { createRecommendationTabs, type RecommendationTabId } from './recommendationTabs.ts';
import { mergeImportedSaveForScannedEntry } from './saveImportMerge.ts';
import { createSidebarGameGroups } from './sidebarGameGroups.ts';
import { importBrowserSaveFile } from './services/saveFileImportService.ts';
import { isTauriRuntime } from './services/tauriEnvironment.ts';
import { readTauriSaveFile, scanTauriSaves } from './services/tauriSaveScanner.ts';
import { createSummaryCards } from './summaryCards.ts';
import { createRouteProgressSummary } from './routeProgress.ts';
import type { SaveEntry } from '../stardew/saves/scanSaves.ts';
import { createPlannerStore } from '../stores/plannerStore.ts';
import { createSaveStore } from '../stores/saveStore.ts';
import { createSettingsStore } from '../stores/settingsStore.ts';

const initialAppData = createInitialAppData(isTauriRuntime());
const saveStore = createSaveStore();
const plannerStore = createPlannerStore(initialAppData.initialSnapshot);
const localConfigStorage = createBrowserLocalConfigStorage();
const settingsStore = createSettingsStore(localConfigStorage?.load(), localConfigStorage);

saveStore.getState().setSaves(initialAppData.saves);

export function App() {
  const [snapshotsBySaveId, setSnapshotsBySaveId] = useState<Record<string, StardewSaveSnapshot>>(() => {
    return initialAppData.snapshotsBySaveId;
  });
  const [isDesktopRuntime] = useState(() => isTauriRuntime());
  const [importMessage, setImportMessage] = useState('可手动选择 Stardew Valley 存档 XML 文件。');
  const [activeRecommendationTab, setActiveRecommendationTab] = useState<RecommendationTabId>('reminders');
  const [expandedGameIds, setExpandedGameIds] = useState<Record<string, boolean>>({ 'stardew-valley': true });
  const [showBackToTop, setShowBackToTop] = useState(false);
  const contentRef = useRef<HTMLElement | null>(null);
  const previousSelectedSaveIdRef = useRef<string | undefined>(undefined);
  const saves = useStore(saveStore, (state) => state.saves);
  const selectedSaveId = useStore(saveStore, (state) => state.selectedSaveId);
  const selectSave = useStore(saveStore, (state) => state.selectSave);
  const upsertSave = useStore(saveStore, (state) => state.upsertSave);
  const removeSaveByPath = useStore(saveStore, (state) => state.removeSaveByPath);
  const snapshot = useStore(plannerStore, (state) => state.snapshot);
  const planDate = useStore(plannerStore, (state) => state.planDate);
  const selectedWeather = useStore(plannerStore, (state) => state.selectedWeather);
  const goal = useStore(plannerStore, (state) => state.goal);
  const manualCorrections = useStore(plannerStore, (state) => state.manualCorrections);
  const plan = useStore(plannerStore, (state) => state.plan);
  const setSnapshot = useStore(plannerStore, (state) => state.setSnapshot);
  const setGoal = useStore(plannerStore, (state) => state.setGoal);
  const setManualCorrection = useStore(plannerStore, (state) => state.setManualCorrection);
  const config = useStore(settingsStore, (state) => state.config);
  const setLanguage = useStore(settingsStore, (state) => state.setLanguage);
  const addManualSaveDirectory = useStore(settingsStore, (state) => state.addManualSaveDirectory);
  const removeManualSaveDirectory = useStore(settingsStore, (state) => state.removeManualSaveDirectory);
  const manualSaveDirectoryKey = config.manualSaveDirectories.join('\n');
  const language = config.language;
  const routeProgress = createRouteProgressSummary(snapshot, language);
  const sidebarGameGroups = createSidebarGameGroups(saves, language);
  const hasSelectedSnapshot = Boolean(selectedSaveId && snapshotsBySaveId[selectedSaveId]);

  useEffect(() => {
    setActiveRecommendationTab((currentTab) => resolveRecommendationTabForSaveSelection({
      activeTabId: currentTab,
      previousSaveId: previousSelectedSaveIdRef.current,
      selectedSaveId,
    }));
    previousSelectedSaveIdRef.current = selectedSaveId;
  }, [selectedSaveId]);

  useEffect(() => {
    const selected = selectedSaveId ? snapshotsBySaveId[selectedSaveId] : undefined;
    if (selected && selected.saveIdentity.uniqueId !== snapshot.saveIdentity.uniqueId) {
      setSnapshot(selected);
    }
  }, [selectedSaveId, setSnapshot, snapshot.saveIdentity.uniqueId, snapshotsBySaveId]);

  useEffect(() => {
    if (!isDesktopRuntime) {
      return;
    }

    let cancelled = false;
    saveStore.getState().setScanning(true);
    setImportMessage('正在扫描默认星露谷存档目录...');
    void scanTauriSaves()
      .then((scannedSaves) => {
        if (cancelled) {
          return;
        }

        if (scannedSaves.length > 0) {
          saveStore.getState().setSaves(scannedSaves);
          setImportMessage(`已扫描到 ${scannedSaves.length} 个存档。`);
        } else {
          saveStore.getState().setSaves([]);
          setSnapshotsBySaveId({});
          setImportMessage('默认目录未找到存档，可手动选择存档文件夹导入。');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          saveStore.getState().setSaves([]);
          setSnapshotsBySaveId({});
          setImportMessage(error instanceof Error ? error.message : '扫描默认存档目录失败，可手动选择存档文件夹导入。');
        }
      })
      .finally(() => {
        if (!cancelled) {
          saveStore.getState().setScanning(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isDesktopRuntime]);

  useEffect(() => {
    if (!isDesktopRuntime || config.manualSaveDirectories.length === 0) {
      return;
    }

    let cancelled = false;
    void Promise.allSettled(
      config.manualSaveDirectories.map(async (directoryPath) => {
        const imported = await readTauriSaveFile({ savePath: directoryPath });
        return { directoryPath, imported };
      }),
    ).then((results) => {
      if (cancelled) {
        return;
      }

      for (const result of results) {
        if (result.status === 'fulfilled') {
          acceptImportedSave(result.value.imported, undefined, { silent: true });
        } else {
          const index = results.indexOf(result);
          const missingPath = config.manualSaveDirectories[index];
          if (missingPath) {
            removeManualSaveDirectory(missingPath);
            removeSaveByPath(missingPath);
          }
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [manualSaveDirectoryKey, isDesktopRuntime, removeManualSaveDirectory, removeSaveByPath]);

  useEffect(() => {
    if (!selectedSaveId || snapshotsBySaveId[selectedSaveId]) {
      return;
    }

    const selectedSave = saves.find((save) => save.id === selectedSaveId);
    if (!isDesktopRuntime || !selectedSave) {
      setImportMessage('该存档已识别但尚未解析，请手动选择对应主存档文件生成计划。');
      return;
    }

    let cancelled = false;
    setImportMessage(`正在读取 ${selectedSave.name} 的主存档文件...`);
    void readTauriSaveFile({ savePath: selectedSave.path })
      .then((imported) => {
        if (!cancelled) {
          acceptImportedSave(imported, selectedSave);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setImportMessage(error instanceof Error ? error.message : '读取存档失败，请手动选择对应主存档文件。');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isDesktopRuntime, saves, selectedSaveId, snapshotsBySaveId]);

  function acceptImportedSave(
    imported: Awaited<ReturnType<typeof importBrowserSaveFile>>,
    scannedEntry?: SaveEntry,
    options: { silent?: boolean } = {},
  ) {
      const merged = mergeImportedSaveForScannedEntry(imported, scannedEntry);
      setSnapshotsBySaveId((current) => ({
        ...current,
        [merged.snapshotKey]: imported.snapshot,
      }));
      upsertSave(merged.entry);
      if (!options.silent) {
        setImportMessage(`已导入：${merged.entry.name}`);
      }
  }

  async function handleImportFile(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      acceptImportedSave(await importBrowserSaveFile(file));
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : '导入失败，请确认选择的是存档 XML 文件。');
    }
  }

  async function handlePickDesktopFile() {
    try {
      const { pickTauriSaveFile } = await import('./services/tauriSaveFilePicker.ts');
      const picked = await pickTauriSaveFile();
      if (picked) {
        acceptImportedSave(picked.imported);
        addManualSaveDirectory(picked.saveDirectoryPath);
      }
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : '打开桌面文件选择器失败。');
    }
  }

  function handleContentScroll(event: UIEvent<HTMLElement>) {
    setShowBackToTop(shouldShowBackToTop(event.currentTarget.scrollTop));
  }

  function scrollContentToTop() {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleGameGroup(gameId: string) {
    setExpandedGameIds((current) => ({
      ...current,
      [gameId]: !current[gameId],
    }));
  }

  function handleSelectSave(saveId: string) {
    setActiveRecommendationTab((currentTab) => resolveRecommendationTabForSaveClick({
      activeTabId: currentTab,
      clickedSaveId: saveId,
      selectedSaveId,
    }));
    selectSave(saveId);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <h1>{t(language, 'app.title')}</h1>
        </div>
        <section className="sidebar-section game-list" id="saves" aria-label="存档列表">
          {sidebarGameGroups.map((game) => {
            const isExpanded = expandedGameIds[game.id] ?? false;

            return (
              <article className="game-group" key={game.id}>
                <button
                  aria-expanded={isExpanded}
                  className="game-group-toggle"
                  type="button"
                  onClick={() => toggleGameGroup(game.id)}
                >
                  <span className="game-title">
                    <img alt="" className="game-icon" src={game.iconPath} />
                    <span>{game.name}</span>
                  </span>
                  {isExpanded ? (
                    <ChevronDown aria-hidden="true" className="game-chevron" size={16} />
                  ) : (
                    <ChevronRight aria-hidden="true" className="game-chevron" size={16} />
                  )}
                </button>
                {isExpanded ? (
                  <div className="game-save-panel">
                    <p className="game-save-count">{game.saveCountLabel}</p>
                    {isDesktopRuntime ? (
                      <button className="import-button" type="button" onClick={() => void handlePickDesktopFile()}>
                        {t(language, 'saves.manualPick')}
                      </button>
                    ) : (
                      <label className="import-control">
                        <span>{t(language, 'saves.manualPick')}</span>
                        <input
                          accept=".xml,*"
                          type="file"
                          onChange={(event) => {
                            void handleImportFile(event.target.files?.[0]);
                          }}
                        />
                      </label>
                    )}
                    <div className="save-list">
                      {game.saves.map((save) => (
                        <button
                          className="save-button"
                          data-selected={save.id === selectedSaveId}
                          key={save.id}
                          type="button"
                          onClick={() => handleSelectSave(save.id)}
                        >
                          <span>{save.name}</span>
                          <small>{formatDateTime(save.lastModified)}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
        <section className="sidebar-section settings-section" aria-label={t(language, 'settings.language')}>
          <label className="language-select">
            <span>{t(language, 'settings.language')}</span>
            <select value={language} onChange={(event) => setLanguage(event.target.value as AppLanguage)}>
              <option value="zh-CN">{t(language, 'settings.language.zh')}</option>
              <option value="en-US">{t(language, 'settings.language.en')}</option>
            </select>
          </label>
        </section>
      </aside>

      <section className="content" id="plan" ref={contentRef} onScroll={handleContentScroll}>
        {!hasSelectedSnapshot ? (
          <section className="empty-state" aria-label={t(language, 'empty.noSaveTitle')}>
            <strong>{t(language, 'empty.noSaveTitle')}</strong>
            <p>{t(language, 'empty.noSaveBody')}</p>
          </section>
        ) : (
        <>
        <header className="page-header">
          <div>
            <h2>{formatPlanTitle(planDate, language)}</h2>
            {plan.subtitle ? <p>{plan.subtitle}</p> : null}
          </div>
          <div className="header-controls">
            <label className="weather-select">
              <span>{t(language, 'header.goal')}</span>
              <select
                value={goal}
                onChange={(event) => setGoal(event.target.value as PlannerGoal)}
              >
                <option value="free">{formatGoalLabel('free', language)}</option>
                <option value="money">{formatGoalLabel('money', language)}</option>
              </select>
            </label>
            <div className="weather-select status-readout">
              <span>{t(language, 'header.weather')}</span>
              <strong>{formatWeatherLabel(selectedWeather, language)}</strong>
            </div>
            <div className="weather-select status-readout">
              <span>{t(language, 'header.luck')}</span>
              <strong>{formatLuck(snapshot.player.dailyLuck, language)}</strong>
            </div>
          </div>
        </header>

        <div className="notice">{t(language, 'notice.afterSleepSave')}</div>

        {plan.parseWarnings.length > 0 ? (
          <section className="warning-list" aria-label={t(language, 'notice.parseWarnings')}>
            {plan.parseWarnings.map((warning) => (
              <p key={`${warning.code}-${warning.message}`}>{warning.message}</p>
            ))}
          </section>
        ) : null}

        <section className="summary-grid" aria-label="当前状态">
          {createSummaryCards(snapshot, planDate, language).map((card) => (
            <div key={card.id}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              {card.detail ? <small>{card.detail}</small> : null}
            </div>
          ))}
        </section>

        <section className="corrections" aria-label={t(language, 'corrections.title')}>
          <div className="corrections-copy">
            <h3>{t(language, 'corrections.title')}</h3>
            <p>{t(language, 'corrections.copy')}</p>
          </div>
          <div className="correction-options">
            <label>
              <input
                checked={manualCorrections.wateredToday}
                type="checkbox"
                onChange={(event) => {
                  setManualCorrection('wateredToday', event.target.checked);
                }}
              />
              {t(language, 'corrections.watered')}
            </label>
            <label>
              <input
                checked={manualCorrections.harvestedToday}
                type="checkbox"
                onChange={(event) => {
                  setManualCorrection('harvestedToday', event.target.checked);
                }}
              />
              {t(language, 'corrections.harvested')}
            </label>
            <label>
              <input
                checked={manualCorrections.giftedToday}
                type="checkbox"
                onChange={(event) => {
                  setManualCorrection('giftedToday', event.target.checked);
                }}
              />
              {t(language, 'corrections.gifted')}
            </label>
          </div>
        </section>

        <section className="route-panel" id="settings" aria-label={t(language, 'mainRoute.title')}>
          <div className="route-panel-header">
            <div>
              <span>{t(language, 'mainRoute.title')}</span>
              <strong>{routeProgress.branchLabel}</strong>
            </div>
            <b>{routeProgress.percent}%</b>
          </div>
          <div className="route-progress" aria-label={t(language, 'mainRoute.progress')}>
            <div style={{ width: `${routeProgress.percent}%` }} />
          </div>
        </section>

        <RecommendationTabs
          activeTabId={activeRecommendationTab}
          onTabChange={setActiveRecommendationTab}
          selectedWeather={selectedWeather}
          snapshot={snapshot}
          language={language}
          tabs={createRecommendationTabs({
            reminders: plan.reminders,
            actions: plan.actions,
            language,
          })}
        />
        </>
        )}
        {showBackToTop ? (
          <button
            className="back-to-top-button"
            type="button"
            onClick={scrollContentToTop}
            {...getBackToTopButtonA11yProps(language)}
          >
            <ArrowUp aria-hidden="true" size={22} strokeWidth={2.6} />
          </button>
        ) : null}
      </section>
    </main>
  );
}

function RecommendationTabs({
  activeTabId,
  language,
  onTabChange,
  selectedWeather,
  snapshot,
  tabs,
}: {
  activeTabId: RecommendationTabId;
  language: AppLanguage;
  onTabChange: (tabId: RecommendationTabId) => void;
  selectedWeather: Weather;
  snapshot: StardewSaveSnapshot;
  tabs: ReturnType<typeof createRecommendationTabs>;
}) {
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  return (
    <section className="recommendation-panel" aria-label="建议">
      <div className="recommendation-tabs" role="tablist" aria-label={t(language, 'tabs.aria')}>
        {tabs.map((tab) => (
          <button
            aria-controls={`recommendation-panel-${tab.id}`}
            aria-selected={tab.id === activeTab.id}
            className="recommendation-tab"
            id={`recommendation-tab-${tab.id}`}
            key={tab.id}
            role="tab"
            type="button"
            onClick={() => onTabChange(tab.id)}
          >
            <span>{tab.label}</span>
            <strong>{getTabCount(tab.id, snapshot, tab.items ?? [])}</strong>
          </button>
        ))}
      </div>
      <div
        aria-labelledby={`recommendation-tab-${activeTab.id}`}
        className="recommendation-tab-panel"
        id={`recommendation-panel-${activeTab.id}`}
        role="tabpanel"
      >
        {activeTab.id === 'reminders' || activeTab.id === 'actions' ? (
          <RecommendationList emptyText={activeTab.emptyText} items={activeTab.items ?? []} language={language} />
        ) : null}
        {activeTab.id === 'skills' ? <SkillPanel language={language} snapshot={snapshot} /> : null}
        {activeTab.id === 'friendship' ? <FriendshipPanel language={language} snapshot={snapshot} /> : null}
        {activeTab.id === 'exploration' ? <ExplorationPanel language={language} selectedWeather={selectedWeather} snapshot={snapshot} /> : null}
        {activeTab.id === 'inventory' ? <InventoryPanel language={language} snapshot={snapshot} /> : null}
      </div>
    </section>
  );
}

function getTabCount(tabId: RecommendationTabId, snapshot: StardewSaveSnapshot, items: RecommendationItem[]): number {
  if (tabId === 'skills') {
    return 5;
  }
  if (tabId === 'friendship') {
    return snapshot.relationships.length;
  }
  if (tabId === 'exploration') {
    return 7;
  }
  if (tabId === 'inventory') {
    return snapshot.inventory.length;
  }

  return items.length;
}

function SkillPanel({ language, snapshot }: { language: AppLanguage; snapshot: StardewSaveSnapshot }) {
  const skills = [
    { label: t(language, 'skills.farming'), value: snapshot.skills.farming },
    { label: t(language, 'skills.mining'), value: snapshot.skills.mining },
    { label: t(language, 'skills.foraging'), value: snapshot.skills.foraging },
    { label: t(language, 'skills.fishing'), value: snapshot.skills.fishing },
    { label: t(language, 'skills.combat'), value: snapshot.skills.combat },
  ];
  const equipment = snapshot.player.equipment;

  return (
    <div className="info-grid">
      <section className="info-card">
        <h3>{t(language, 'skills.levels')}</h3>
        <dl className="metric-list">
          {skills.map((skill) => (
            <div key={skill.label}>
              <dt>{skill.label}</dt>
              <dd>{skill.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="info-card">
        <h3>{t(language, 'skills.equipment')}</h3>
        <dl className="metric-list">
          <div>
            <dt>{t(language, 'equipment.weapon')}</dt>
            <dd>{formatEquipmentValue(equipment.weaponName, t(language, 'equipment.notOwned'), language, equipment.carried?.weapon)}</dd>
          </div>
          <div>
            <dt>{t(language, 'equipment.boots')}</dt>
            <dd>{formatEquipmentValue(equipment.bootsName, t(language, 'equipment.notEquipped'), language)}</dd>
          </div>
          <div>
            <dt>{t(language, 'equipment.rings')}</dt>
            <dd>{formatEquipmentList(equipment.ringNames, t(language, 'equipment.notEquipped'), language)}</dd>
          </div>
          <div>
            <dt>{t(language, 'equipment.rod')}</dt>
            <dd>{formatEquipmentValue(equipment.fishingRodName, t(language, 'equipment.notOwned'), language, equipment.carried?.fishingRod)}</dd>
          </div>
          <div>
            <dt>{t(language, 'equipment.bait')}</dt>
            <dd>{formatEquipmentValue(equipment.baitName, t(language, 'equipment.notAttached'), language, equipment.carried?.bait)}</dd>
          </div>
          <div>
            <dt>{t(language, 'equipment.hoe')}</dt>
            <dd>{formatEquipmentValue(equipment.hoeName, t(language, 'equipment.notOwned'), language, equipment.carried?.hoe)}</dd>
          </div>
          <div>
            <dt>{t(language, 'equipment.pickaxe')}</dt>
            <dd>{formatEquipmentValue(equipment.pickaxeName, t(language, 'equipment.notOwned'), language, equipment.carried?.pickaxe)}</dd>
          </div>
          <div>
            <dt>{t(language, 'equipment.axe')}</dt>
            <dd>{formatEquipmentValue(equipment.axeName, t(language, 'equipment.notOwned'), language, equipment.carried?.axe)}</dd>
          </div>
          <div>
            <dt>{t(language, 'equipment.wateringCan')}</dt>
            <dd>{formatEquipmentValue(equipment.wateringCanName, t(language, 'equipment.notOwned'), language, equipment.carried?.wateringCan)}</dd>
          </div>
          <div>
            <dt>{t(language, 'equipment.scythe')}</dt>
            <dd>{formatEquipmentValue(equipment.scytheName, t(language, 'equipment.notOwned'), language, equipment.carried?.scythe)}</dd>
          </div>
          <div>
            <dt>{t(language, 'equipment.trashCan')}</dt>
            <dd>{formatEquipmentValue(equipment.trashCanName, t(language, 'equipment.notOwned'), language, equipment.carried?.trashCan)}</dd>
          </div>
          <div>
            <dt>{t(language, 'equipment.pan')}</dt>
            <dd>{formatEquipmentValue(equipment.panName, t(language, 'equipment.notOwned'), language, equipment.carried?.pan)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function FriendshipPanel({ language, snapshot }: { language: AppLanguage; snapshot: StardewSaveSnapshot }) {
  const [giftModal, setGiftModal] = useState<{
    npc: string;
    options: GiftOption[];
  } | null>(null);
  const rows = useMemo(() => {
    return createFriendshipPanelRows(snapshot.relationships, snapshot.inventory, language);
  }, [language, snapshot.inventory, snapshot.relationships]);

  if (snapshot.relationships.length === 0) {
    return <p className="empty-state">{t(language, 'friendship.empty')}</p>;
  }

  return (
    <>
      <div className="info-grid">
        {rows.map(({ giftOptions, giftText, relationship }) => {
          const npcName = formatNpcName(relationship.npc, language);

          return (
            <section className="info-card" key={relationship.npc}>
              <h3>{npcName}</h3>
              <dl className="metric-list">
                <div>
                  <dt>{t(language, 'friendship.points')}</dt>
                  <dd>{relationship.points} / {relationship.hearts}</dd>
                </div>
                <div>
                  <dt>{t(language, 'friendship.weeklyGifts')}</dt>
                  <dd>{relationship.giftsThisWeek ?? t(language, 'friendship.unparsed')} / 2</dd>
                </div>
                <div>
                  <dt>{t(language, 'friendship.talkedToday')}</dt>
                  <dd>{relationship.talkedToday === undefined ? t(language, 'friendship.unparsed') : relationship.talkedToday ? t(language, 'friendship.talked') : t(language, 'friendship.notTalked')}</dd>
                </div>
                <div className="gift-options-row">
                  <dt>{t(language, 'friendship.giftOptions')}</dt>
                  <dd>
                    {giftOptions.length > 0 ? (
                      <button className="gift-button" type="button" onClick={() => setGiftModal({ npc: npcName, options: giftOptions })}>
                        {t(language, 'friendship.giftButton')}
                      </button>
                    ) : (
                      giftText
                    )}
                  </dd>
                </div>
              </dl>
              {giftOptions.length > 0 ? <p className="gift-summary">{formatGiftSummary(giftOptions, language)}</p> : null}
            </section>
          );
        })}
      </div>
      {giftModal ? (
        <GiftOptionsModal
          language={language}
          npc={giftModal.npc}
          options={giftModal.options}
          onClose={() => setGiftModal(null)}
        />
      ) : null}
    </>
  );
}

function formatGiftSummary(options: GiftOption[], language: AppLanguage): string {
  const counts = options.reduce(
    (summary, option) => ({
      ...summary,
      [option.tier]: summary[option.tier] + 1,
    }),
    { loved: 0, liked: 0, neutral: 0 },
  );

  return t(language, 'friendship.giftSummary', {
    loved: counts.loved,
    liked: counts.liked,
    neutral: counts.neutral,
  });
}

function GiftOptionsModal({
  language,
  npc,
  onClose,
  options,
}: {
  language: AppLanguage;
  npc: string;
  onClose: () => void;
  options: GiftOption[];
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('modal-open');
    };
  }, []);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-modal="true"
        className="gift-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="gift-modal-header">
          <h3>{t(language, 'giftModal.title', { npc })}</h3>
          <button className="modal-close-button" type="button" onClick={onClose}>
            {t(language, 'giftModal.close')}
          </button>
        </header>
        <div className="gift-option-list">
          {options.map((option, index) => (
            <article className="gift-option-item" key={`${option.id}-${option.source ?? 'unknown'}-${index}`}>
              <ItemIcon id={option.id} name={option.displayName} />
              <div>
                <h4>{option.displayName}</h4>
                <p>
                  <span className="gift-tier" data-tier={option.tier}>{formatGiftTierLabel(option, language)}</span>
                  <span>{t(language, 'giftModal.location')}：{formatGiftOptionSource(option, language)}</span>
                  <span>{t(language, 'giftModal.count')}：x{option.stack}</span>
                  {option.quality ? <span>{t(language, 'giftModal.quality')}：{option.quality}</span> : null}
                  <span>{t(language, 'giftModal.id')}：{option.id}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ItemIcon({ id, name }: { id: GiftOption['id']; name: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const iconPath = getItemIconPath(id);
  const fallback = name.slice(0, 1).toUpperCase();

  if (!iconPath || imageFailed) {
    return <div className="item-icon item-icon-fallback" aria-hidden="true">{fallback}</div>;
  }

  return (
    <div className="item-icon" aria-hidden="true">
      <img
        alt=""
        src={iconPath}
        onError={() => setImageFailed(true)}
      />
    </div>
  );
}

function formatGiftTierLabel(option: GiftOption, language: AppLanguage): string {
  if (option.tier === 'loved') {
    return t(language, 'giftTier.loved');
  }
  if (option.tier === 'liked') {
    return t(language, 'giftTier.liked');
  }

  return t(language, 'giftTier.neutral');
}

function formatGiftOptionSource(option: GiftOption, language: AppLanguage): string {
  const translated = formatItemSource(option, language);
  return translated ?? t(language, 'inventory.source.unknown');
}

function CommunityCenterProgressPreview({ language, snapshot }: { language: AppLanguage; snapshot: StardewSaveSnapshot }) {
  if (snapshot.farm.communityCenterRoute !== 'community_center') {
    return null;
  }

  const rooms = createCommunityCenterProgress(snapshot);

  return (
    <div className="community-progress-preview">
      {rooms.map((room) => {
        const completedBundles = room.bundles.filter((bundle) => bundle.completed).length;
        const deliverableCount = room.bundles
          .flatMap((bundle) => bundle.requirements)
          .filter((requirement) => requirement.deliverable).length;

        return (
          <details className="community-progress-room" key={room.roomId}>
            <summary>
              <span>{localizeCommunityCenterRoomName(room.roomName, language)}</span>
              <small>{completedBundles}/{room.bundles.length}</small>
            </summary>
            <div className="community-progress-bundles">
              {room.bundles.map((bundle) => (
                <div className="community-progress-bundle" data-completed={bundle.completed} key={bundle.bundleId}>
                  <div>
                    <strong>{localizeCommunityCenterBundleName(bundle.bundleName, language)}</strong>
                    <small>{bundle.completed ? t(language, 'communityProgress.completed') : t(language, 'communityProgress.incomplete')}</small>
                  </div>
                  <ul>
                    {bundle.requirements.map((requirement) => (
                      <li data-deliverable={requirement.deliverable} key={`${bundle.bundleId}-${requirement.itemId}`}>
                        <ItemIcon
                          id={requirement.itemId}
                          name={localizeCommunityCenterItemName(requirement.itemId, requirement.itemName, language)}
                        />
                        <span>{localizeCommunityCenterItemName(requirement.itemId, requirement.itemName, language)}</span>
                        <small>x{requirement.requiredStack} / {requirement.availableStack}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {deliverableCount > 0 ? <p>{t(language, 'communityProgress.deliverableCount', { count: deliverableCount })}</p> : null}
          </details>
        );
      })}
    </div>
  );
}

function JojaProgressPreview({ language, snapshot }: { language: AppLanguage; snapshot: StardewSaveSnapshot }) {
  if (snapshot.farm.communityCenterRoute !== 'joja') {
    return null;
  }

  const projects = createJojaProgress(snapshot);

  return (
    <div className="community-progress-preview">
      <div className="community-progress-bundles">
        {projects.map((project) => (
          <div className="community-progress-bundle" data-completed={project.completed} key={project.id}>
            <div>
              <strong>{formatJojaProjectName(project.name, language)}</strong>
              <small>{project.completed ? t(language, 'jojaProgress.completed') : t(language, 'jojaProgress.incomplete')}</small>
            </div>
            <p>{t(language, 'jojaProgress.price', { price: project.price.toLocaleString() })}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExplorationPanel({ language, selectedWeather, snapshot }: { language: AppLanguage; selectedWeather: Weather; snapshot: StardewSaveSnapshot }) {
  const sections = createExplorationProgressSections(snapshot, selectedWeather, language);

  return (
    <div className="info-grid">
      {sections.map((section) => (
        <section className="info-card" key={section.id}>
          <h3>{section.title}</h3>
          <dl className="metric-list">
            {section.items.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
            ))}
          </dl>
        </section>
      ))}
      {snapshot.farm.communityCenterRoute === 'community_center' ? (
        <section className="info-card info-card-wide">
          <h3>{t(language, 'communityProgress.title')}</h3>
          <CommunityCenterProgressPreview language={language} snapshot={snapshot} />
        </section>
      ) : null}
      {snapshot.farm.communityCenterRoute === 'joja' ? (
        <section className="info-card info-card-wide">
          <h3>{t(language, 'jojaProgress.title')}</h3>
          <JojaProgressPreview language={language} snapshot={snapshot} />
        </section>
      ) : null}
    </div>
  );
}

function InventoryPanel({ language, snapshot }: { language: AppLanguage; snapshot: StardewSaveSnapshot }) {
  const groups = groupInventoryBySource(snapshot.inventory);
  if (groups.length === 0) {
    return <p className="empty-state">{t(language, 'inventory.empty')}</p>;
  }

  return (
    <div className="info-grid">
      {groups.map((group) => (
        <section className="info-card" key={group.id}>
          <h3>{formatInventoryGroupLabel(group.id, group.label, language)}</h3>
          <dl className="metric-list">
            {group.items.map((item, index) => (
              <div key={`${group.id}-${item.id}-${item.name}-${index}`}>
                <dt>{formatItemName(item, language)}</dt>
                <dd>
                  x{item.stack}
                  {item.quality ? ` · ${t(language, 'inventory.quality')}${item.quality}` : ''}
                  {item.id !== '' ? ` · ${t(language, 'inventory.id')} ${item.id}` : ''}
                  {formatItemSource(item, language) ? ` · ${formatItemSource(item, language)}` : ''}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

function formatInventoryGroupLabel(groupId: string, fallback: string, language: AppLanguage): string {
  if (groupId === 'backpack') {
    return t(language, 'inventory.source.backpack');
  }
  if (groupId === 'chest') {
    return t(language, 'inventory.source.chest');
  }
  if (groupId === 'fridge') {
    return t(language, 'inventory.source.fridge');
  }
  if (groupId === 'unknown') {
    return t(language, 'inventory.source.unknown');
  }

  return fallback;
}

function RecommendationList({
  emptyText,
  items,
  language,
}: {
  emptyText: string;
  items: RecommendationItem[];
  language: AppLanguage;
}) {
  const [detailItem, setDetailItem] = useState<RecommendationItem | undefined>();
  const localizedItems = items.map((item) => localizeRecommendationItem(item, language));

  return (
    <div className="recommendation-list">
      {localizedItems.length > 0 ? localizedItems.map((item) => (
        <article className="recommendation-card" key={item.id}>
          <div>
            <span className="priority">{formatPriority(item.priority, language)}</span>
            <span className="confidence" data-confidence={item.confidence}>
              {t(language, 'recommendation.confidence')}：{formatConfidence(item.confidence, language)}
            </span>
            <h4>{item.title}</h4>
          </div>
          <p>{item.reason}</p>
          {item.estimate ? <strong>{item.estimate.description}</strong> : null}
          {item.evidence.length > 0 ? (
            <dl className="evidence-list">
              {item.evidence.map((evidence) => (
                <div key={`${item.id}-${evidence.source}-${evidence.label}`}>
                  <dt>{evidence.label}</dt>
                  <dd>{evidence.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {item.uncertainty.length > 0 ? (
            <ul className="uncertainty-list" aria-label={t(language, 'recommendation.uncertainty')}>
              {item.uncertainty.map((uncertainty) => (
                <li key={`${item.id}-${uncertainty}`}>{uncertainty}</li>
              ))}
            </ul>
          ) : null}
          {shouldShowRecommendationDetailButton(item) ? (
            <button className="detail-button" type="button" onClick={() => setDetailItem(item)}>
              {t(language, 'recommendation.viewDetails')}
            </button>
          ) : null}
        </article>
      )) : <p className="empty-state">{emptyText}</p>}
      {detailItem?.detail?.communityCenterDeliverables ? (
        <CommunityCenterDeliverablesModal
          deliverables={detailItem.detail.communityCenterDeliverables}
          language={language}
          onClose={() => setDetailItem(undefined)}
        />
      ) : null}
      {detailItem?.detail?.producedItems ? (
        <ProducedItemsModal
          items={detailItem.detail.producedItems}
          language={language}
          onClose={() => setDetailItem(undefined)}
        />
      ) : null}
    </div>
  );
}

function shouldShowRecommendationDetailButton(item: RecommendationItem): boolean {
  return shouldShowCommunityCenterDetailButton(item.detail?.communityCenterDeliverables)
    || shouldShowProducedItemDetailButton(item.detail?.producedItems);
}

function CommunityCenterDeliverablesModal({
  deliverables,
  language,
  onClose,
}: {
  deliverables: NonNullable<RecommendationItem['detail']>['communityCenterDeliverables'];
  language: AppLanguage;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('modal-open');
    };
  }, []);

  const groups = groupCommunityCenterDeliverables(deliverables ?? []);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-modal="true"
        className="gift-modal community-center-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="gift-modal-header">
          <h3>{t(language, 'communityCenterModal.title')}</h3>
          <button className="modal-close-button" type="button" onClick={onClose}>
            {t(language, 'giftModal.close')}
          </button>
        </header>
        <div className="community-center-deliverable-groups">
          {groups.map((group) => (
            <section className="community-center-deliverable-group" key={group.key}>
              <h4>{group.roomName} · {group.bundleName}</h4>
              <div className="gift-option-list">
                {group.items.map((item) => (
                  <article className="gift-option-item" key={`${group.key}-${item.itemId}`}>
                    <ItemIcon id={item.itemId} name={item.itemName} />
                    <div>
                      <h5>{item.itemName}</h5>
                      <p>
                        <span>{t(language, 'communityCenterModal.required')}：x{item.requiredStack}</span>
                        <span>{t(language, 'communityCenterModal.owned')}：x{item.availableStack}</span>
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProducedItemsModal({
  items,
  language,
  onClose,
}: {
  items: NonNullable<RecommendationItem['detail']>['producedItems'];
  language: AppLanguage;
  onClose: () => void;
}) {
  const groups = groupProducedItemsBySource(items ?? []);
  const [collapsedSources, setCollapsedSources] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('modal-open');
    };
  }, []);

  function toggleSource(sourceKey: string) {
    setCollapsedSources((current) => ({
      ...current,
      [sourceKey]: !current[sourceKey],
    }));
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-modal="true"
        className="gift-modal produced-items-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="gift-modal-header">
          <h3>{t(language, 'producedItemsModal.title')}</h3>
          <button className="modal-close-button" type="button" onClick={onClose}>
            {t(language, 'giftModal.close')}
          </button>
        </header>
        <div className="produced-item-source-groups">
          {groups.map((group) => (
            <section className="produced-item-source-group" key={group.key}>
              <button
                aria-expanded={!collapsedSources[group.key]}
                className="produced-item-source-toggle"
                type="button"
                onClick={() => toggleSource(group.key)}
              >
                <span>{group.sourceName ?? t(language, 'producedItemsModal.unknownSource')}</span>
                <strong>{group.items.length}</strong>
                {collapsedSources[group.key] ? (
                  <ChevronRight aria-hidden="true" size={16} />
                ) : (
                  <ChevronDown aria-hidden="true" size={16} />
                )}
              </button>
              {!collapsedSources[group.key] ? (
                <div className="gift-option-list">
                  {group.items.map((item, index) => (
                    <article className="gift-option-item" key={`${group.key}-${item.itemId}-${index}`}>
                      <ItemIcon id={item.itemId} name={item.itemName} />
                      <div>
                        <h4>{item.itemName}</h4>
                        <p>
                          <span>{t(language, 'producedItemsModal.quantity')}：x{item.quantity}</span>
                          {item.sourceName ? <span>{t(language, 'producedItemsModal.source')}：{item.sourceName}</span> : null}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
