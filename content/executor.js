(function initSmartFillerExecutor(global) {
  function hasUserValue(element) {
    if (element.matches("input, textarea")) {
      if (element.type === "checkbox" || element.type === "radio") {
        return element.checked;
      }

      return typeof element.value === "string" && element.value.trim() !== "";
    }

    if (element.matches("select")) {
      return element.selectedIndex > 0 || !!element.value;
    }

    if (element.isContentEditable) {
      return element.textContent.trim() !== "";
    }

    return false;
  }

  function dispatchFieldEvents(element) {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function chooseSelectableOption(field) {
    const validOptions = field.options.filter((option, index) => {
      if (index === 0 || option.disabled) {
        return false;
      }

      const text = option.text.toLowerCase();
      return text !== "" && !text.startsWith("select");
    });

    if (validOptions.length === 0) {
      return null;
    }

    return validOptions[Math.floor(Math.random() * validOptions.length)];
  }

  function buildExecutionContext(fillSettings, generationContext, report) {
    return {
      fillSettings,
      generationContext,
      report,
      executedAt: Date.now(),
      processedElements: new WeakSet(),
      radioGroups: new Set()
    };
  }

  function executeMapping(mapping, context) {
    const field = mapping.field;
    const element = field.element;
    const report = context.report;

    if (context.processedElements.has(element)) {
      return;
    }

    if (!field.visible) {
      global.SmartFillerReport.recordSkipped(report, field, "not_visible", mapping);
      return;
    }

    if (field.disabled) {
      global.SmartFillerReport.recordSkipped(report, field, "disabled", mapping);
      return;
    }

    if (field.readOnly) {
      global.SmartFillerReport.recordSkipped(report, field, "readonly", mapping);
      return;
    }

    if (hasUserValue(element)) {
      global.SmartFillerReport.recordSkipped(report, field, "already_filled", mapping);
      context.processedElements.add(element);
      return;
    }

    if (!mapping.confidence || mapping.fieldType === "unknown") {
      global.SmartFillerReport.recordSkipped(report, field, "unsupported", mapping);
      context.processedElements.add(element);
      return;
    }

    if (mapping.confidence < global.SmartFillerConstants.LOW_CONFIDENCE_THRESHOLD) {
      global.SmartFillerReport.recordLowConfidence(report, field, mapping);
      context.processedElements.add(element);
      return;
    }

    if (mapping.fieldType === "radio_group") {
      const groupKey = element.name || field.id;
      if (!groupKey || context.radioGroups.has(groupKey)) {
        global.SmartFillerReport.recordSkipped(report, field, "radio_group_complete", mapping);
        context.processedElements.add(element);
        return;
      }

      context.radioGroups.add(groupKey);
      element.checked = true;
      dispatchFieldEvents(element);
      global.SmartFillerReport.recordFilled(report, field, true, mapping);
      context.processedElements.add(element);
      return;
    }

    if (mapping.fieldType === "checkbox") {
      const nextValue = global.SmartFillerGenerator.generateValue({
        mapping,
        generationContext: context.generationContext
      });
      element.checked = !!nextValue;
      dispatchFieldEvents(element);
      global.SmartFillerReport.recordFilled(report, field, element.checked, mapping);
      context.processedElements.add(element);
      return;
    }

    if (mapping.fieldType === "select_choice") {
      const option = chooseSelectableOption(field);
      if (!option) {
        global.SmartFillerReport.recordSkipped(report, field, "no_options", mapping);
        return;
      }

      element.value = option.value;
      dispatchFieldEvents(element);
      global.SmartFillerReport.recordFilled(report, field, option.text, mapping);
      context.processedElements.add(element);
      return;
    }

    const generatedValue = global.SmartFillerGenerator.generateValue({
      mapping,
      generationContext: context.generationContext
    });

    if (!generatedValue && generatedValue !== false) {
      global.SmartFillerReport.recordSkipped(report, field, "no_generated_value", mapping);
      return;
    }

    if (field.elementType === "contenteditable") {
      element.textContent = generatedValue;
    } else {
      element.value = generatedValue;
    }

    dispatchFieldEvents(element);
    global.SmartFillerReport.recordFilled(report, field, generatedValue, mapping);
    context.processedElements.add(element);
  }

  function executeMappings(mappings, context) {
    (mappings || []).forEach((mapping) => executeMapping(mapping, context));
  }

  global.SmartFillerExecutor = {
    buildExecutionContext,
    executeMappings
  };
})(window);
