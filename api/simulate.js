export default async function handler(req, res) {
  const { input } = JSON.parse(req.body);

  const result = `Si haces: "${input}", las consecuencias dependerán del contexto.`;

  res.status(200).json({ result });
}
