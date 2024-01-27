const express = require("express");
const {
  createProduct,
  getProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
} = require("../controller/productCtrl");
const { isAdmin, authMiddleware } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", authMiddleware, isAdmin, createProduct);
router.get("/:id", getProduct);
router.put("/:id", authMiddleware, isAdmin, updateProduct);
router.get("/", authMiddleware, isAdmin, getAllProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
