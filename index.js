const express = require("express");
const cors = require("cors");
const excelJS = require("exceljs");
const fs = require("fs");
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
app.get("/download-excel", async (req, res) => {
  fs.readFile("./data.json", "utf8", async (err, jsonString) => {
    if (err) {
      return;
    }
    try {
      if (jsonString) {
        oldData = JSON.parse(jsonString);
        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet("My data");
        const path = "./files";
        worksheet.columns = [
          { header: "Số thứ tự.", key: "s_no", width: 10 },
          { header: "Phone", key: "phone", width: 30 },
          { header: "Password", key: "password", width: 30 },
          { header: "Packages", key: "packages", width: 80 },
        ];
        let counter = 1;
        oldData.forEach((d) => {
          let pkstring = "";
          d.packages.forEach((pk) => {
            pkstring += `${pk.plan_name} - ${pk.dateleft} ngày; `;
          });
          worksheet.addRow({
            s_no: counter,
            phone: d.account.phone,
            password: d.account.password,
            packages: pkstring,
          }); // Add data in worksheet
          counter++;
        });
        worksheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true };
        });
        try {
          const data = await workbook.xlsx
            .writeFile(`${path}/${Date.now()}-accounts.xlsx`)
            .then(() => {
              res.send({
                status: "success",
                message: "file successfully downloaded",
                path: `${path}/${Date.now()}-accounts.xlsx`,
              });
            });
        } catch (err) {
          console.log(err);
          res.send({
            status: "error",
            message: "Something went wrong",
          });
        }
      }
    } catch (err) {
      console.log("Error parsing JSON string:", err);
      res.send({
        status: "failed",
        message: "Somethings went wrong",
      });
    }
  });
});
const port = 8080;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
