const axios = require("axios");

axios.get("https://restcountries.com/v3/all").then((r) => {
  console.log(r);
});
