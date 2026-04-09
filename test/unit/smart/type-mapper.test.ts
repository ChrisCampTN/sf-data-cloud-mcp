import { describe, it, expect } from "vitest";
import {
  correctDmoFieldType,
  cleanDmoFieldName
} from "../../../src/smart/type-mapper.js";

describe("correctDmoFieldType", () => {
  it("corrects DATE to DateTime (API quirk: avoids type mismatch)", () => {
    expect(correctDmoFieldType("DATE")).toBe("DateTime");
  });

  it("keeps DECIMAL as Number", () => {
    expect(correctDmoFieldType("DECIMAL")).toBe("Number");
  });

  it("corrects BOOLEAN to Checkbox", () => {
    expect(correctDmoFieldType("BOOLEAN")).toBe("Checkbox");
  });

  it("maps VARCHAR to Text", () => {
    expect(correctDmoFieldType("VARCHAR")).toBe("Text");
  });

  it("maps TIMESTAMP WITH TIME ZONE to DateTime", () => {
    expect(correctDmoFieldType("TIMESTAMP WITH TIME ZONE")).toBe("DateTime");
  });
});

describe("cleanDmoFieldName", () => {
  it("strips redundant _c from custom object fields", () => {
    expect(cleanDmoFieldName("Provider_c__c")).toBe("Provider__c");
  });

  it("strips _c_c__c pattern to _c__c", () => {
    expect(cleanDmoFieldName("Adjusted_Credit_Score_c_c__c")).toBe(
      "Adjusted_Credit_Score_c__c"
    );
  });

  it("leaves system fields unchanged", () => {
    expect(cleanDmoFieldName("DataSource__c")).toBe("DataSource__c");
  });

  it("leaves standard __c fields unchanged", () => {
    expect(cleanDmoFieldName("Name__c")).toBe("Name__c");
  });
});
