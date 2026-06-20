export interface TauriLikeGlobal {
  __TAURI_INTERNALS__?: unknown;
}

export function isTauriRuntime(globalValue: TauriLikeGlobal | undefined = globalThis as TauriLikeGlobal): boolean {
  return Boolean(globalValue?.__TAURI_INTERNALS__);
}
