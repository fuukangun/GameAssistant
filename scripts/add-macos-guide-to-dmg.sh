#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DMG_PATH="${ROOT_DIR}/src-tauri/target/release/bundle/dmg/游戏助手_1.0.0_aarch64.dmg"
GUIDE_PATH="${ROOT_DIR}/src-tauri/resources/Mac应用提示已损坏解决方案.md"
GUIDE_NAME="Mac应用提示已损坏解决方案.md"
TMP_RW_DMG="${ROOT_DIR}/src-tauri/target/release/bundle/dmg/游戏助手_1.0.0_aarch64.rw.dmg"
TMP_FINAL_DMG="${ROOT_DIR}/src-tauri/target/release/bundle/dmg/游戏助手_1.0.0_aarch64.with-guide.dmg"

if [[ ! -f "${DMG_PATH}" ]]; then
  echo "DMG not found: ${DMG_PATH}" >&2
  exit 1
fi

if [[ ! -f "${GUIDE_PATH}" ]]; then
  echo "Guide file not found: ${GUIDE_PATH}" >&2
  exit 1
fi

rm -f "${TMP_RW_DMG}" "${TMP_FINAL_DMG}"
hdiutil convert "${DMG_PATH}" -format UDRW -o "${TMP_RW_DMG}" >/dev/null

MOUNT_OUTPUT="$(hdiutil attach "${TMP_RW_DMG}" -nobrowse -readwrite)"
VOLUME_PATH="$(printf '%s\n' "${MOUNT_OUTPUT}" | awk -F '\t' '/\/Volumes\// {print $NF; exit}')"

if [[ -z "${VOLUME_PATH}" || ! -d "${VOLUME_PATH}" ]]; then
  echo "Failed to locate mounted DMG volume." >&2
  printf '%s\n' "${MOUNT_OUTPUT}" >&2
  exit 1
fi

cleanup() {
  hdiutil detach "${VOLUME_PATH}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

cp "${GUIDE_PATH}" "${VOLUME_PATH}/${GUIDE_NAME}"
sync
hdiutil detach "${VOLUME_PATH}" >/dev/null
trap - EXIT

hdiutil convert "${TMP_RW_DMG}" -format UDZO -imagekey zlib-level=9 -o "${TMP_FINAL_DMG}" >/dev/null
mv "${TMP_FINAL_DMG}" "${DMG_PATH}"
rm -f "${TMP_RW_DMG}"

echo "Added ${GUIDE_NAME} to ${DMG_PATH}"
