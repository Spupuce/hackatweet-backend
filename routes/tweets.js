const express = require("express");
const router = express.Router();
const Tweet = require("../models/tweets");
const { checkBody } = require("../modules/checkBody");

// Collecting all tweets and sorting by date (decreasing)
router.get("/", async (req, res) => {
  try {
    const tweets = await Tweet.find();
    
    // sorting by deceasing date
    tweets.sort((a,b) => {return b.date - a.date})
    
    res.json({ result: true, tweets: tweets });
  } catch (error) {
    console.error("db error:", error);
  }
});

// Adding a new tweet
router.post("/add", async (req, res) => {
  if (!checkBody(req.body, ["user", "content"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  try {
    const { user, content } = req.body;
    const date = Date();
    const newTweet = new Tweet({ user, date, content });
    await newTweet.save();
    res.json({ result: true, tweetId: newTweet._id });
  } catch (error) {
    console.error("db error:", error);
  }
});

// Removing an existing tweet
router.delete("/delete/:tweetId", async (req, res) => {
  const tweetId = req.params.tweetId;
  if (!tweetId) {
    res.json({ result: false, error: "Missing tweet id" });
    return;
  }
  try {
    await Tweet.deleteOne({ _id: tweetId });
    res.json({ result: true });
  } catch (error) {
    console.error("db error:", error);
  }
});

// Liking a given tweet (or unliking if already liked)
router.post("/like", async (req, res) => {
  if (!checkBody(req.body, ["userId", "tweetId"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  try {
    const { userId, tweetId } = req.body;
    const tweet = await Tweet.findById(tweetId);
    console.log(tweet);
    if (!tweet) {
      return res.json({ result: false, error: "Tweet not found" });
    }
    // Check that the user hasn't already liked this tweet. If not, push ; if yes, filter out.
    if (!tweet.likers.includes(userId)) {
      tweet.likers.push(userId);
    } else {
      tweet.likers = tweet.likers.filter((e) => e !== userId);
    }
    await tweet.save();

    res.json({ result: true, likers: tweet.likers });
  } catch (error) {
    console.error("db error:", error);
    res.json({ result: false, error: "Internal server error" });
  }
});

// Collect all hashtags in db
router.get("/hashtags", async (req, res) => {
  try {
    const tweets = await Tweet.find({
      content: { $regex: "#"},
    });
    // filtering on documents that contains at least one hashtag
    const contents = tweets.map((e) => e.content);
    let hashtags = [];
    const pattern = /#\w+/g;
    // aggregating all hashtags in an array
    for (let item of contents) {
      const hashtag = item.match(pattern);
      hashtags = hashtags.concat(hashtag);
    }
    // counting the occurences of each hashtag
    const counts = {};
    for (const tag of hashtags) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
    // converting the object to an array to allow sorting
    const hashtagsArray = Object.entries(counts).map(([hashtag, count]) => ({
      hashtag,
      count,
    }));
    // sorting by decreasing count
    hashtagsArray.sort((a, b) => b.count - a.count);

    res.json({ result: true, hashtags: hashtagsArray });
  } catch (error) {
    console.error("db error:", error);
    res.json({ result: false, error: "Internal server error" });
  }
});

// collect tweets that include a given hashtag (attention: params WITHOUT #)
router.get("/hashtags/:tag", async (req, res) => {
  try {
    const pattern = `#${req.params.tag}`;
    const tweets = await Tweet.find({
      content: { $regex: pattern },
    });

    // sorting by decreasing date
    tweets.sort((a, b) => b.date - a.date);

    res.json({ result: true, tweets: tweets });
  } catch (error) {
    console.error("db error:", error);
    res.json({ result: false, error: "Internal server error" });
  }
});

module.exports = router;
