const http = require("http");
const https = require("https");

const notify = (text) => {
  const req = https.request(process.env.FEISHU, {
    method: "post",
  });
  req.write(
    JSON.stringify({
      msg_type: "text",
      content: {
        text,
      },
    })
  );
  req.end();
};

const getFund = (code) => {
  return new Promise((resolve, reject) => {
    let url = `http://fund.eastmoney.com/${code}.html`;
    http
      .get(url, (res) => {
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          let title = "";
          let value = "";
          let percent = "";
          const reg1 =
            /<div class="fundDetail-tit"><div style="float: left">(.+?)<span>\(<\/span><span class="ui-num">(.+?)<\/span><\/div>\)<\/div>/;
          const reg2 = /<dl class="dataItem02">.+?<\/dl>/;
          const reg3 = /<span class="ui-font-large.+?ui-num">(.+?)<\/span>/;
          const reg4 = /<span class="ui-font-middle.+?ui-num">(.+?)<\/span>/;
          let matches1 = rawData.match(reg1);
          if (matches1 && matches1.length > 1) {
            title = matches1[1] + "(" + matches1[2] + ")";
          }
          let matches2 = rawData.match(reg2);
          if (matches2 && matches2.length > 0) {
            let matches3 = matches2[0].match(reg3);
            let matches4 = matches2[0].match(reg4);
            if (matches3.length > 1 && matches4.length > 1) {
              value = matches3[1];
              percent = matches4[1];
              if (percent.indexOf("-") !== 0) {
                percent = "+" + percent;
              }
            }
          }
          if (title && value && percent) {
            resolve({
              title,
              value,
              percent,
            });
          } else {
            reject();
          }
        });
      })
      .on("error", (e) => {
        reject();
      });
  });
};

if (process.env.FEISHU && process.env.CODE) {
  console.log("run");
  let promiseArr = [];
  process.env.CODE.split(",").forEach((item) => {
    item = item.replace(/^\s+|\s$+/, "");
    promiseArr.push(getFund(item));
  });
  Promise.all(promiseArr)
    .then((data) => {
      data = data.map((item) => {
        return `${item.title} -> ${item.value} -> ${item.percent}`;
      });
      notify(data.join("\n"));
    })
    .catch(() => {});
}

console.log("hello");