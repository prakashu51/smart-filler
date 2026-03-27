(function initSmartFillerDetector(global) {
  function createFieldSnapshot() {
    return {
      inputs: document.querySelectorAll("input").length,
      selects: document.querySelectorAll("select").length,
      textareas: document.querySelectorAll("textarea").length,
      comboboxes: document.querySelectorAll('button[role="combobox"]').length
    };
  }

  global.SmartFillerDetector = {
    createFieldSnapshot
  };
})(window);
