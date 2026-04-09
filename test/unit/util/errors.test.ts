import { describe, it, expect } from "vitest";
import { translateError } from "../../../src/util/errors.js";

describe("translateError", () => {
  it("translates schedule interval error", () => {
    const msg =
      "Invalid value for Invalid Calculated Insight Publish Schedule Interval: DAILY";
    const result = translateError(msg);
    expect(result).toContain("NotScheduled");
    expect(result).toContain("TwentyFour");
    expect(result).toContain("DAILY");
  });

  it("translates DLO fact table error", () => {
    const msg =
      "Error getting FactTable Billing_Account_c_00Dxx0000000001__dll";
    const result = translateError(msg);
    expect(result).toContain("__dlm");
    expect(result).toContain("resolve_field_names");
  });

  it("translates field not found in DMOs error", () => {
    const msg =
      "FullColumnName PRA_CreditTierModels__dlm.TierName__c cannot be found in dependencies or existing DMOs";
    const result = translateError(msg);
    expect(result).toContain("describe_dmo");
    expect(result).toContain("_c_c__c");
  });

  it("translates type mismatch error", () => {
    const msg =
      "Default_Processed_Date_c__c 's type Date is different from Default_Processed_Date_c_c__c 's type DateTime";
    const result = translateError(msg);
    expect(result).toContain("create_dmo_from_dlo");
    expect(result).toContain("Date/Currency");
  });

  it("translates missing primary key error", () => {
    const msg =
      "Unable to find Primary Key of DLO in POST request of Mapping Creation";
    const result = translateError(msg);
    expect(result).toContain("Key__c");
  });

  it("translates missing definition type error", () => {
    const msg = "The Definition Type is not supported";
    const result = translateError(msg);
    expect(result).toContain("CALCULATED_METRIC");
  });

  it("passes through unrecognized errors", () => {
    const msg = "Something completely unknown happened";
    const result = translateError(msg);
    expect(result).toBe(msg);
  });
});
