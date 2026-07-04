const express = require('express');
const { generateCeoReport } = require('../jobs/ceo-report');

const router = express.Router();

function canGenerateReports(user) {
  return ['CEO', 'DEPUTY_CEO', 'CAO', 'FINANCE'].includes(user.role);
}

router.post('/ceo', async (req, res) => {
  try {
    if (!canGenerateReports(req.user)) return res.status(403).json({ error: 'CEO report generation requires executive or finance access' });
    const report = await generateCeoReport();
    res.json({ success: true, filename: report.filename, html: report.html });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
