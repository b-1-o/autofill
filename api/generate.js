module.exports = async function handler(
  req,
  res
) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({
        error: "Method not allowed"
      });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const {
      question = "",
      jobDescription = "",
      profile = {}
    } = body;

    if (
      typeof question !== "string" ||
      typeof jobDescription !== "string" ||
      typeof profile !== "object" ||
      profile === null
    ) {
      return res
        .status(400)
        .json({
          error: "Invalid request body"
        });
    }

    /*
     * PLACEHOLDER ONLY.
     *
     * Replace this response with the real OpenAI fetch.
     * Keep the OpenAI API key in Vercel environment variables.
     * Never put the API key inside the Chrome extension.
     *
     * Insert the real request here:
     *
     * const response = await fetch(
     *   "https://api.openai.com/v1/responses",
     *   {
     *     method: "POST",
     *     headers: {
     *       "Authorization":
     *         "Bearer " + process.env.OPENAI_API_KEY,
     *       "Content-Type": "application/json"
     *     },
     *     body: JSON.stringify(...)
     *   }
     * );
     *
     * const data = await response.json();
     * return res.status(200).json({
     *   answer: data.output_text
     * });
     */

    void question;
    void jobDescription;
    void profile;

    return res
      .status(200)
      .json({
        answer:
          "AI endpoint placeholder. Connect OpenAI API here."
      });
  } catch (error) {
    console.error(
      "Generate function error:",
      error
    );

    return res
      .status(500)
      .json({
        error:
          "Failed to generate cover letter"
      });
  }
};
