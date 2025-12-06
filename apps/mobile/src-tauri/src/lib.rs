use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HistoryEntry {
    pub url: String,
    pub title: String,
    pub timestamp: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Credential {
    pub id: String,
    pub domain: String,
    pub username: String,
}

/// Called by iOS Safari Extension to report page navigation
#[tauri::command]
pub fn report_history(app: AppHandle, entry: HistoryEntry) -> Result<(), String> {
    app.emit("safari-history", entry)
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Called by Android Autofill Service to get credentials for a domain
#[tauri::command]
pub fn get_credentials(_domain: String) -> Vec<Credential> {
    // In a real app, this would query secure storage
    // For now, return empty vec as a demo
    vec![]
}

/// Called by Android Autofill Service to save a new credential
#[tauri::command]
pub fn save_credential(credential: Credential) -> Result<(), String> {
    // In a real app, this would save to secure storage
    println!("Saving credential for domain: {}", credential.domain);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            report_history,
            get_credentials,
            save_credential
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
