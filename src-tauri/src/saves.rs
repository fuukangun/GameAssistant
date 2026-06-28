use serde::Serialize;
use std::{
  fs,
  path::{Path, PathBuf},
  time::SystemTime,
};

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveEntry {
  pub id: String,
  pub name: String,
  pub path: String,
  pub last_modified: String,
  pub parse_status: String,
  pub player_name: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveFileContent {
  pub file_name: String,
  pub file_path: String,
  pub modified_at: String,
  pub xml: String,
}

pub fn scan_saves_in_directory(root_path: &Path) -> Result<Vec<SaveEntry>, String> {
  let entries = fs::read_dir(root_path)
    .map_err(|error| format!("无法读取存档目录：{error}"))?;
  let mut saves = Vec::new();

  for entry in entries {
    let entry = entry.map_err(|error| format!("无法读取目录项：{error}"))?;
    let file_type = entry
      .file_type()
      .map_err(|error| format!("无法读取目录项类型：{error}"))?;
    if !file_type.is_dir() {
      continue;
    }

    let folder_path = entry.path();
    let folder_name = entry.file_name().to_string_lossy().to_string();
    if !has_save_files(&folder_path, &folder_name)? {
      continue;
    }

    let file_path = main_save_file_path(&folder_path, &folder_name);
    let metadata = fs::metadata(&file_path)
      .map_err(|error| format!("无法读取存档文件信息：{error}"))?;
    let save_names = read_save_names(&file_path, &folder_name);
    saves.push(SaveEntry {
      id: folder_name.clone(),
      name: save_names.farm_name,
      path: folder_path.to_string_lossy().to_string(),
      last_modified: format_system_time(metadata.modified().unwrap_or(SystemTime::UNIX_EPOCH)),
      parse_status: "partial".to_string(),
      player_name: save_names.player_name,
    });
  }

  saves.sort_by(|left, right| right.last_modified.cmp(&left.last_modified));
  Ok(saves)
}

pub fn read_main_save_file(save_path: &Path) -> Result<SaveFileContent, String> {
  let folder_name = save_path
    .file_name()
    .and_then(|value| value.to_str())
    .ok_or_else(|| "无法识别存档目录名称。".to_string())?;
  let main_file_path = save_path.join(folder_name);
  let file_path = if main_file_path.is_file() {
    main_file_path
  } else {
    save_path.join("SaveGameInfo")
  };

  if !file_path.is_file() {
    return Err("未找到主存档文件或 SaveGameInfo。".to_string());
  }

  let metadata = fs::metadata(&file_path)
    .map_err(|error| format!("无法读取存档文件信息：{error}"))?;
  let xml = fs::read_to_string(&file_path)
    .map_err(|error| format!("无法读取存档文件内容：{error}"))?;

  Ok(SaveFileContent {
    file_name: file_path
      .file_name()
      .map(|value| value.to_string_lossy().to_string())
      .unwrap_or_else(|| folder_name.to_string()),
    file_path: file_path.to_string_lossy().to_string(),
    modified_at: format_system_time(metadata.modified().unwrap_or(SystemTime::UNIX_EPOCH)),
    xml,
  })
}

pub fn default_stardew_save_path() -> Option<PathBuf> {
  let home = std::env::var_os("HOME").map(PathBuf::from)?;
  Some(home.join(".config").join("StardewValley").join("Saves"))
}

fn has_save_files(folder_path: &Path, folder_name: &str) -> Result<bool, String> {
  let entries = fs::read_dir(folder_path)
    .map_err(|error| format!("无法读取候选存档目录：{error}"))?;

  for entry in entries {
    let entry = entry.map_err(|error| format!("无法读取候选存档文件：{error}"))?;
    let file_type = entry
      .file_type()
      .map_err(|error| format!("无法读取候选存档文件类型：{error}"))?;
    if !file_type.is_file() {
      continue;
    }

    let file_name = entry.file_name().to_string_lossy().to_string();
    if file_name == folder_name || file_name == "SaveGameInfo" {
      return Ok(true);
    }
  }

  Ok(false)
}

fn get_display_name(folder_name: &str) -> String {
  folder_name
    .rsplit_once('_')
    .map(|(name, _)| name.to_string())
    .unwrap_or_else(|| folder_name.to_string())
}

struct SaveNames {
  farm_name: String,
  player_name: Option<String>,
}

fn read_save_names(file_path: &Path, folder_name: &str) -> SaveNames {
  let fallback_name = get_display_name(folder_name);
  let Ok(xml) = fs::read_to_string(file_path) else {
    return SaveNames {
      farm_name: fallback_name,
      player_name: None,
    };
  };

  SaveNames {
    farm_name: extract_xml_text(&xml, "farmName")
      .filter(|name| !name.is_empty())
      .unwrap_or(fallback_name),
    player_name: extract_xml_text(&xml, "name")
      .filter(|name| !name.is_empty()),
  }
}

fn main_save_file_path(folder_path: &Path, folder_name: &str) -> PathBuf {
  let main_file_path = folder_path.join(folder_name);
  if main_file_path.is_file() {
    main_file_path
  } else {
    folder_path.join("SaveGameInfo")
  }
}

fn extract_xml_text(xml: &str, tag_name: &str) -> Option<String> {
  let open_tag = format!("<{tag_name}>");
  let close_tag = format!("</{tag_name}>");
  let start = xml.find(&open_tag)? + open_tag.len();
  let end = xml[start..].find(&close_tag)? + start;
  Some(decode_basic_xml_entities(xml[start..end].trim()))
}

fn decode_basic_xml_entities(value: &str) -> String {
  value
    .replace("&amp;", "&")
    .replace("&lt;", "<")
    .replace("&gt;", ">")
    .replace("&quot;", "\"")
    .replace("&apos;", "'")
}

fn format_system_time(value: SystemTime) -> String {
  let seconds = value
    .duration_since(SystemTime::UNIX_EPOCH)
    .unwrap_or_default()
    .as_secs();
  seconds.to_string()
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::{
    fs::{create_dir_all, remove_dir_all, write},
    time::{SystemTime, UNIX_EPOCH},
  };

  #[test]
  fn finds_save_folder_with_matching_main_file() {
    let root = create_temp_dir("main_file");
    let save_path = root.join("Farmer_123456");
    create_dir_all(&save_path).unwrap();
    write(save_path.join("Farmer_123456"), "<SaveGame />").unwrap();

    let saves = scan_saves_in_directory(&root).unwrap();

    assert_eq!(saves.len(), 1);
    assert_eq!(saves[0].id, "Farmer_123456");
    assert_eq!(saves[0].name, "Farmer");

    remove_dir_all(root).unwrap();
  }

  #[test]
  fn uses_farm_name_from_main_save_when_scanning() {
    let root = create_temp_dir("farm_name");
    let save_path = root.join("Arkon_123456");
    create_dir_all(&save_path).unwrap();
    write(
      save_path.join("Arkon_123456"),
      "<SaveGame><player><name>Arkon</name><farmName>Vanilla</farmName></player></SaveGame>",
    )
    .unwrap();

    let saves = scan_saves_in_directory(&root).unwrap();

    assert_eq!(saves.len(), 1);
    assert_eq!(saves[0].id, "Arkon_123456");
    assert_eq!(saves[0].name, "Vanilla");
    assert_eq!(saves[0].player_name.as_deref(), Some("Arkon"));

    remove_dir_all(root).unwrap();
  }

  #[test]
  fn finds_save_folder_with_save_game_info() {
    let root = create_temp_dir("save_game_info");
    let save_path = root.join("ForestFarm_456");
    create_dir_all(&save_path).unwrap();
    write(save_path.join("SaveGameInfo"), "<SaveGame />").unwrap();

    let saves = scan_saves_in_directory(&root).unwrap();

    assert_eq!(saves.len(), 1);
    assert_eq!(saves[0].id, "ForestFarm_456");

    remove_dir_all(root).unwrap();
  }

  #[test]
  fn ignores_unrelated_folders() {
    let root = create_temp_dir("ignore");
    create_dir_all(root.join("NotASave")).unwrap();

    let saves = scan_saves_in_directory(&root).unwrap();

    assert!(saves.is_empty());

    remove_dir_all(root).unwrap();
  }

  #[test]
  fn reads_matching_main_save_file_before_save_game_info() {
    let root = create_temp_dir("read_main");
    let save_path = root.join("Farmer_123456");
    create_dir_all(&save_path).unwrap();
    write(save_path.join("Farmer_123456"), "<SaveGame><year>1</year></SaveGame>").unwrap();
    write(save_path.join("SaveGameInfo"), "<SaveGame><year>2</year></SaveGame>").unwrap();

    let content = read_main_save_file(&save_path).unwrap();

    assert_eq!(content.file_name, "Farmer_123456");
    assert!(content.xml.contains("<year>1</year>"));

    remove_dir_all(root).unwrap();
  }

  #[test]
  fn reads_save_game_info_when_main_file_is_missing() {
    let root = create_temp_dir("read_info");
    let save_path = root.join("ForestFarm_456");
    create_dir_all(&save_path).unwrap();
    write(save_path.join("SaveGameInfo"), "<SaveGame><year>3</year></SaveGame>").unwrap();

    let content = read_main_save_file(&save_path).unwrap();

    assert_eq!(content.file_name, "SaveGameInfo");
    assert!(content.xml.contains("<year>3</year>"));

    remove_dir_all(root).unwrap();
  }

  fn create_temp_dir(name: &str) -> PathBuf {
    let suffix = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap()
      .as_nanos();
    let path = std::env::temp_dir().join(format!("game_daily_planner_{name}_{suffix}"));
    create_dir_all(&path).unwrap();
    path
  }
}
