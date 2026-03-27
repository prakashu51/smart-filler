(function initSmartFillerEngine(global) {
  async function run() {
    const fillSettings = await global.SmartFillerStorage.getFillSettings();
    const snapshot = global.SmartFillerDetector.createFieldSnapshot();
    const report = global.SmartFillerReport.createInitialReport(fillSettings, snapshot);

    global.SmartFillerGenerator.createGenerationContext(fillSettings);
    global.SmartFillerMapper.mapFields();
    global.SmartFillerExecutor.buildExecutionContext(fillSettings);
    global.SmartFillerObserver.createObserverPlaceholder();

    if (global.SmartFillerLegacyEngine && typeof global.SmartFillerLegacyEngine.run === "function") {
      global.SmartFillerLegacyEngine.run(fillSettings, report);
    } else {
      console.error("Smart Filler legacy engine is unavailable.");
    }

    await global.SmartFillerStorage.saveLastRunReport(report);
  }

  global.SmartFillerEngine = {
    run
  };
})(window);
