(function initSmartFillerConstants(global) {
  global.SmartFillerConstants = {
    ENGINE_VERSION: "phase1-complete",
    DYNAMIC_RETRY_DELAYS_MS: [500, 3000, 5000],
    OBSERVER_DEBOUNCE_MS: 250,
    OBSERVER_RUNTIME_MS: 12000,
    LOW_CONFIDENCE_THRESHOLD: 0.45,
    DETAIL_LOG_LIMIT: 100
  };
})(window);
