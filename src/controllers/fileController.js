const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const { deleteFile } = require('../utils/fileHandler');

const saveFile = async (req, res, fileType) => {
  try {
    const { productId } = req.params;
    const filePath = req.file ? req.file.path : null;
    const fileUrl = filePath ? `/${fileType}/${path.basename(filePath)}` : null;

    if (!productId) {
      return res.status(400).json({ message: 'productId talab qilinadi' });
    }

    let product = await prisma.product.findUnique({
      where: { productId },
    });

    const updateData = {};
    updateData[`${fileType}Url`] = fileUrl;

    if (product) {
      const oldFilePath = product[`${fileType}Url`] ? path.join(__dirname, '../../public', product[`${fileType}Url`]) : null;
      if (oldFilePath) {
        deleteFile(oldFilePath);
      }

      product = await prisma.product.update({
        where: { productId },
        data: updateData,
      });
    } else {
      product = await prisma.product.create({
        data: {
          productId,
          ...updateData,
        },
      });
    }

    res.status(200).json({
      message: `Fayl muvaffaqiyatli saqlandi`,
      fileUrl: fileUrl,
      product,
    });
  } catch (error) {
    console.error('Xatolik:', error);
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

const saveAudioText = (req, res) => saveFile(req, res, 'audioText');
const saveAudio = (req, res) => saveFile(req, res, 'audio');
const saveCaption = (req, res) => saveFile(req, res, 'caption');
const saveVideo = (req, res) => saveFile(req, res, 'video');

module.exports = {
  saveAudioText,
  saveAudio,
  saveCaption,
  saveVideo,
};