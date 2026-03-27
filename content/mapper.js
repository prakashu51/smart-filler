(function initSmartFillerMapper(global) {
  function mapFields() {
    return {
      mappedFields: [],
      lowConfidenceFields: []
    };
  }

  global.SmartFillerMapper = {
    mapFields
  };
})(window);
