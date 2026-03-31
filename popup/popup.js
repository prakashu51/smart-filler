const fillButton = document.getElementById("fillBtn");
const localeSelect = document.getElementById("locale");
const statusBanner = document.getElementById("statusBanner");
const statusTitle = document.getElementById("statusTitle");
const statusText = document.getElementById("statusText");
const reportTimestamp = document.getElementById("reportTimestamp");
const filledCount = document.getElementById("filledCount");
const skippedCount = document.getElementById("skippedCount");
const lowConfidenceCount = document.getElementById("lowConfidenceCount");
const engineVersion = document.getElementById("engineVersion");
const reportLocale = document.getElementById("reportLocale");
const snapshotSummary = document.getElementById("snapshotSummary");
const notesList = document.getElementById("notesList");
const detailsList = document.getElementById("detailsList");

function setStatus(state, title, message) {
  statusBanner.dataset.state = state;
  statusTitle.textContent = title;
  statusText.textContent = message;
}

function formatTimestamp(value) {
  if (!value) {
    return "No runs yet";
  }

  const date = new Date(value);
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatLocale(fillSettings) {
  if (!fillSettings) {
    return "-";
  }

  return `${fillSettings.locale || "-"} (${fillSettings.region || "-"})`;
}

function formatSnapshot(snapshot) {
  if (!snapshot) {
    return "-";
  }

  const values = [
    `${snapshot.inputs || 0} inputs`,
    `${snapshot.selects || 0} selects`,
    `${snapshot.textareas || 0} textareas`,
    `${snapshot.comboboxes || 0} combos`
  ];

  return values.join(" / ");
}

function renderNotes(notes) {
  notesList.innerHTML = "";

  const items = Array.isArray(notes) && notes.length > 0
    ? notes.slice(0, 4)
    : ["No notes recorded."];

  items.forEach((note) => {
    const listItem = document.createElement("li");
    listItem.textContent = note;
    notesList.appendChild(listItem);
  });
}

function formatDetailStatus(status) {
  if (status === "low_confidence") {
    return "Low Confidence";
  }

  return status ? status.replace(/_/g, " ") : "Unknown";
}

function formatDetailMeta(detail) {
  if (detail.status === "filled") {
    return detail.valuePreview
      ? `Value: ${detail.valuePreview}`
      : "Value generated";
  }

  if (detail.status === "skipped") {
    return detail.reason
      ? `Reason: ${detail.reason}`
      : "Skipped without a recorded reason";
  }

  if (detail.status === "low_confidence") {
    return Array.isArray(detail.reasons) && detail.reasons.length > 0
      ? `Signals: ${detail.reasons.join(", ")}`
      : "Confidence below the threshold";
  }

  return "";
}

function renderDetails(details) {
  detailsList.innerHTML = "";

  const items = Array.isArray(details) && details.length > 0
    ? details.slice(-6).reverse()
    : null;

  if (!items) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "No field activity recorded yet.";
    detailsList.appendChild(emptyItem);
    return;
  }

  items.forEach((detail) => {
    const listItem = document.createElement("li");

    const topLine = document.createElement("div");
    topLine.className = "detail-topline";

    const status = document.createElement("span");
    status.className = "detail-status";
    status.dataset.status = detail.status || "unknown";
    status.textContent = formatDetailStatus(detail.status);

    const type = document.createElement("span");
    type.className = "detail-type";
    type.textContent = detail.fieldType || "-";

    topLine.appendChild(status);
    topLine.appendChild(type);

    const field = document.createElement("p");
    field.className = "detail-field";
    field.textContent = detail.field || "Unknown field";

    const meta = document.createElement("p");
    meta.className = "detail-meta";
    meta.textContent = formatDetailMeta(detail);

    listItem.appendChild(topLine);
    listItem.appendChild(field);
    listItem.appendChild(meta);
    detailsList.appendChild(listItem);
  });
}

function renderReport(report) {
  if (!report) {
    reportTimestamp.textContent = "No runs yet";
    filledCount.textContent = "0";
    skippedCount.textContent = "0";
    lowConfidenceCount.textContent = "0";
    engineVersion.textContent = "-";
    reportLocale.textContent = "-";
    snapshotSummary.textContent = "-";
    renderNotes([]);
    renderDetails([]);
    return;
  }

  reportTimestamp.textContent = formatTimestamp(report.timestamp);
  filledCount.textContent = String(report.filled || 0);
  skippedCount.textContent = String(report.skipped || 0);
  lowConfidenceCount.textContent = String(report.lowConfidence || 0);
  engineVersion.textContent = report.engineVersion || "-";
  reportLocale.textContent = formatLocale(report.fillSettings);
  snapshotSummary.textContent = formatSnapshot(report.snapshot);
  renderNotes(report.notes);
  renderDetails(report.details);
}

