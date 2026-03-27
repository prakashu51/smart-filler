(function initSmartFillerGenerator(global) {
  function createGenerationContext(fillSettings) {
    return {
      locale: fillSettings.locale,
      language: fillSettings.language,
      region: fillSettings.region
    };
  }

  global.SmartFillerGenerator = {
    createGenerationContext
  };
})(window);
