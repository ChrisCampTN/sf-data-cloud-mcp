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

describe("correctDmoFieldType with context", () => {
  it("maps DATE to DateTime in ci context (default)", () => {
    expect(correctDmoFieldType("DATE")).toBe("DateTime");
    expect(correctDmoFieldType("DATE", "ci")).toBe("DateTime");
  });

  it("maps DATE to Date in mapping context", () => {
    expect(correctDmoFieldType("DATE", "mapping")).toBe("Date");
  });

  it("maps DECIMAL to Number in both contexts", () => {
    expect(correctDmoFieldType("DECIMAL", "ci")).toBe("Number");
    expect(correctDmoFieldType("DECIMAL", "mapping")).toBe("Number");
  });

  it("maps BOOLEAN to Checkbox in both contexts", () => {
    expect(correctDmoFieldType("BOOLEAN", "ci")).toBe("Checkbox");
    expect(correctDmoFieldType("BOOLEAN", "mapping")).toBe("Checkbox");
  });

  it("falls back to Text for unknown types in both contexts", () => {
    expect(correctDmoFieldType("UNKNOWN", "ci")).toBe("Text");
    expect(correctDmoFieldType("UNKNOWN", "mapping")).toBe("Text");
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
