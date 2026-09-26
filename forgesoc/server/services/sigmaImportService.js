const yaml = require('js-yaml');
const DetectionRule = require('../models/DetectionRule');

const LEVEL_TO_SEVERITY = {
  informational: 'INFO',
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
  critical: 'CRITICAL',
};

const CATEGORY_TO_EVENT_TYPE = {
  authentication: 'AUTH',
  process_creation: 'PROCESS',
  network_connection: 'NETWORK',
  file_event: 'FILE',
  file_access: 'FILE',
  registry_event: 'SYSTEM',
};

const slugify = (s) =>
  s
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);

const titleCase = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Parses one Sigma YAML document into ForgeSOC's DetectionRule shape.
 * Supports the common subset real-world Sigma rules actually use: a flat
 * `detection.selection` field-match block, `logsource.category`, `level`,
 * and `attack.*` tags for MITRE mapping. Rules using Sigma's more advanced
 * correlation/aggregation syntax (`| count() by ... > N`) are only partially
 * handled — the threshold/window default to 1 event / 5 minutes unless the
 * rule's condition string contains a recognizable `count() > N` pattern.
 */
const parseSigmaRule = (sigmaObj) => {
  const title = sigmaObj.title || 'Imported Sigma Rule';
  const category = sigmaObj.logsource?.category;
  const eventType = CATEGORY_TO_EVENT_TYPE[category] || 'SYSTEM';

  const selection = sigmaObj.detection?.selection || {};
  // Sigma commonly keys Windows rules off EventID directly
  const windowsEventId = selection.EventID || selection.EventId || undefined;

  const conditionStr = String(sigmaObj.detection?.condition || '');
  const countMatch = conditionStr.match(/count\([^)]*\)\s*>\s*(\d+)/i);
  const thresholdCount = countMatch ? Number(countMatch[1]) + 1 : 1;

  const timeframe = sigmaObj.detection?.timeframe; // e.g. "5m", "1h"
  let windowMinutes = 5;
  if (timeframe) {
    const tfMatch = String(timeframe).match(/(\d+)([smh])/);
    if (tfMatch) {
      const [, num, unit] = tfMatch;
      windowMinutes = unit === 'h' ? Number(num) * 60 : unit === 'm' ? Number(num) : Math.max(1, Math.round(Number(num) / 60));
    }
  }

  const tags = sigmaObj.tags || [];
  const techniqueTag = tags.find((t) => /^attack\.t\d+/i.test(t));
  const tacticTag = tags.find((t) => /^attack\./i.test(t) && !/^attack\.t\d+/i.test(t));

  const mitre = {
    techniqueId: techniqueTag ? techniqueTag.replace(/^attack\./i, '').toUpperCase() : undefined,
    tactic: tacticTag ? titleCase(tacticTag.replace(/^attack\./i, '')) : undefined,
    techniqueName: undefined,
  };

  return {
    ruleCode: `SIGMA_${slugify(sigmaObj.id ? sigmaObj.id.slice(0, 8) : title)}`,
    name: title,
    description: sigmaObj.description || `Imported from Sigma rule: ${title}`,
    category: 'Other',
    condition: {
      eventType,
      windowsEventId,
      thresholdCount,
      windowMinutes,
      groupBy: 'sourceIp',
    },
    severity: LEVEL_TO_SEVERITY[sigmaObj.level] || 'MEDIUM',
    mitre,
    enabled: true,
  };
};

/**
 * Import one or more Sigma rules from raw YAML text (a single document, or
 * multiple `---`-separated documents). Upserts by ruleCode so re-importing
 * the same rule updates it rather than duplicating it.
 */
const importSigmaYaml = async (yamlText) => {
  const docs = yaml.loadAll(yamlText).filter(Boolean);
  const imported = [];

  for (const doc of docs) {
    const parsed = parseSigmaRule(doc);
    const rule = await DetectionRule.findOneAndUpdate(
      { ruleCode: parsed.ruleCode },
      parsed,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    imported.push(rule);
  }

  return imported;
};

module.exports = { importSigmaYaml, parseSigmaRule };
