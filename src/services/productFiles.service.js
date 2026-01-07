const prisma = require('../utils/prisma');

const createHttpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const getProductFile = async ({ productId, field }) => {
  if (!productId) throw createHttpError(400, "product_id talab qilinadi");

  const product = await prisma.product.findUnique({
    where: { productId },
  });
  if (!product) throw createHttpError(404, 'product not found');

  const fileUrl = product[field] || null;
  if (!fileUrl) throw createHttpError(404, 'file not found');

  return { fileUrl, product };
};

module.exports = {
  getProductFile,
};
