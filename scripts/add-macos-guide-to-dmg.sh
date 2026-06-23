#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DMG_DIR="${ROOT_DIR}/src-tauri/target/release/bundle/dmg"
GUIDE_PATH="${ROOT_DIR}/src-tauri/resources/Mac应用提示已损坏解决方案.md"
GUIDE_NAME="Mac应用提示已损坏解决方案.md"
DMG_PATH="$(find "${DMG_DIR}" -maxdepth 1 -type f -name '游戏助手_*_aarch64.dmg' ! -name '*.rw.dmg' ! -name '*.with-guide.dmg' -print | sort -V | tail -n 1)"

if [[ -z "${DMG_PATH}" || ! -f "${DMG_PATH}" ]]; then
  echo "DMG not found in: ${DMG_DIR}" >&2
  exit 1
fi

TMP_RW_DMG="${DMG_PATH%.dmg}.rw.dmg"
TMP_FINAL_DMG="${DMG_PATH%.dmg}.with-guide.dmg"

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
