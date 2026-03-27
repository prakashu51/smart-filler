(function initSmartFillerLegacyEngine(global) {
  function run(fillSettings, report) {
    console.log("Content script loaded");
    console.log("Using fill settings:", fillSettings);

    if (typeof faker === "undefined") {
      console.error("Faker.js not loaded!");
      if (report) {
        report.notes.push("Faker.js was not available");
      }
      return;
    }

    // Preserve current behavior for now. Locale-aware generation will move into
    // the generator module in later iterations.
    faker.locale = "en";

    function fillInput(input) {
      const type = input.type.toLowerCase();
      const name = (input.name || input.id || input.placeholder || "").toLowerCase();
      const label = input.getAttribute("aria-label") || "";

      let value = "";

      if (type === "text" || type === "search" || !type) {
        if (name.includes("first") || label.includes("first")) {
          value = faker.name.firstName();
        } else if (name.includes("last") || label.includes("last")) {
          value = faker.name.lastName();
        } else if (name.includes("name") || label.includes("name")) {
          value = faker.name.findName();
        } else if (name.includes("address") || label.includes("address")) {
          value = faker.address.streetAddress();
        } else if (name.includes("city") || label.includes("city")) {
          value = faker.address.city();
        } else if (name.includes("zip") || name.includes("pincode") || name.includes("postal")) {
          value = faker.address.zipCode();
        } else if (name.includes("company") || name.includes("organization")) {
          value = faker.company.companyName();
        } else if (name.includes("job") || name.includes("title")) {
          value = faker.name.jobTitle();
        } else {
          value = faker.name.findName();
        }
      } else if (type === "email") {
        value = faker.internet.email();
      } else if (type === "number" || name.includes("phone") || type === "tel") {
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
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      } else if (type === "radio") {
        input.checked = true;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      }

      if (value) {
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    function fillSelect(select) {
      const options = select.options;

      if (options.length > 1) {
        const randomIndex = Math.floor(Math.random() * (options.length - 1)) + 1;
        select.selectedIndex = randomIndex;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    function fillReactSelect(element) {
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
              }
            }
          }, delay);
        });
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
        buttonText.includes("português") ||
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
      if (isLanguageSelector(button)) {
        return;
      }

      // Preserve current behavior during the structural refactor.
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
                  !optionText.includes("português") &&
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
              }
            }
          }
        }, delay);
      });
    }

    const filledElements = new Set();

    function fillForm() {
      const inputs = document.querySelectorAll("input");
      const selects = document.querySelectorAll("select");
      const textareas = document.querySelectorAll("textarea");
      const reactSelects = document.querySelectorAll('[class*="react-select"], [class*="Select"]');
      const comboboxes = document.querySelectorAll('button[role="combobox"]');

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
          text.value = faker.lorem.sentences(2);
          text.dispatchEvent(new Event("input", { bubbles: true }));
          text.dispatchEvent(new Event("change", { bubbles: true }));
          filledElements.add(text);
        }
      });

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
      report.notes.push("Legacy engine executed through new Phase 1 scaffold");
    }
  }

  global.SmartFillerLegacyEngine = {
    run
  };
})(window);
