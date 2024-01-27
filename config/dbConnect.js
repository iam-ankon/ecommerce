const { default: mongoose } = require("mongoose");

const dbConnect = () => {
  try {
    const conn = mongoose.connect(process.env.MONGODB_URL);
    console.log("Connect Successfull!!");
  } catch (erroe) {
    console.log("Not Connected");
  }
};
module.exports = dbConnect;