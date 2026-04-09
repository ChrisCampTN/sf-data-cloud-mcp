import { describe, it, expect, vi } from "vitest";
import { createDmoMappingTool } from "../../../../src/tools/dmo/create-dmo-mapping.js";

describe("createDmoMappingTool", () => {
  const mockAuth = {
    getOrgCredentials: vi.fn().mockResolvedValue({
      accessToken: "token",
      instanceUrl: "https://hfaloan.my.salesforce.com"
    })
  };

  it("returns preview when confirm is false", async () => {
    const mockHttp = { post: vi.fn() };
    const mapping = {
      sourceDlo: "Test__dll",
      targetDmo: "Test__dlm",
      fieldMappings: [{ sourceField: "Name__c", targetField: "Name_c__c" }]
    };

    const result = await createDmoMappingTool(
      { target_org: "HFA-Production", mapping, confirm: false },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.preview).toBe(true);
    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  it("creates mapping when confirm is true", async () => {
    const mockHttp = {
      post: vi.fn().mockResolvedValue({ success: true })
    };
    const mapping = {
      sourceDlo: "Test__dll",
      targetDmo: "Test__dlm",
      fieldMappings: [{ sourceField: "Name__c", targetField: "Name_c__c" }]
    };

    const result = await createDmoMappingTool(
      { target_org: "HFA-Production", mapping, confirm: true },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.success).toBe(true);
    expect(mockHttp.post).toHaveBeenCalledWith(
      expect.stringContaining("/ssot/data-model-object-mappings"),
      "token",
      mapping
    );
  });
});
