import { rowProcessor, setupRuleEngine, tempFileName } from "./processEtl";
import { format } from "@fast-csv/format";
import * as fs from "fs";

describe("#rowProcessor", () => {
  const ids = { merchantId: "merchant1", partnerId: "partner1" };

  describe("when rules are defined", () => {
    it("returns invalid when not all conditions not meet", async () => {
      const csvFile = fs.createWriteStream(tempFileName);
      const stream = format({ headers: true });
      stream.pipe(csvFile);
      const row = { email: "real@example.com", id: "222" };
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
            type: "id-equal-to",
            params: { consequence: "row-valid" },
          },
        },
      ];
      const etlResult = { total: 0, valid: 0, invalid: 0, errors: {} };
      const engine = setupRuleEngine(etlRules, etlResult);
      await rowProcessor(row, engine, etlResult, stream);
      fs.unlinkSync(csvFile.path);
      expect(etlResult).toEqual({
        errors: { "id-equal-to": 1 },
        invalid: 1,
        total: 0,
        valid: 0,
      });
    });
  });
});
