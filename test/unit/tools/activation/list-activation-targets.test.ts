import { describe, it, expect, vi } from "vitest";
import { listActivationTargetsTool } from "../../../../src/tools/activation/list-activation-targets.js";

describe("listActivationTargetsTool", () => {
  it("returns list of activation targets", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://hfaloan.my.salesforce.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ activationTargets: [] })
    };

    const result = await listActivationTargetsTool(
      { target_org: "HFA-Production" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result).toEqual([]);
  });
});
