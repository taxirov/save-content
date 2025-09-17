const prisma = require('../utils/prisma');
const path = require('path');
const fs = require('fs');

const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const saveFileToDb = async (productId, fileUrl, fileType) => {
  try {
    let product = await prisma.product.findUnique({
      where: { productId },
    });

    const updateData = {};
    updateData[`${fileType}Url`] = fileUrl;

    if (product) {
      // Eski faylni o'chirish
      const oldFilePath = product[`${fileType}Url`] ? path.join(__dirname, '../../public', product[`${fileType}Url`]) : null;
      if (oldFilePath) {
        deleteFile(oldFilePath);
      }

      // Ma'lumotlar bazasini yangilash
      product = await prisma.product.update({
        where: { productId },
        data: updateData,
      });
    } else {
      // Yangi yozuv yaratish
      product = await prisma.product.create({
        data: {
          productId,
          ...updateData,
        },
      });
    }

    return product;
  } catch (error) {
    console.error("Ma'lumotlar bazasini yangilashda xatolik:", error);
    throw new Error("Ma'lumotlar bazasi xatosi");
  }
};

module.exports = {
  saveFileToDb,
};