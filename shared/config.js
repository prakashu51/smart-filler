(function initSmartFillerConfig(global) {
  const DEFAULT_FILL_SETTINGS = {
    locale: "en-US",
    language: "en",
    region: "US",
    mode: "fill_all"
  };

  const LEGACY_LOCALE_MAP = {
    en: {
      locale: "en-US",
      language: "en",
      region: "US"
    },
    en_IND: {
      locale: "en-IN",
      language: "en",
      region: "IN"
    }
  };

  function normalizeFillSettings(rawSettings) {
    const input = rawSettings || {};
    const legacy = LEGACY_LOCALE_MAP[input.selectedLocale] || {};

    return {
      locale: input.locale || legacy.locale || DEFAULT_FILL_SETTINGS.locale,
      language: input.language || legacy.language || DEFAULT_FILL_SETTINGS.language,
      region: input.region || legacy.region || DEFAULT_FILL_SETTINGS.region,
      mode: input.mode || DEFAULT_FILL_SETTINGS.mode
    };
  }

  global.SmartFillerConfig = {
    DEFAULT_FILL_SETTINGS,
    LEGACY_LOCALE_MAP,
    normalizeFillSettings
  };
})(window);
