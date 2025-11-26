// background.js
// Service worker basico: escucha cambios de pestañas y puede usarse para guardar prefs.

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ mer_config: { maxSentences: 4 }});
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // si la pestaña se recarga, podriamos enviar un mensaje (por ahora no hacemos nada)
});
