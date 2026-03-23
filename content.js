console.log('Content script loaded');
chrome.storage.local.get("selectedLocale", (data) => {
  console.log('Storage data:', data);
  const locale = data.selectedLocale || "en";
  console.log('Using locale:', locale);
  
  if (typeof faker === 'undefined') {
    console.error('Faker.js not loaded!');
    return;
  }
  
  // Force US English for consistent results
  faker.locale = "en";

  function fillInput(input) {
    const type = input.type.toLowerCase();
    const name = (input.name || input.id || input.placeholder || '').toLowerCase();
    const label = input.getAttribute('aria-label') || '';
    
    let value = '';

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
      value = faker.phone.phoneNumber('##########');
    } else if (type === "password") {
      value = faker.internet.password(10);
    } else if (type === "date") {
      value = faker.date.past(20).toISOString().split('T')[0];
    } else if (type === "datetime-local") {
      value = faker.date.past(5).toISOString().slice(0, 16);
    } else if (type === "time") {
      value = faker.date.recent().toTimeString().slice(0, 5);
    } else if (type === "url") {
      value = faker.internet.url();
    } else if (type === "color") {
      value = faker.internet.color();
    } else if (type === "range") {
      const min = parseInt(input.min) || 0;
      const max = parseInt(input.max) || 100;
      value = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (type === "checkbox") {
      input.checked = Math.random() > 0.5;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    } else if (type === "radio") {
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    
    if (value) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function fillSelect(select) {
    console.log('Filling select:', select);
    const options = select.options;
    console.log('Options found:', options.length);
    
    if (options.length > 1) {
      // Skip first option (usually "Select..." or empty)
      const randomIndex = Math.floor(Math.random() * (options.length - 1)) + 1;
      console.log('Selecting option index:', randomIndex, 'value:', options[randomIndex].text);
      select.selectedIndex = randomIndex;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function fillReactSelect(element) {
    const reactSelectControl = element.querySelector('.react-select__control') || 
                              element.querySelector('[class*="select__control"]') ||
                              element.querySelector('[class*="Select-control"]');
    
    if (reactSelectControl && !reactSelectControl.classList.contains('react-select__control--is-disabled')) {
      reactSelectControl.focus();
      reactSelectControl.click();
      
      const attempts = [300, 800, 1500];
      
      attempts.forEach((delay) => {
        setTimeout(() => {
          const menu = document.querySelector('.react-select__menu') || 
                      document.querySelector('[class*="select__menu"]') ||
                      document.querySelector('[class*="Select-menu"]');
          
          if (menu && menu.style.display !== 'none') {
            const options = menu.querySelectorAll('.react-select__option:not(.react-select__option--is-disabled)') || 
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
    const buttonId = (button.id || '').toLowerCase();
    const buttonClass = (button.className || '').toLowerCase();
    
    // Only block obvious language selectors
    return (
      // Exact matches for common language codes
      buttonText === 'en' || buttonText === 'pt' || buttonText === 'es' ||
      // Language-specific words
      buttonText.includes('english') || buttonText.includes('português') ||
      buttonText.includes('language') || buttonText.includes('idioma') ||
      // ID/class contains language terms
      buttonId.includes('language') || buttonId.includes('locale') ||
      buttonClass.includes('language') || buttonClass.includes('locale') ||
      // In header/nav areas (common for language switchers)
      (button.closest('header') || button.closest('nav')) &&
      (buttonText.length <= 3 || buttonText.includes('lang'))
    );
  }

  function fillCustomCombobox(button) {
    // STRICT: Block ALL language selectors
    if (isLanguageSelector(button)) {
      console.log('🚫 BLOCKED language selector:', button.textContent.trim(), button);
      return;
    }
    
    // Check if this is the Surgical phase dropdown
    const label = button.closest('div').previousElementSibling?.textContent || '';
    const isSurgicalPhase = label.toLowerCase().includes('surgical phase');
    
    console.log('Filling custom combobox:', button, 'Is Surgical Phase:', isSurgicalPhase);
    
    // Click to open dropdown
    button.click();
    
    // Multiple attempts with different delays for modal dropdowns
    const attempts = [500, 1000, 1500];
    
    attempts.forEach((delay, index) => {
      setTimeout(() => {
        const dropdown = document.querySelector('[role="listbox"]') ||
                        document.querySelector('[data-radix-popper-content-wrapper]') ||
                        document.querySelector('[class*="dropdown"]') ||
                        document.querySelector('[class*="menu"]') ||
                        document.querySelector('[class*="popover"]');
        
        if (dropdown && dropdown.style.display !== 'none') {
          console.log(`Dropdown found on attempt ${index + 1}:`, dropdown);
          const options = dropdown.querySelectorAll('[role="option"]') ||
                         dropdown.querySelectorAll('div[data-value]') ||
                         dropdown.querySelectorAll('li') ||
                         dropdown.querySelectorAll('[class*="item"]');
          
          console.log('Options found:', options.length);
          
          if (options.length > 0) {
            // Filter out obvious language options only
            const safeOptions = Array.from(options).filter(option => {
              const optionText = option.textContent.toLowerCase().trim();
              
              return !optionText.includes('english') && 
                     !optionText.includes('português') && 
                     !optionText.includes('language') &&
                     !optionText.includes('idioma') &&
                     optionText !== 'en' && optionText !== 'pt' && optionText !== 'es' &&
                     optionText !== '';
            });
            
            if (safeOptions.length > 0) {
              let selectedOption;
              
              if (isSurgicalPhase) {
                // For Surgical phase, look for "Surgery with X-Guide" or select index 3
                selectedOption = safeOptions.find(option => 
                  option.textContent.toLowerCase().includes('surgery with x-guide')
                ) || safeOptions[3] || safeOptions[0];
                
                console.log('Surgical phase - selecting X-Guide option:', selectedOption.textContent);
              } else {
                // For other dropdowns, select first option
                selectedOption = safeOptions[0];
                console.log('Regular dropdown - selecting first option:', selectedOption.textContent);
              }
              
              selectedOption.click();
              return; // Stop further attempts
            }
          }
        } else if (index === 0) {
          console.log('No dropdown found after clicking, will retry...');
        }
      }, delay);
    });
  }

  let filledElements = new Set();
  
  function fillForm() {
    console.log('Starting form fill...');
    
    // Get all form elements
    const inputs = document.querySelectorAll("input");
    const selects = document.querySelectorAll("select");
    const textareas = document.querySelectorAll("textarea");
    const reactSelects = document.querySelectorAll('[class*="react-select"], [class*="Select"]');
    const comboboxes = document.querySelectorAll('button[role="combobox"]');
    
    console.log('Form elements found:');
    console.log('- Inputs:', inputs.length);
    console.log('- Selects:', selects.length);
    console.log('- Textareas:', textareas.length);
    console.log('- React Selects:', reactSelects.length);
    console.log('- Custom Comboboxes:', comboboxes.length);
    
    // Fill only new elements
    inputs.forEach(input => {
      if (!filledElements.has(input)) {
        fillInput(input);
        filledElements.add(input);
      }
    });
    
    selects.forEach(select => {
      if (!filledElements.has(select)) {
        fillSelect(select);
        filledElements.add(select);
      }
    });
    
    textareas.forEach(text => {
      if (!filledElements.has(text)) {
        text.value = faker.lorem.sentences(2);
        text.dispatchEvent(new Event('input', { bubbles: true }));
        text.dispatchEvent(new Event('change', { bubbles: true }));
        filledElements.add(text);
      }
    });
    
    reactSelects.forEach(element => {
      if (!filledElements.has(element)) {
        fillReactSelect(element);
        filledElements.add(element);
      }
    });
    
    comboboxes.forEach(button => {
      if (!filledElements.has(button)) {
        fillCustomCombobox(button);
        filledElements.add(button);
      }
    });
    
    console.log('Form fill completed');
  }

  // Fill form once only
  setTimeout(fillForm, 500);
  
  // First retry for dynamic content
  setTimeout(() => {
    console.log('First retry for dynamic content...');
    fillForm();
  }, 3000);
  
  // Second retry for slow dynamic content (like Surgical phase)
  setTimeout(() => {
    console.log('Second retry for slow dynamic content...');
    fillForm();
  }, 5000);
});