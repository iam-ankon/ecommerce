const { default: mongoose } = require("mongoose");

const dbConnect = () => {
  try {
    const conn = mongoose.connect(process.env.MONGODB_URL);
    console.log("Connect Successfull!!");
  } catch (error) {
    console.log("Not Connected");
  }
};
module.exports = dbConnect;