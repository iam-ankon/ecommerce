const express = require("express");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const {
  createBloge,
  updateBlog,
  getBlog,
  getAllBlog,
  deleteBlog,
  likeBlog,
} = require("../controller/blogctrl");
const router = express.Router();

router.post("/", authMiddleware, isAdmin, createBloge);
router.put("/like", authMiddleware, likeBlog);
router.put("/:id", authMiddleware, isAdmin, updateBlog);
router.get("/:id", getBlog);
router.get("/", getAllBlog);
router.delete("/:id", authMiddleware, isAdmin, deleteBlog);
  

module.exports = router;
