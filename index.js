const express = require("express");
const cors = require("cors");
const crawData = require("./server");
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.get("/", (req, res) => {
  res.json({ message: "hello world" });
});
app.post("/crawl-account-fpt", async (req, res) => {
  if (req.body && req.body.accounts) {
    const { accounts } = req.body;
    const rsCrawlData = await crawData(accounts);
    return res.json({ data: rsCrawlData });
  }
});
const port = 8080;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
