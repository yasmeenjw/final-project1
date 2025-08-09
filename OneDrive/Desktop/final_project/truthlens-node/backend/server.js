import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("../frontend")); // Frontend folder path

const PORT = process.env.PORT || 5000;
const HF_API_TOKEN = process.env.HF_API_TOKEN;
const MODEL_ID = "facebook/bart-large-mnli";

// Extended list of candidate labels
const candidateLabels = [
  "misinformation",
  "bias",
  "fallacy",
  "none",
  "confirmation bias",
  "framing effect",
  "straw man fallacy",
  "appeal to emotion",
  "hasty generalization",
  "ad hominem",
  "false dilemma"
];

app.post("/analyze", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  try {
    // Send request to Hugging Face Inference API
    const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL_ID}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          candidate_labels: candidateLabels
        },
        options: { wait_for_model: true },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.error || "Hugging Face API error" });
    }

    const data = await response.json();

    // Find the highest scoring label and its confidence score
    let maxScore = 0;
    let maxLabel = "";
    for (let i = 0; i < data.scores.length; i++) {
      if (data.scores[i] > maxScore) {
        maxScore = data.scores[i];
        maxLabel = data.labels[i];
      }
    }

    // Determine the type of bias or fallacy (use "General" if it's a broad category)
    let type = "General";

    // If the highest category is one of the detailed types (e.g., confirmation bias)
    const detailedTypes = candidateLabels.slice(4); // labels after "none", "misinformation", "bias", "fallacy"
    if (detailedTypes.includes(maxLabel)) {
      type = maxLabel;
    }

    // Simple explanation based on the category
    const explanations = {
      misinformation: "This text contains false or misleading information.",
      bias: "This text shows a biased perspective.",
      fallacy: "This text includes a logical fallacy.",
      none: "No misinformation, bias, or fallacy detected.",
      "confirmation bias": "This text reflects confirmation bias, favoring info that supports preconceptions.",
      "framing effect": "This text frames information in a way that influences perception unfairly.",
      "straw man fallacy": "This text misrepresents an argument to make it easier to attack.",
      "appeal to emotion": "This text appeals to emotions rather than facts or logic.",
      "hasty generalization": "This text draws conclusions based on insufficient evidence.",
      "ad hominem": "This text attacks a person instead of addressing the argument.",
      "false dilemma": "This text presents a situation as having only two choices, ignoring alternatives."
    };

    res.json({
      category: maxLabel,
      type,
      confidence: (maxScore * 100).toFixed(1) + "%",
      explanation: explanations[maxLabel] || "No explanation available."
    });
  } catch (error) {
    console.error("Hugging Face API error:", error);
    res.status(500).json({ error: "Error communicating with Hugging Face API" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
