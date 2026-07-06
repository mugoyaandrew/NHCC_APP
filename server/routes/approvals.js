const express = require('express');
const { prisma } = require('../lib/prisma');
const { toApiShape } = require('./crud');
const { broadcastCrudEvent } = require('../lib/socket');

const router = express.Router();

router.post('/:id/review', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, review_notes } = req.body;

    const approval = await prisma.approval.update({
      where: { id },
      data: {
        status,
        reviewNotes: review_notes,
        reviewedBy: req.user.id,
      },
    });

    broadcastCrudEvent('approvals', 'updated', toApiShape(approval), req.user);
    res.json(toApiShape(approval));
  } catch (err) {
    console.error('Approvals review error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
