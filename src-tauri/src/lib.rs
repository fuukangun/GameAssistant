mod saves;

#[tauri::command]
fn scan_saves(custom_path: Option<String>) -> Result<Vec<saves::SaveEntry>, String> {
  let path = custom_path
    .map(std::path::PathBuf::from)
    .or_else(saves::default_stardew_save_path)
    .ok_or_else(|| "无法定位用户主目录，请手动选择存档目录。".to_string())?;

  saves::scan_saves_in_directory(&path)
}

#[tauri::command]
fn read_save_file(save_path: String) -> Result<saves::SaveFileContent, String> {
  saves::read_main_save_file(&std::path::PathBuf::from(save_path))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    .invoke_handler(tauri::generate_handler![scan_saves, read_save_file])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
