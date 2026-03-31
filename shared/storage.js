(function initSmartFillerStorage(global) {
  const STORAGE_KEYS = {
    fillSettings: "fillSettings",
    legacySelectedLocale: "selectedLocale",
    lastRunReport: "lastRunReport"
  };

  function getLocalStorageValue(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => resolve(result));
    });
  }

  function setLocalStorageValue(values) {
    return new Promise((resolve) => {
      chrome.storage.local.set(values, () => resolve());
    });
  }

  async function getFillSettings() {
    const result = await getLocalStorageValue([
      STORAGE_KEYS.fillSettings,
      STORAGE_KEYS.legacySelectedLocale
    ]);

    const merged = Object.assign(
      {},
      result[STORAGE_KEYS.fillSettings] || {}
    );

    if (result[STORAGE_KEYS.legacySelectedLocale] && !merged.selectedLocale) {
      merged.selectedLocale = result[STORAGE_KEYS.legacySelectedLocale];
    }

    return global.SmartFillerConfig.normalizeFillSettings(merged);
  }

  async function saveFillSettings(nextSettings) {
    const normalized = global.SmartFillerConfig.normalizeFillSettings(nextSettings);
    const legacySelectedLocale =
      normalized.region === "IN" ? "en_IND" : "en";

    await setLocalStorageValue({
      [STORAGE_KEYS.fillSettings]: normalized,
      [STORAGE_KEYS.legacySelectedLocale]: legacySelectedLocale
    });

    return normalized;
  }

  async function saveLastRunReport(report) {
    const sanitizedReport = Object.keys(report || {}).reduce((nextReport, key) => {
      if (!key.startsWith("_")) {
        nextReport[key] = report[key];
      }

      return nextReport;
    }, {});

    await setLocalStorageValue({
      [STORAGE_KEYS.lastRunReport]: sanitizedReport
    });
  }

  async function getLastRunReport() {
    const result = await getLocalStorageValue([STORAGE_KEYS.lastRunReport]);
    return result[STORAGE_KEYS.lastRunReport] || null;
  }

  global.SmartFillerStorage = {
    STORAGE_KEYS,
    getFillSettings,
    saveFillSettings,
    saveLastRunReport,
    getLastRunReport
  };
})(window);
