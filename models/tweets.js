const mongoose = require("mongoose"); 

delete mongoose.connection.models["Tweet"];

const tweetSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  date: { type: Date, required: true },
  content: { type: String, required: true },
  likers: [String], // a foreign key is not needed here
});

const Tweet = mongoose.model( "tweets", tweetSchema); 

module.exports = Tweet; 
