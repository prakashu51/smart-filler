(function initSmartFillerEngine(global) {
  function executeFillCycle(context) {
    const fields = global.SmartFillerDetector.detectFields();
    const mappings = global.SmartFillerMapper.mapFields(fields);

    if (!context.report.snapshot) {
      context.report.snapshot = global.SmartFillerDetector.createFieldSnapshot(fields);
    }

    global.SmartFillerExecutor.executeMappings(mappings.mappedFields, context.executionContext);
  }

  async function run() {
    const fillSettings = await global.SmartFillerStorage.getFillSettings();
    const fields = global.SmartFillerDetector.detectFields();
    const snapshot = global.SmartFillerDetector.createFieldSnapshot(fields);
    const report = global.SmartFillerReport.createInitialReport(fillSettings, snapshot);
    const generationContext = global.SmartFillerGenerator.createGenerationContext(fillSettings);
    const executionContext = global.SmartFillerExecutor.buildExecutionContext(
      fillSettings,
      generationContext,
      report
    );
    const context = {
      report,
      executionContext
    };
    const observer = global.SmartFillerObserver.createObserver({
      debounceMs: global.SmartFillerConstants.OBSERVER_DEBOUNCE_MS,
      runtimeMs: global.SmartFillerConstants.OBSERVER_RUNTIME_MS,
      onChange() {
        executeFillCycle(context);
      }
    });

    executeFillCycle(context);
    global.SmartFillerReport.setLifecycle(report, {
      status: "running",
      phase: "initial_fill_complete"
    });
    await global.SmartFillerStorage.saveLastRunReport(report);
    observer.start();

    if (
      (snapshot.customComboboxes > 0 || snapshot.reactSelects > 0) &&
      global.SmartFillerLegacyEngine &&
      typeof global.SmartFillerLegacyEngine.run === "function"
    ) {
      global.SmartFillerReport.addNote(report, "Legacy fallback enabled for custom control support.");
      await global.SmartFillerLegacyEngine.run(fillSettings, report, { customOnly: true });
      global.SmartFillerReport.setLifecycle(report, {
        status: "running",
        phase: "custom_control_fallback_complete"
      });
      await global.SmartFillerStorage.saveLastRunReport(report);
    }

    if (snapshot.reactSelects > 0) {
      global.SmartFillerReport.addNote(report, "React select controls detected.");
    }

    await new Promise((resolve) => {
      global.setTimeout(() => {
        observer.disconnect();
        resolve();
      }, global.SmartFillerConstants.OBSERVER_RUNTIME_MS + 100);
    });

    global.SmartFillerReport.setLifecycle(report, {
      status: "completed",
      phase: "finalized"
    });
    await global.SmartFillerStorage.saveLastRunReport(report);
  }

  global.SmartFillerEngine = {
    run
  };
})(window);
