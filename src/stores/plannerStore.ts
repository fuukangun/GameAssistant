import { createStore } from 'zustand/vanilla';
import { generatePlan } from '../stardew/planner/generatePlan.ts';
import { calculatePlanDate } from '../stardew/planner/planDate.ts';
import { getDefaultPlanWeather } from '../stardew/planner/weather.ts';
import type {
  ManualCorrections,
  PlanDate,
  PlanRecommendation,
  PlannerGoal,
  PlannerInput,
  StardewSaveSnapshot,
  Weather,
} from '../shared/types.ts';

export interface PlannerState {
  snapshot: StardewSaveSnapshot;
  planDate: PlanDate;
  selectedWeather: Weather;
  goal: PlannerGoal;
  manualCorrections: ManualCorrections;
  plan: PlanRecommendation;
  setSnapshot: (snapshot: StardewSaveSnapshot) => void;
  setWeather: (weather: Weather) => void;
  setGoal: (goal: PlannerGoal) => void;
  setManualCorrection: (key: keyof ManualCorrections, value: boolean) => void;
}

export function createPlannerStore(snapshot: StardewSaveSnapshot) {
  const planDate = calculatePlanDate(snapshot.time);
  const selectedWeather = getDefaultPlanWeather(snapshot) ?? 'sunny';
  const goal: PlannerGoal = 'free';
  const manualCorrections = createEmptyManualCorrections();

  return createStore<PlannerState>((set, get) => ({
    snapshot,
    planDate,
    selectedWeather,
    goal,
    manualCorrections,
    plan: generatePlan(buildInput(snapshot, planDate, selectedWeather, goal, manualCorrections)),
    setSnapshot: (nextSnapshot) => {
      const nextPlanDate = calculatePlanDate(nextSnapshot.time);
      const nextWeather = getDefaultPlanWeather(nextSnapshot) ?? 'sunny';
      const nextCorrections = createEmptyManualCorrections();
      const currentGoal = get().goal;
      set({
        snapshot: nextSnapshot,
        planDate: nextPlanDate,
        selectedWeather: nextWeather,
        manualCorrections: nextCorrections,
        plan: generatePlan(buildInput(nextSnapshot, nextPlanDate, nextWeather, currentGoal, nextCorrections)),
      });
    },
    setWeather: (weather) => {
      set((state) => ({
        selectedWeather: weather,
        plan: generatePlan(buildInput(state.snapshot, state.planDate, weather, state.goal, state.manualCorrections)),
      }));
    },
    setGoal: (nextGoal) => {
      set((state) => ({
        goal: nextGoal,
        plan: generatePlan(buildInput(
          state.snapshot,
          state.planDate,
          state.selectedWeather,
          nextGoal,
          state.manualCorrections,
        )),
      }));
    },
    setManualCorrection: (key, value) => {
      const current = get();
      const nextCorrections = { ...current.manualCorrections, [key]: value };
      set({
        manualCorrections: nextCorrections,
        plan: generatePlan(buildInput(
          current.snapshot,
          current.planDate,
          current.selectedWeather,
          current.goal,
          nextCorrections,
        )),
      });
    },
  }));
}

function buildInput(
  snapshot: StardewSaveSnapshot,
  planDate: PlanDate,
  selectedWeather: Weather,
  goal: PlannerGoal,
  manualCorrections: ManualCorrections,
): PlannerInput {
  return {
    snapshot,
    planDate,
    selectedWeather,
    goal,
    manualCorrections,
  };
}

function createEmptyManualCorrections(): ManualCorrections {
  return {
    wateredToday: false,
    harvestedToday: false,
    giftedToday: false,
  };
}
