const express = require('express');
const multer = require('multer');
const path = require('path');
const { prisma } = require('../lib/prisma');
const { ensureUploadRoot, UPLOAD_ROOT, publicUploadPath } = require('../lib/storage');
const { broadcastFileShared } = require('../lib/socket');
const { toApiShape } = require('./crud');

ensureUploadRoot();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_ROOT),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES || 50 * 1024 * 1024) },
});

const router = express.Router();

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const document = await prisma.document.create({
      data: {
        title: req.body.title || path.parse(req.file.originalname).name,
        type: req.body.type || 'report',
        projectId: req.body.project_id ? Number(req.body.project_id) : null,
        filePath: publicUploadPath(req.file.filename),
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.user.id,
        department: req.user.department || 'OPERATIONS',
        createdBy: req.user.id,
        updatedBy: req.user.id,
      },
    });

    const payload = toApiShape(document);
    broadcastFileShared(payload, req.user);
    res.status(201).json(payload);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
