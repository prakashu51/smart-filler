(function initSmartFillerReport(global) {
  function createFieldLabel(field) {
    return field.label || field.name || field.id || field.pathHint || "unknown";
  }

  function createFieldKey(field, mapping) {
    return [
      field.pathHint || "",
      field.id || "",
      field.name || "",
      field.label || "",
      mapping && mapping.fieldType ? mapping.fieldType : "",
      typeof field.index === "number" ? field.index : ""
    ].join("|");
  }

  function ensureTracking(report) {
    if (!report._fieldOutcomes) {
      report._fieldOutcomes = {};
    }
  }

  function applyOutcome(report, field, mapping, nextStatus) {
    ensureTracking(report);

    const key = createFieldKey(field, mapping);
    const previousStatus = report._fieldOutcomes[key];

    if (previousStatus === nextStatus) {
      return false;
    }

    if (previousStatus && typeof report[previousStatus] === "number") {
      report[previousStatus] = Math.max(0, report[previousStatus] - 1);
    }

    if (typeof report[nextStatus] === "number") {
      report[nextStatus] += 1;
    }

    report._fieldOutcomes[key] = nextStatus;
    return true;
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
    if (!applyOutcome(report, field, mapping, "filled")) {
      return;
    }

    pushDetail(report, {
      status: "filled",
      field: createFieldLabel(field),
      fieldType: mapping.fieldType,
      confidence: mapping.confidence,
      valuePreview: typeof value === "string" ? value.slice(0, 40) : value
    });
  }

  function recordSkipped(report, field, reason, mapping) {
    if (!applyOutcome(report, field, mapping, "skipped")) {
      return;
    }

    pushDetail(report, {
      status: "skipped",
      field: createFieldLabel(field),
      reason,
      fieldType: mapping ? mapping.fieldType : null,
      confidence: mapping ? mapping.confidence : null
    });
  }

  function recordLowConfidence(report, field, mapping) {
    if (!applyOutcome(report, field, mapping, "lowConfidence")) {
      return;
    }

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
