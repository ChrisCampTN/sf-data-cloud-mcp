import { describe, it, expect, vi } from "vitest";
import { listTransformsTool } from "../../../../src/tools/transform/list-transforms.js";
import fixture from "../../../fixtures/transform-list.json";

describe("listTransformsTool", () => {
  it("returns list of transforms", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://test-org.my.salesforce.com"
      })
    };
    const mockHttp = {
      paginatedGet: vi.fn().mockResolvedValue({ items: fixture })
    };

    const result = await listTransformsTool({ target_org: "TestOrg" }, mockAuth as any, mockHttp as any);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("BATCH");
  });
});
