const pup = require("puppeteer");
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
  await page.goto("https://fptplay.vn/dang-nhap", {
    waitUntil: "networkidle0",
  });

  const res = await page.evaluate(async (dataFpt) => {
    let returnData = [];
    dataFpt.forEach(async (dF) => {
      const promiseFpt = async function () {
        const resLogin = await fetch(
          "https://api.fptplay.net/api/v6.2_w/user/otp/login",
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
            "https://api.fptplay.net/api/v6.2_w/payment/get_v2_user_vips",
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
          if (resDataJson) {
            return {
              account: { phone: dF.phone, password: dF.password },
              ...resDataJson,
            };
          }
        }
        if (jsonResLogin && jsonResLogin.error_code === 34) {
          const resLogin2 = await fetch(
            "https://api.fptplay.net/api/v6.2_w/user/otp/clear_web_tokens",
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
              "https://api.fptplay.net/api/v6.2_w/payment/get_v2_user_vips",
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
            if (resData2Json) {
              return {
                account: { phone: dF.phone, password: dF.password },
                ...resData2Json,
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
  return dataFpt;
};
