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
            type: "row-valid",
            params: { name: "email-equal-real@example.com" },
          },
        },
        {
          ...ids,
          id: "2",
          rule: { fact: "id", operator: "equal", value: "123" },
          event: {
            type: "row-valid",
            params: { name: "id-equal-123" },
          },
        },
      ];
      const etlResult = { total: 0, valid: 0, invalid: 0, errors: {} };
      const engine = setupRuleEngine(etlRules);
      await rowProcessor(row, engine, etlResult, stream);

      expect(etlResult).toEqual({
        errors: { "id-equal-123": 1 },
        invalid: 1,
        total: 1,
        valid: 0,
      });
    });

    it("returns valid when all conditions meet", async () => {
      const csvFile = fs.createWriteStream(tempFileName);
      const stream = format({ headers: true });
      stream.pipe(csvFile);
      const row = { email: "real@example.com", id: "222", price: 200 };
      const etlRules = [
        {
          ...ids,
          id: "1",
          rule: { fact: "email", operator: "equal", value: "real@example.com" },
          event: {
            type: "row-valid",
            params: { name: "email-equal-real@example.com" },
          },
        },
        {
          ...ids,
          id: "2",
          rule: {
            fact: "price",
            operator: "lessThanInclusive",
            value: 100,
          },
          event: {
            type: "row-invalid",
            params: { name: "price-lessThanInclusive-100" },
          },
        },
      ];
      const etlResult = { total: 0, valid: 0, invalid: 0, errors: {} };
      const engine = setupRuleEngine(etlRules);
      await rowProcessor(row, engine, etlResult, stream);

      expect(etlResult).toEqual({
        errors: {},
        invalid: 0,
        total: 1,
        valid: 1,
      });
    });
  });
});
