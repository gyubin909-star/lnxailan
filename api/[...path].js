// Vercel Serverless Function: proxy ke FLORA + unduh gambar
const FLORA = "https://app.flora.ai/api/v1";

export default async function handler(req, res) {
  const KEY = process.env.FLORA_API_KEY;
  if (!KEY) return res.status(500).json({ message: "FLORA_API_KEY belum di-set di Vercel (Settings > Environment Variables)." });
  try {
    const parts = [].concat(req.query.path || []);

    if (parts[0] === "dl") {
      const u = req.query.u;
      if (!/^https:\/\//.test(u || "")) return res.status(400).send("bad url");
      const r = await fetch(u);
      res.status(r.status).setHeader("Content-Type", r.headers.get("content-type") || "image/png");
      return res.send(Buffer.from(await r.arrayBuffer()));
    }

    const search = new URL(req.url, "http://x").search;
    const headers = { Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
    if (req.headers["idempotency-key"]) headers["Idempotency-Key"] = req.headers["idempotency-key"];
    const hasBody = !["GET", "HEAD"].includes(req.method);
    const body = hasBody ? (typeof req.body === "string" ? req.body : JSON.stringify(req.body)) : undefined;

    const target = FLORA + "/" + parts.join("/") + search;
    const r = await fetch(target, { method: req.method, headers, body });
    res.setHeader("X-Upstream", target);
    res.status(r.status).setHeader("Content-Type", r.headers.get("content-type") || "application/json");
    return res.send(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    return res.status(502).json({ message: String(e.message || e) });
  }
}
