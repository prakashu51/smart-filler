(function initSmartFillerObserver(global) {
  function createObserver(options) {
    let timeoutId = null;
    let stopId = null;
    let activeObserver = null;

    function scheduleRun() {
      global.clearTimeout(timeoutId);
      timeoutId = global.setTimeout(() => {
        options.onChange();
      }, options.debounceMs || global.SmartFillerConstants.OBSERVER_DEBOUNCE_MS);
    }

    function disconnect() {
      if (activeObserver) {
        activeObserver.disconnect();
        activeObserver = null;
      }

      global.clearTimeout(timeoutId);
      global.clearTimeout(stopId);
    }

    function start() {
      if (!document.body || activeObserver) {
        return;
      }

      activeObserver = new MutationObserver((mutations) => {
        const hasRelevantMutation = mutations.some((mutation) => {
          return (
            mutation.type === "childList" ||
            (mutation.type === "attributes" &&
              ["class", "style", "hidden", "aria-hidden", "disabled", "value"].includes(
                mutation.attributeName
              ))
          );
        });

        if (hasRelevantMutation) {
          scheduleRun();
        }
      });

      activeObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style", "hidden", "aria-hidden", "disabled", "value"]
      });

      stopId = global.setTimeout(() => {
        disconnect();
      }, options.runtimeMs || global.SmartFillerConstants.OBSERVER_RUNTIME_MS);
    }

    return {
      status: "ready",
      start,
      disconnect
    };
  }

  global.SmartFillerObserver = {
    createObserver
  };
})(window);
