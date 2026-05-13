import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Multer în memorie — fișierul ajunge ca Buffer în req.file.buffer
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error('Tip de fișier nepermis. Acceptăm: JPG, PNG, WebP, GIF'));
    }
    cb(null, true);
  },
});

// Helper: încarcă un buffer pe Cloudinary și întoarce { url, publicId }
export const uploadBuffer = (buffer, folder = 'ciocolaterie') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

export { cloudinary };
