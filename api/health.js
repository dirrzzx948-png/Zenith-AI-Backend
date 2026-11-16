export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  return res.status(200).json({
    ok: true,
    service: "Zenith AI API",
    configured: Boolean(process.env.GEMINI_API_KEY),
    model: "gemini-3.8-flash",
    region: "sin1"
  });
}
