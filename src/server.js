require("dotenv").config();
const app = require("./app");

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const publicUrl = process.env.PUBLIC_URL || `http://${host === "0.0.0.0" ? "localhost" : host}:${port}`;

app.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`Digital museum server running on ${publicUrl}`);
});
