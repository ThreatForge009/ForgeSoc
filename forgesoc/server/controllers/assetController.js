const Asset = require('../models/Asset');
const Alert = require('../models/Alert');

// GET /api/assets
exports.getAssets = async (req, res, next) => {
  try {
    const { status, riskLevel, q } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (q) {
      filter.$or = [{ hostname: new RegExp(q, 'i') }, { ip: new RegExp(q, 'i') }];
    }
    const assets = await Asset.find(filter).sort({ hostname: 1 });
    res.json(assets);
  } catch (err) {
    next(err);
  }
};

// GET /api/assets/:id
exports.getAssetById = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const relatedAlerts = await Alert.find({ hostname: asset.hostname })
      .sort({ createdAt: -1 })
      .limit(25);

    res.json({ asset, relatedAlerts });
  } catch (err) {
    next(err);
  }
};

// POST /api/assets
exports.createAsset = async (req, res, next) => {
  try {
    const asset = await Asset.create(req.body);
    res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/assets/:id
exports.updateAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/assets/:id
exports.deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json({ message: 'Asset deleted' });
  } catch (err) {
    next(err);
  }
};
