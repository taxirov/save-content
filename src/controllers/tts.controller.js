const { readJsonBody } = require('../utils/http');
const { textToSpeech } = require('../services/tts.service');

const ttsHandler = async (req, res) => {
  const body = await readJsonBody(req);
  if (!body) return res.status(400).json({ error: "Noto'g'ri JSON" });

  const text = (body?.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Matn topilmadi' });

  try {
    const result = await textToSpeech({
      text,
      format: body?.format,
      contentType: body?.contentType,
      voice: body?.voice,
      voiceSpeed: body?.voiceSpeed,
      voiceVolume: body?.voiceVolume,
    });
    return res.status(200).json(result);
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err?.message || 'Server xatosi' });
  }
};

module.exports = {
  ttsHandler,
};
