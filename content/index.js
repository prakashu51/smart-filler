(function startSmartFiller(global) {
  if (!global.SmartFillerEngine || typeof global.SmartFillerEngine.run !== "function") {
    console.error("Smart Filler engine is not ready.");
    return;
  }

  global.SmartFillerEngine.run().catch((error) => {
    console.error("Smart Filler failed to run:", error);
  });
})(window);
