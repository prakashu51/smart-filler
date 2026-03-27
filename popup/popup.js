document.getElementById("fillBtn").addEventListener("click", async () => {
  try {
    const selectedLocale = document.getElementById("locale").value;
    const normalizedFillSettings = SmartFillerConfig.normalizeFillSettings({
      selectedLocale
    });
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await SmartFillerStorage.saveFillSettings(normalizedFillSettings);

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: [
        "faker.min.js",
        "shared/config.js",
        "shared/storage.js",
        "content/constants.js",
        "content/detector.js",
        "content/mapper.js",
        "content/generator.js",
        "content/executor.js",
        "content/observer.js",
        "content/report.js",
        "content/legacy-engine.js",
        "content/engine.js",
        "content/index.js"
      ]
    });

    window.close();
  } catch (error) {
    console.error("Extension error:", error);
    alert("Error: Smart Filler could not be injected into this tab.");
  }
});

chrome.storage.local.get(["fillSettings", "selectedLocale"], (data) => {
  const normalized = SmartFillerConfig.normalizeFillSettings(
    data.fillSettings || { selectedLocale: data.selectedLocale }
  );
  const localeValue = normalized.region === "IN" ? "en_IND" : "en";

  document.getElementById("locale").value = localeValue;
});
