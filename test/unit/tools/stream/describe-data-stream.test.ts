import { describe, it, expect, vi } from "vitest";
import { describeDataStreamTool } from "../../../../src/tools/stream/describe-data-stream.js";

describe("describeDataStreamTool", () => {
  it("fetches data stream details", async () => {
    const mockAuth = {
      getOrgCredentials: vi.fn().mockResolvedValue({
        accessToken: "token",
        instanceUrl: "https://hfaloan.my.salesforce.com"
      })
    };
    const mockHttp = {
      get: vi.fn().mockResolvedValue({ name: "TestStream", status: "ACTIVE" })
    };

    const result = await describeDataStreamTool(
      { target_org: "HFA-Production", stream_name: "TestStream" },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.name).toBe("TestStream");
    expect(mockHttp.get).toHaveBeenCalledWith(
      expect.stringContaining("/data-streams/TestStream"),
      "token"
    );
  });
});
