document.getElementById("fillBtn").addEventListener("click", async () => {
  try {
    const selectedLocale = document.getElementById("locale").value;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.storage.local.set({ selectedLocale });
    
    // Inject faker.js first
    console.log('Injecting faker.js...');
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["faker.min.js"]
    });
    
    // Then inject content script
    console.log('Injecting content.js...');
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
    
    console.log('Scripts injected successfully');
    
    window.close();
  } catch (error) {
    console.error('Extension error:', error);
    alert('Error: Make sure you have faker.min.js file in the extension folder');
  }
});

// Load last selected locale
chrome.storage.local.get("selectedLocale", (data) => {
  if (data.selectedLocale) {
    document.getElementById("locale").value = data.selectedLocale;
  }
});
