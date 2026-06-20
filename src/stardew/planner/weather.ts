import type { Weather } from '../../shared/types.ts';

export interface WeatherSource {
  weatherForTomorrow?: Weather;
}

export function getDefaultPlanWeather(source: WeatherSource): Weather | undefined {
  return source.weatherForTomorrow;
}