async function waitForUpdatedReport(previousRunId) {
  const timeoutMs = 20000;

  return new Promise((resolve) => {
    let settled = false;
    let latestSeenReport = null;

    function finish(report) {
      if (settled) {
        return;
      }

      settled = true;
      chrome.storage.onChanged.removeListener(handleChange);
      window.clearTimeout(timeoutId);
      window.clearTimeout(progressId);
      resolve(report);
    }

    function isNewRun(report) {
      const runId = report.runId || report.timestamp;
      return !!runId && runId !== previousRunId;
    }

    function handleProgress(report) {
      latestSeenReport = report;
      renderReport(report);

      if (report.status === "completed") {
        setStatus(
          "success",
          "Completed",
          `Run saved with ${report.filled || 0} fields filled and ${report.skipped || 0} skipped.`
        );
        finish(report);
        return;
      }

      setStatus(
        "running",
        "Initial Fill Complete",
        "The first pass is done. Waiting for dynamic sections and the final report."
      );
    }

    function handleChange(changes, areaName) {
      if (areaName !== "local" || !changes.lastRunReport || !changes.lastRunReport.newValue) {
        return;
      }

      const nextReport = changes.lastRunReport.newValue;

      if (isNewRun(nextReport)) {
        handleProgress(nextReport);
      }
    }

    const progressId = window.setTimeout(() => {
      if (!latestSeenReport || latestSeenReport.status !== "completed") {
        setStatus(
          "running",
          "Still Finishing",
          "The form was likely filled. Waiting for the final run report from the background pass."
        );
      }
    }, 9000);

    const timeoutId = window.setTimeout(async () => {
      const latestReport = await SmartFillerStorage.getLastRunReport();

      if (latestReport && isNewRun(latestReport)) {
        if (latestReport.status === "completed") {
          renderReport(latestReport);
          setStatus(
            "success",
            "Completed",
            `Run saved with ${latestReport.filled || 0} fields filled and ${latestReport.skipped || 0} skipped.`
          );
        } else {
          renderReport(latestReport);
          setStatus(
            "running",
            "Report In Progress",
            "The latest run report arrived, but the final completion update is still pending."
          );
        }

        finish(latestReport);
        return;
      }

      finish(null);
    }, timeoutMs);

    chrome.storage.onChanged.addListener(handleChange);
  });
}

async function initializePopup() {
  const data = await new Promise((resolve) => {
    chrome.storage.local.get(["fillSettings", "selectedLocale"], (result) => resolve(result));
  });

  const normalized = SmartFillerConfig.normalizeFillSettings(
    data.fillSettings || { selectedLocale: data.selectedLocale }
  );
  localeSelect.value = normalized.region === "IN" ? "en_IND" : "en";

  const lastReport = await SmartFillerStorage.getLastRunReport();
  renderReport(lastReport);
  setStatus("ready", "Ready", "Open a page with a form and start a run.");
}

fillButton.addEventListener("click", async () => {
  fillButton.disabled = true;
  setStatus("running", "Running", "Injecting Smart Filler into the active tab.");

  try {
    const selectedLocale = localeSelect.value;
    const normalizedFillSettings = SmartFillerConfig.normalizeFillSettings({
      selectedLocale
    });
    const previousReport = await SmartFillerStorage.getLastRunReport();
    const previousRunId = previousReport ? (previousReport.runId || previousReport.timestamp) : null;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await SmartFillerStorage.saveFillSettings(normalizedFillSettings);

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: [
        "faker.min.js",
        "shared/config.js",
        "shared/storage.js",
        "content/constants.js",
        "content/detector.js",
        "content/mapper.js",
        "content/generator.js",
        "content/executor.js",
        "content/observer.js",
        "content/report.js",
        "content/legacy-engine.js",
        "content/engine.js",
        "content/index.js"
      ]
    });

    setStatus("running", "Running", "Waiting for the page run report to be saved.");

    const latestReport = await waitForUpdatedReport(previousRunId);

    if (!latestReport) {
      setStatus(
        "running",
        "Report Delayed",
        "The page likely finished filling, but the final report did not arrive before the popup timeout."
      );
    }
  } catch (error) {
    console.error("Extension error:", error);
    setStatus(
      "error",
      "Failed",
      error && error.message
        ? error.message
        : "Smart Filler could not be injected into this tab."
    );
  } finally {
    fillButton.disabled = false;
  }
});

initializePopup().catch((error) => {
  console.error("Popup initialization failed:", error);
  setStatus("error", "Failed", "Popup initialization could not read extension state.");
});
