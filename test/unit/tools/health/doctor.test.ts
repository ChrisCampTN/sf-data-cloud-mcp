import { describe, it, expect, vi } from "vitest";
import { doctorTool } from "../../../../src/tools/health/doctor.js";

describe("doctorTool", () => {
  it("returns health status from auth probe", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://hfaloan.my.salesforce.com",
        username: "chris@hfaloan.com"
      }),
      getDataCloudCredentials: vi.fn().mockResolvedValue({
        accessToken: "dc-token",
        instanceUrl: "https://hfaloan.dc.salesforce.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValue({
        searchIndexes: [{ name: "idx1" }, { name: "idx2" }, { name: "idx3" }]
      })
    };

    const result = await doctorTool(
      { target_org: "HFA-Production" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.status).toBe("ok");
    expect(result.org).toBe("chris@hfaloan.com");
    expect(result.apiVersion).toBe("66.0");
    expect(result.indexes).toBe(3);
    expect(result.instanceUrl).toBe("https://hfaloan.my.salesforce.com");
    expect(result.dataCloudUrl).toBe("https://hfaloan.dc.salesforce.com");
  });
});
