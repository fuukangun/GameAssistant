use std::fs;

#[test]
fn tauri_about_metadata_includes_developer_and_github() {
  let config = fs::read_to_string("tauri.conf.json").expect("tauri config should be readable");

  assert!(config.contains("fuukangun"));
  assert!(config.contains("\"version\": \"1.2.0\""));
  assert!(config.contains("版本 1.2.0 发布于2026-07-04"));
  assert!(config.contains("\"homepage\": \"https://github.com/fuukangun/GameAssistant\""));
  assert!(config.contains("https://github.com/fuukangun/GameAssistant"));
}
