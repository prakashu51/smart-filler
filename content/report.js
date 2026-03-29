(function initSmartFillerReport(global) {
  function createFieldLabel(field) {
    return field.label || field.name || field.id || field.pathHint || "unknown";
  }

  function pushDetail(report, entry) {
    if (report.details.length < global.SmartFillerConstants.DETAIL_LOG_LIMIT) {
      report.details.push(entry);
    }
  }

  function createInitialReport(fillSettings, snapshot) {
    return {
      engineVersion: global.SmartFillerConstants.ENGINE_VERSION,
      fillSettings,
      snapshot,
      timestamp: new Date().toISOString(),
      filled: 0,
      skipped: 0,
      lowConfidence: 0,
      notes: ["Phase 1 modular engine run"],
      details: []
    };
  }

  function recordFilled(report, field, value, mapping) {
    report.filled += 1;
    pushDetail(report, {
      status: "filled",
      field: createFieldLabel(field),
      fieldType: mapping.fieldType,
      confidence: mapping.confidence,
      valuePreview: typeof value === "string" ? value.slice(0, 40) : value
    });
  }

  function recordSkipped(report, field, reason, mapping) {
    report.skipped += 1;
    pushDetail(report, {
      status: "skipped",
      field: createFieldLabel(field),
      reason,
      fieldType: mapping ? mapping.fieldType : null,
      confidence: mapping ? mapping.confidence : null
    });
  }

  function recordLowConfidence(report, field, mapping) {
    report.lowConfidence += 1;
    pushDetail(report, {
      status: "low_confidence",
      field: createFieldLabel(field),
      fieldType: mapping.fieldType,
      confidence: mapping.confidence,
      reasons: mapping.reasons
    });
  }

  function addNote(report, note) {
    report.notes.push(note);
  }

  global.SmartFillerReport = {
    createInitialReport,
    recordFilled,
    recordSkipped,
    recordLowConfidence,
    addNote
  };
})(window);
