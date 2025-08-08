document.addEventListener("DOMContentLoaded", () => {
    const analyzeBtn = document.getElementById("analyzeBtn");
    const inputText = document.getElementById("inputText");
    const resultEl = document.getElementById("result");
  
    analyzeBtn.addEventListener("click", async () => {
      const text = inputText.value.trim();
      if (!text) {
        alert("Please enter some text to analyze.");
        return;
      }
  
      resultEl.textContent = "Analyzing...";
  
      try {
        const response = await fetch("/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          resultEl.textContent = `Error: ${errorData.error || "Unknown error"}`;
          return;
        }
  
        const data = await response.json();
  
        resultEl.textContent = `Category: ${data.category}
  Type: ${data.type}
  Confidence: ${data.confidence}
  Explanation: ${data.explanation}`;
      } catch (error) {
        resultEl.textContent = "Error communicating with server.";
        console.error(error);
      }
    });
  });
  