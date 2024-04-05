try {
  require("./instrumentation");
  const { trace } = require("@opentelemetry/api");
  const pino = require("pino");
  const logger = pino();

  const express = require("express");
  const app = express();
  const port = 3000;

  app.get("/", (req, res) => {
    console.log("FOOO");
    let span = trace.getActiveSpan();

    console.log("Span in GET", span);

    logger.info("FOOO inside of pino");

    // logger.info("LOGGING IN GET");

    span?.addEvent("GET START", {
      foo: "bar",
    });
    res.send("Hello World! FOOO");
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
} catch (e) {
  console.log("Error launching express app", e);
}
