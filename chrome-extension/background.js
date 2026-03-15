chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (!tab || !tab.url) {
      console.warn("No active tab with a URL to send.");
      return;
    }

    const payload = {
      title: tab.title || "",
      url: tab.url
    };

    await fetch("http://localhost:8000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("Failed to send tab info to RecallMate backend:", error);
  }
});

