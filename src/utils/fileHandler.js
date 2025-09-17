const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '../../public', destination);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const productId = req.params.productId;
      const fileExtension = path.extname(file.originalname);
      cb(null, `${productId}${fileExtension}`);
    },
  });
};

const uploadFile = (destination) => {
  const storage = createStorage(destination);
  return multer({ storage: storage });
};

const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = { uploadFile, deleteFile };