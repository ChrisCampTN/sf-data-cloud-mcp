import { describe, it, expect } from "vitest";
import { translateDloSqlToDmoSql } from "../../../src/smart/sql-translator.js";

describe("translateDloSqlToDmoSql", () => {
  it("replaces DLO table references with DMO references", () => {
    const dloSql =
      "SELECT Billing_Account_c_00Dxx0000000001__dll.Provider_c__c FROM Billing_Account_c_00Dxx0000000001__dll";
    const tableMap = {
      Billing_Account_c_00Dxx0000000001__dll: "PRA_BillingAccount__dlm"
    };
    const fieldMap = {
      "Billing_Account_c_00Dxx0000000001__dll.Provider_c__c": "PRA_BillingAccount__dlm.Provider_c_c__c"
    };

    const result = translateDloSqlToDmoSql(dloSql, tableMap, fieldMap);

    expect(result).toContain("PRA_BillingAccount__dlm");
    expect(result).toContain("Provider_c_c__c");
    expect(result).not.toContain("__dll");
  });

  it("expands aliases to fully qualified DMO names", () => {
    const dloSql = "SELECT ba.Provider_c__c FROM Billing_Account_c_00Dxx0000000001__dll ba";
    const tableMap = {
      Billing_Account_c_00Dxx0000000001__dll: "PRA_BillingAccount__dlm"
    };
    const fieldMap = {
      "Billing_Account_c_00Dxx0000000001__dll.Provider_c__c": "PRA_BillingAccount__dlm.Provider_c_c__c"
    };

    const result = translateDloSqlToDmoSql(dloSql, tableMap, fieldMap);

    expect(result).toContain("PRA_BillingAccount__dlm.Provider_c_c__c");
    expect(result).not.toContain("ba.");
  });
});
