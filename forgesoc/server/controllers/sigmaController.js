const { importSigmaYaml } = require('../services/sigmaImportService');

// POST /api/sigma/import  { yaml: "<raw sigma yaml text>" }
exports.importRules = async (req, res, next) => {
  try {
    const { yaml: yamlText } = req.body;
    if (!yamlText || !yamlText.trim()) {
      return res.status(400).json({ message: 'yaml (raw Sigma rule text) is required' });
    }

    const imported = await importSigmaYaml(yamlText);
    res.status(201).json({ imported: imported.length, rules: imported });
  } catch (err) {
    next(err);
  }
};
