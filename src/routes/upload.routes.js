import { Router } from 'express';
import { upload, uploadBuffer } from '../config/cloudinary.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

// POST /api/upload — multipart/form-data, field name: "image"
router.post('/', requireAuth, requireAdmin, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Niciun fișier' });
  const result = await uploadBuffer(req.file.buffer);
  res.json(result);
}));

// POST /api/upload/multiple — până la 5 imagini, field name: "images"
router.post('/multiple', requireAuth, requireAdmin, upload.array('images', 5), asyncHandler(async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'Niciun fișier' });
  const results = await Promise.all(req.files.map(f => uploadBuffer(f.buffer)));
  res.json(results);
}));

export default router;
