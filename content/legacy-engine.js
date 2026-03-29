(function initSmartFillerLegacyEngine(global) {
  function run(fillSettings, report, options) {
    const executionOptions = options || {};

    console.log("Content script loaded");
    console.log("Using fill settings:", fillSettings);

    if (typeof faker === "undefined") {
      console.error("Faker.js not loaded!");
      if (report) {
        report.notes.push("Faker.js was not available");
      }
      return;
    }

    const fakerLocale = fillSettings && fillSettings.region === "IN" ? "en_IND" : "en";
    faker.locale = fakerLocale;

    const filledElements = new Set();
    const radioGroups = new Set();

    function incrementReport(key) {
      if (report && typeof report[key] === "number") {
        report[key] += 1;
      }
    }

    function dispatchFieldEvents(element) {
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function isVisible(element) {
      if (!element || element.type === "hidden") {
        return false;
      }

      const style = global.getComputedStyle(element);

      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        !element.hidden &&
        !element.closest("[hidden],[aria-hidden='true']")
      );
    }

    function isFillable(element) {
      return !!element && !element.disabled && !element.readOnly && isVisible(element);
    }

    function getFieldHint(element) {
      const labelFromFor = element.id
        ? document.querySelector(`label[for="${element.id}"]`)?.textContent || ""
        : "";
      const wrappedLabel = element.closest("label")?.textContent || "";
      const nearbyLabel =
        element.closest(".field, .form-group, [role='group']")?.querySelector("label")?.textContent || "";
      const ariaLabel = element.getAttribute("aria-label") || "";
      const placeholder = element.getAttribute("placeholder") || "";
      const describedById = element.getAttribute("aria-describedby");
      const describedBy = describedById
        ? document.getElementById(describedById)?.textContent || ""
        : "";
      const identifier = [element.name, element.id].filter(Boolean).join(" ");

      return [
        labelFromFor,
        wrappedLabel,
        nearbyLabel,
        ariaLabel,
        placeholder,
        describedBy,
        identifier
      ]
        .join(" ")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    }

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

    function fillInput(input) {
      if (!isFillable(input) || hasUserValue(input)) {
        incrementReport("skipped");
        return;
      }

      const type = input.type.toLowerCase();
      const hint = getFieldHint(input);
      let value = "";

      if (["button", "submit", "reset", "image", "file", "hidden"].includes(type)) {
        incrementReport("skipped");
        return;
      }

      if (type === "text" || type === "search" || !type) {
        if (hint.includes("first")) {
          value = faker.name.firstName();
        } else if (hint.includes("last")) {
          value = faker.name.lastName();
        } else if (hint.includes("full name") || hint.includes("name")) {
          value = faker.name.findName();
        } else if (hint.includes("address")) {
          value = faker.address.streetAddress();
        } else if (hint.includes("city")) {
          value = faker.address.city();
        } else if (
          hint.includes("zip") ||
          hint.includes("postal") ||
          hint.includes("pincode")
        ) {
          value = faker.address.zipCode();
        } else if (
          hint.includes("company") ||
          hint.includes("organization") ||
          hint.includes("employer")
        ) {
          value = faker.company.companyName();
        } else if (
          hint.includes("job") ||
          hint.includes("title") ||
          hint.includes("role")
        ) {
          value = faker.name.jobTitle();
        } else if (
          hint.includes("website") ||
          hint.includes("site") ||
          hint.includes("url")
        ) {
          value = faker.internet.url();
        } else if (hint.includes("email")) {
          value = faker.internet.email();
        } else if (
          hint.includes("phone") ||
          hint.includes("mobile") ||
          hint.includes("contact")
        ) {
          value = faker.phone.phoneNumber("##########");
        } else {
          value = faker.name.findName();
        }
      } else if (type === "email") {
        value = faker.internet.email();
      } else if (type === "number") {
        const parsedMin = Number(input.min);
        const parsedMax = Number(input.max);
        const min = Number.isFinite(parsedMin) ? parsedMin : 1;
        const max = Number.isFinite(parsedMax) ? parsedMax : Math.max(min + 1000, 9999);
        value = faker.datatype.number({ min, max }).toString();
      } else if (type === "tel") {
        value = faker.phone.phoneNumber("##########");
      } else if (type === "password") {
        value = faker.internet.password(10);
      } else if (type === "date") {
        value = faker.date.past(20).toISOString().split("T")[0];
      } else if (type === "datetime-local") {
        value = faker.date.past(5).toISOString().slice(0, 16);
      } else if (type === "time") {
        value = faker.date.recent().toTimeString().slice(0, 5);
      } else if (type === "url") {
        value = faker.internet.url();
      } else if (type === "color") {
        value = faker.internet.color();
      } else if (type === "range") {
        const min = parseInt(input.min, 10) || 0;
        const max = parseInt(input.max, 10) || 100;
        value = Math.floor(Math.random() * (max - min + 1)) + min;
      } else if (type === "checkbox") {
        input.checked = Math.random() > 0.5;
        dispatchFieldEvents(input);
        incrementReport("filled");
        return;
      } else if (type === "radio") {
        const groupKey = input.name || input.id;

        if (!groupKey || radioGroups.has(groupKey)) {
          incrementReport("skipped");
          return;
        }

        radioGroups.add(groupKey);
        input.checked = true;
        dispatchFieldEvents(input);
        incrementReport("filled");
        return;
      }

      if (value) {
        input.value = value;
        dispatchFieldEvents(input);
        incrementReport("filled");
      } else {
        incrementReport("skipped");
      }
    }

    function fillSelect(select) {
      if (!isFillable(select) || hasUserValue(select)) {
        incrementReport("skipped");
        return;
      }

      const validOptions = Array.from(select.options).filter((option, index) => {
        if (index === 0 || option.disabled) {
          return false;
        }

        const text = option.textContent.trim().toLowerCase();
        return text !== "" && !text.startsWith("select");
      });

      if (validOptions.length === 0) {
        incrementReport("skipped");
        return;
      }

      const selectedOption = validOptions[Math.floor(Math.random() * validOptions.length)];
      select.value = selectedOption.value;
      dispatchFieldEvents(select);
      incrementReport("filled");
    }

    function fillReactSelect(element) {
      if (!isVisible(element)) {
        incrementReport("skipped");
        return;
      }

      const reactSelectControl =
        element.querySelector(".react-select__control") ||
        element.querySelector('[class*="select__control"]') ||
        element.querySelector('[class*="Select-control"]');

      if (
        reactSelectControl &&
        !reactSelectControl.classList.contains("react-select__control--is-disabled")
      ) {
        reactSelectControl.focus();
        reactSelectControl.click();

        [300, 800, 1500].forEach((delay) => {
          setTimeout(() => {
            const menu =
              document.querySelector(".react-select__menu") ||
              document.querySelector('[class*="select__menu"]') ||
              document.querySelector('[class*="Select-menu"]');

            if (menu && menu.style.display !== "none") {
              const options =
                menu.querySelectorAll(".react-select__option:not(.react-select__option--is-disabled)") ||
                menu.querySelectorAll('[class*="select__option"]:not([class*="disabled"])');

              if (options.length > 0) {
                const randomIndex = Math.floor(Math.random() * options.length);
                options[randomIndex].click();
                incrementReport("filled");
              }
            }
          }, delay);
        });
      } else {
        incrementReport("skipped");
      }
    }

    function isLanguageSelector(button) {
      const buttonText = button.textContent.toLowerCase().trim();
      const buttonId = (button.id || "").toLowerCase();
      const buttonClass = (button.className || "").toLowerCase();

      return (
        buttonText === "en" ||
        buttonText === "pt" ||
        buttonText === "es" ||
        buttonText.includes("english") ||
        buttonText.includes("portuguÃªs") ||
        buttonText.includes("language") ||
        buttonText.includes("idioma") ||
        buttonId.includes("language") ||
        buttonId.includes("locale") ||
        buttonClass.includes("language") ||
        buttonClass.includes("locale") ||
        ((button.closest("header") || button.closest("nav")) &&
          (buttonText.length <= 3 || buttonText.includes("lang")))
      );
    }

    function fillCustomCombobox(button) {
      if (!isFillable(button) || isLanguageSelector(button) || hasUserValue(button)) {
        incrementReport("skipped");
        return;
      }

      const label = button.closest("div").previousElementSibling?.textContent || "";
      const isSurgicalPhase = label.toLowerCase().includes("surgical phase");

      button.click();

      [500, 1000, 1500].forEach((delay) => {
        setTimeout(() => {
          const dropdown =
            document.querySelector('[role="listbox"]') ||
            document.querySelector("[data-radix-popper-content-wrapper]") ||
            document.querySelector('[class*="dropdown"]') ||
            document.querySelector('[class*="menu"]') ||
            document.querySelector('[class*="popover"]');

          if (dropdown && dropdown.style.display !== "none") {
            const options =
              dropdown.querySelectorAll('[role="option"]') ||
              dropdown.querySelectorAll("div[data-value]") ||
              dropdown.querySelectorAll("li") ||
              dropdown.querySelectorAll('[class*="item"]');

            if (options.length > 0) {
              const safeOptions = Array.from(options).filter((option) => {
                const optionText = option.textContent.toLowerCase().trim();

                return (
                  !optionText.includes("english") &&
                  !optionText.includes("portuguÃªs") &&
                  !optionText.includes("language") &&
                  !optionText.includes("idioma") &&
                  optionText !== "en" &&
                  optionText !== "pt" &&
                  optionText !== "es" &&
                  optionText !== ""
                );
              });

              if (safeOptions.length > 0) {
                const selectedOption = isSurgicalPhase
                  ? safeOptions.find((option) =>
                      option.textContent.toLowerCase().includes("surgery with x-guide")
                    ) || safeOptions[3] || safeOptions[0]
                  : safeOptions[0];

                selectedOption.click();
                incrementReport("filled");
              }
            }
          }
        }, delay);
      });
    }

    function fillTextarea(textarea) {
      if (!isFillable(textarea) || hasUserValue(textarea)) {
        incrementReport("skipped");
        return;
      }

      textarea.value = faker.lorem.sentences(2);
      dispatchFieldEvents(textarea);
      incrementReport("filled");
    }

    function fillContentEditable(element) {
      if (!isFillable(element) || hasUserValue(element)) {
        incrementReport("skipped");
        return;
      }

      element.textContent = faker.lorem.sentences(2);
      dispatchFieldEvents(element);
      incrementReport("filled");
    }

    function fillForm() {
      const reactSelects = document.querySelectorAll('[class*="react-select"], [class*="Select"]');
      const comboboxes = document.querySelectorAll('button[role="combobox"]');

      if (!executionOptions.customOnly) {
        const inputs = document.querySelectorAll("input");
        const selects = document.querySelectorAll("select");
        const textareas = document.querySelectorAll("textarea");
        const contentEditables = document.querySelectorAll('[contenteditable="true"]');

        inputs.forEach((input) => {
          if (!filledElements.has(input)) {
            fillInput(input);
            filledElements.add(input);
          }
        });

        selects.forEach((select) => {
          if (!filledElements.has(select)) {
            fillSelect(select);
            filledElements.add(select);
          }
        });

        textareas.forEach((text) => {
          if (!filledElements.has(text)) {
            fillTextarea(text);
            filledElements.add(text);
          }
        });

        contentEditables.forEach((element) => {
          if (!filledElements.has(element)) {
            fillContentEditable(element);
            filledElements.add(element);
          }
        });
      }

      reactSelects.forEach((element) => {
        if (!filledElements.has(element)) {
          fillReactSelect(element);
          filledElements.add(element);
        }
      });

      comboboxes.forEach((button) => {
        if (!filledElements.has(button)) {
          fillCustomCombobox(button);
          filledElements.add(button);
        }
      });

    }

    global.SmartFillerConstants.DYNAMIC_RETRY_DELAYS_MS.forEach((delay) => {
      setTimeout(fillForm, delay);
    });

    if (report) {
      report.notes.push(
        `Legacy engine executed as ${executionOptions.customOnly ? "custom-control fallback" : "full fallback"} using faker locale ${fakerLocale}`
      );
    }

    const finalRetryDelay = Math.max.apply(null, global.SmartFillerConstants.DYNAMIC_RETRY_DELAYS_MS);
    const asyncSelectionBufferMs = 1800;

    return new Promise((resolve) => {
      setTimeout(resolve, finalRetryDelay + asyncSelectionBufferMs);
    });
  }

  global.SmartFillerLegacyEngine = {
    run
  };
})(window);
