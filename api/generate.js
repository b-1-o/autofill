module.exports = async function handler(
  req,
  res
) {
  const allowedOrigin =
    process.env.EXTENSION_ORIGIN ||
    "*";

  res.setHeader(
    "Access-Control-Allow-Origin",
    allowedOrigin
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

    const skills =
      profile.skills ||
      "React, TypeScript, JavaScript, Next.js, and frontend development";

    /*
     * STUB:
     * Replace this block with a real OpenAI API call.
     *
     * Keep the OpenAI key on Vercel as an environment variable.
     * Never ship an OpenAI API key inside the Chrome extension.
     *
     * Example future shape:
     *
     * const openai = new OpenAI({
     *   apiKey: process.env.OPENAI_API_KEY
     * });
     *
     * const response = await openai.responses.create({
     *   model: "gpt-5",
     *   input: [...]
     * });
     *
     * return res.json({
     *   answer: response.output_text
     * });
     */

    const answer =
      `Based on my experience with ${skills}, I would bring a practical frontend focus, strong UI engineering habits, and experience shipping responsive web applications. I am particularly interested in this role because it aligns with the technologies and product work described in the application.`;

    return res
      .status(200)
      .json({
        answer,
        stub: true
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
          "Failed to generate draft"
      });
  }
};
