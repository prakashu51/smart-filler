(function initSmartFillerObserver(global) {
  function createObserverPlaceholder() {
    return {
      status: "not_started"
    };
  }

  global.SmartFillerObserver = {
    createObserverPlaceholder
  };
})(window);
