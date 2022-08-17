import { rowProcessor, setupRuleEngine } from "./processEtl";
import { format, CsvFormatterStream, Row } from "@fast-csv/format";
import * as fs from "fs";

describe("#rowProcessor", () => {
  const ids = { merchantId: "merchant1", partnerId: "partner1" };

  describe("when rules are defined", () => {
    it("returns invalid when not all conditions not meet", async () => {
      const csvFile = fs.createWriteStream("/tmp/random.csv");
      const stream = format({ headers: true });
      stream.pipe(csvFile);
      const etlRules = [
        {
          ...ids,
          id: "1",
          rule: { fact: "email", operator: "equal", value: "real@example.com" },
          event: {
            type: "email-equal-to",
            params: { consequence: "row-valid" },
          },
        },
        {
          ...ids,
          id: "2",
          rule: { fact: "id", operator: "equal", value: "123" },
          event: {
            type: "email-equal-to",
            params: { consequence: "row-valid" },
          },
        },
      ];
      const etlResult = { total: 0, valid: 0, invalid: 0, details: {} };
      const engine = setupRuleEngine(etlRules);
      await rowProcessor({}, engine, etlResult, stream);
      fs.unlinkSync(csvFile.path);
      expect(etlRules).toEqual(2);
    });
  });
});
