import { describe, it, expect } from "vitest";
import { correctDmoFieldType, cleanDmoFieldName } from "../../../src/smart/type-mapper.js";

describe("correctDmoFieldType — ci_sql context (default)", () => {
  it("converts DATE to DateTime for CI SQL", () => {
    expect(correctDmoFieldType("DATE")).toBe("DateTime");
    expect(correctDmoFieldType("DATE", "ci_sql")).toBe("DateTime");
  });

  it("converts CURRENCY to Number for CI SQL", () => {
    expect(correctDmoFieldType("CURRENCY", "ci_sql")).toBe("Number");
  });

  it("converts BOOLEAN to Checkbox for CI SQL", () => {
    expect(correctDmoFieldType("BOOLEAN", "ci_sql")).toBe("Checkbox");
  });

  it("keeps DECIMAL as Number", () => {
    expect(correctDmoFieldType("DECIMAL")).toBe("Number");
  });

  it("maps VARCHAR to Text", () => {
    expect(correctDmoFieldType("VARCHAR")).toBe("Text");
  });

  it("maps TIMESTAMP WITH TIME ZONE to DateTime", () => {
    expect(correctDmoFieldType("TIMESTAMP WITH TIME ZONE")).toBe("DateTime");
  });
});

describe("correctDmoFieldType — mapping context", () => {
  it("keeps DATE as Date for mappings", () => {
    expect(correctDmoFieldType("DATE", "mapping")).toBe("Date");
  });

  it("keeps CURRENCY as Currency for mappings", () => {
    expect(correctDmoFieldType("CURRENCY", "mapping")).toBe("Currency");
  });

  it("keeps BOOLEAN as Boolean for mappings", () => {
    expect(correctDmoFieldType("BOOLEAN", "mapping")).toBe("Boolean");
  });

  it("maps DECIMAL to Number", () => {
    expect(correctDmoFieldType("DECIMAL", "mapping")).toBe("Number");
  });
});

describe("cleanDmoFieldName", () => {
  it("strips redundant _c from custom object fields", () => {
    expect(cleanDmoFieldName("Provider_c__c")).toBe("Provider__c");
  });

  it("strips _c_c__c pattern to _c__c", () => {
    expect(cleanDmoFieldName("Adjusted_Credit_Score_c_c__c")).toBe("Adjusted_Credit_Score_c__c");
  });

  it("leaves system fields unchanged", () => {
    expect(cleanDmoFieldName("DataSource__c")).toBe("DataSource__c");
  });

  it("leaves standard __c fields unchanged", () => {
    expect(cleanDmoFieldName("Name__c")).toBe("Name__c");
  });
});
