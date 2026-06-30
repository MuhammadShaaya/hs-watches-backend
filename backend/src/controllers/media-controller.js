const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

function bufferToCloudinary(buffer, folder = "hs-watches/products") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, transformation: [{ quality: "auto", fetch_format: "auto" }] },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

async function uploadFiles(req, res) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

  for (const file of req.files) {
    if (!ALLOWED.includes(file.mimetype)) {
      return res.status(400).json({ error: `Unsupported file type: ${file.mimetype}` });
    }
    if (file.size > MAX_SIZE) {
      return res.status(400).json({ error: `File too large: ${file.originalname} (max 10MB)` });
    }
  }

  const results = await Promise.all(req.files.map((file) => bufferToCloudinary(file.buffer)));

  res.json({
    images: results.map((r) => ({
      url: r.secure_url,
      publicId: r.public_id,
      width: r.width,
      height: r.height,
    })),
  });
}

async function uploadFromUrl(req, res) {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Image URL is required" });

  const result = await cloudinary.uploader.upload(url, {
    folder: "hs-watches/products",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });

  res.json({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height });
}

async function deleteMedia(req, res) {
  const { publicId } = req.params;
  await cloudinary.uploader.destroy(publicId);
  res.json({ success: true });
}

module.exports = { uploadFiles, uploadFromUrl, deleteMedia };
