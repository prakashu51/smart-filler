(function initSmartFillerDetector(global) {
  function normalizeText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function toLowerText(value) {
    return normalizeText(value).toLowerCase();
  }

  function getAssociatedLabel(element) {
    if (!element) {
      return "";
    }

    const labels = [];

    if (element.id) {
      const explicitLabel = document.querySelector(`label[for="${element.id}"]`);
      if (explicitLabel) {
        labels.push(explicitLabel.textContent);
      }
    }

    const wrappedLabel = element.closest("label");
    if (wrappedLabel) {
      labels.push(wrappedLabel.textContent);
    }

    const nearbyLabel = element
      .closest(".field, .form-group, [role='group'], [data-field], td, th, section, article, form")
      ?.querySelector("label");

    if (nearbyLabel) {
      labels.push(nearbyLabel.textContent);
    }

    return normalizeText(labels.filter(Boolean).join(" "));
  }

  function getDescribedByText(element) {
    const describedBy = element.getAttribute("aria-describedby");

    if (!describedBy) {
      return "";
    }

    return normalizeText(
      describedBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent || "")
        .join(" ")
    );
  }

  function isVisible(element) {
    if (!element || element.type === "hidden" || element.hidden) {
      return false;
    }

    if (element.closest("[hidden],[aria-hidden='true']")) {
      return false;
    }

    const style = global.getComputedStyle(element);

    return style.display !== "none" && style.visibility !== "hidden";
  }

  function getPathHint(element) {
    const segments = [];
    let current = element;

    while (current && current !== document.body && segments.length < 4) {
      const part = [
        current.tagName ? current.tagName.toLowerCase() : "",
        current.id ? `#${current.id}` : "",
        current.getAttribute && current.getAttribute("name")
          ? `[name="${current.getAttribute("name")}"]`
          : ""
      ]
        .join("")
        .trim();

      if (part) {
        segments.unshift(part);
      }

      current = current.parentElement;
    }

    return segments.join(" > ");
  }

  function getOptionMetadata(element) {
    if (!element.matches("select")) {
      return [];
    }

    return Array.from(element.options).map((option, index) => ({
      index,
      value: option.value,
      text: normalizeText(option.textContent),
      disabled: option.disabled
    }));
  }

  function getElementType(element) {
    if (element.matches("textarea")) {
      return "textarea";
    }

    if (element.matches("select")) {
      return "select";
    }

    if (element.matches("input")) {
      return "input";
    }

    if (element.isContentEditable) {
      return "contenteditable";
    }

    return "unknown";
  }

  function collectCandidateElements() {
    return Array.from(
      document.querySelectorAll("input, select, textarea, [contenteditable='true']")
    );
  }

  function createFieldModel(element, index) {
    const label = getAssociatedLabel(element);
    const placeholder = normalizeText(element.getAttribute("placeholder"));
    const ariaLabel = normalizeText(element.getAttribute("aria-label"));
    const name = normalizeText(element.getAttribute("name"));
    const id = normalizeText(element.id);
    const autocomplete = normalizeText(element.getAttribute("autocomplete"));
    const describedBy = getDescribedByText(element);
    const pathHint = getPathHint(element);

    return {
      id: id || name || `field_${index}`,
      element,
      index,
      elementType: getElementType(element),
      componentKind: element.isContentEditable ? "contenteditable" : getElementType(element),
      inputType: (element.type || "").toLowerCase(),
      name,
      label,
      placeholder,
      ariaLabel,
      describedBy,
      autocomplete,
      role: normalizeText(element.getAttribute("role")),
      required: !!element.required || element.getAttribute("aria-required") === "true",
      disabled: !!element.disabled,
      readOnly: !!element.readOnly,
      visible: isVisible(element),
      options: getOptionMetadata(element),
      pathHint,
      currentValue: element.matches("input, textarea, select")
        ? element.value
        : normalizeText(element.textContent),
      textSignals: toLowerText(
        [label, name, id, placeholder, ariaLabel, describedBy, autocomplete, pathHint].join(" ")
      )
    };
  }

  function detectFields() {
    return collectCandidateElements().map(createFieldModel);
  }

  function createFieldSnapshot(fields) {
    const sourceFields = fields || detectFields();

    return {
      total: sourceFields.length,
      inputs: sourceFields.filter((field) => field.elementType === "input").length,
      selects: sourceFields.filter((field) => field.elementType === "select").length,
      textareas: sourceFields.filter((field) => field.elementType === "textarea").length,
      contenteditables: sourceFields.filter((field) => field.elementType === "contenteditable").length,
      customComboboxes: document.querySelectorAll('button[role="combobox"]').length,
      reactSelects: document.querySelectorAll('[class*="react-select"], [class*="Select"]').length
    };
  }

  global.SmartFillerDetector = {
    detectFields,
    isVisible,
    createFieldSnapshot
  };
})(window);
