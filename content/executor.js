(function initSmartFillerExecutor(global) {
  function buildExecutionContext(fillSettings) {
    return {
      fillSettings,
      executedAt: Date.now()
    };
  }

  global.SmartFillerExecutor = {
    buildExecutionContext
  };
})(window);
