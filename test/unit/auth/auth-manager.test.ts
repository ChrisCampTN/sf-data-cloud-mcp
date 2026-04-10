import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthManager } from "../../../src/auth/auth-manager.js";

vi.mock("child_process", () => ({
  execSync: vi.fn()
}));

describe("AuthManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets org token from sf org display", async () => {
    const { execSync } = await import("child_process");
    vi.mocked(execSync).mockReturnValue(
      Buffer.from(
        JSON.stringify({
          result: {
            accessToken: "org-token-123",
            instanceUrl: "https://test-org.my.salesforce.com",
            username: "admin@test-org.com"
          }
        })
      )
    );

    const auth = new AuthManager();
    const creds = await auth.getOrgCredentials("TestOrg");

    expect(creds.accessToken).toBe("org-token-123");
    expect(creds.instanceUrl).toBe("https://test-org.my.salesforce.com");
    expect(vi.mocked(execSync)).toHaveBeenCalledWith(
      expect.stringContaining("sf org display --target-org TestOrg --json"),
      expect.any(Object)
    );
  });

  it("caches org token for same alias", async () => {
    const { execSync } = await import("child_process");
    vi.mocked(execSync).mockReturnValue(
      Buffer.from(
        JSON.stringify({
          result: {
            accessToken: "org-token-123",
            instanceUrl: "https://test-org.my.salesforce.com",
            username: "admin@test-org.com"
          }
        })
      )
    );

    const auth = new AuthManager();
    await auth.getOrgCredentials("TestOrg");
    await auth.getOrgCredentials("TestOrg");

    expect(vi.mocked(execSync)).toHaveBeenCalledTimes(1);
  });

  it("exchanges org token for Data Cloud token", async () => {
    const { execSync } = await import("child_process");
    vi.mocked(execSync).mockReturnValue(
      Buffer.from(
        JSON.stringify({
          result: {
            accessToken: "org-token-123",
            instanceUrl: "https://test-org.my.salesforce.com",
            username: "admin@test-org.com"
          }
        })
      )
    );

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: "dc-token-456",
          instance_url: "https://test-org.dc.salesforce.com",
          token_type: "Bearer"
        })
    });
    vi.stubGlobal("fetch", mockFetch);

    const auth = new AuthManager();
    const creds = await auth.getDataCloudCredentials("TestOrg");

    expect(creds.accessToken).toBe("dc-token-456");
    expect(creds.instanceUrl).toBe("https://test-org.dc.salesforce.com");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://test-org.my.salesforce.com/services/a360/token",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("retries DC token exchange on stale org token", async () => {
    const { execSync } = await import("child_process");
    let callCount = 0;
    vi.mocked(execSync).mockImplementation(() => {
      callCount++;
      return Buffer.from(
        JSON.stringify({
          result: {
            accessToken: callCount === 1 ? "stale-token" : "fresh-token",
            instanceUrl: "https://test-org.my.salesforce.com",
            username: "admin@test-org.com"
          }
        })
      );
    });

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            error: "invalid_request",
            error_description: "invalid subject token"
          })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "dc-token-fresh",
            instance_url: "https://test-org.dc.salesforce.com",
            token_type: "Bearer"
          })
      });
    vi.stubGlobal("fetch", mockFetch);

    const auth = new AuthManager();
    const creds = await auth.getDataCloudCredentials("TestOrg");

    expect(creds.accessToken).toBe("dc-token-fresh");
    // execSync called twice: once for stale, once for fresh after cache clear
    expect(vi.mocked(execSync)).toHaveBeenCalledTimes(2);
    // fetch called twice: failed with stale token, succeeded with fresh
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
