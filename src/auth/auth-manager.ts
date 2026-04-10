import { execSync } from "child_process";

export interface OrgCredentials {
  accessToken: string;
  instanceUrl: string;
  username: string;
}

export interface DataCloudCredentials {
  accessToken: string;
  instanceUrl: string;
}

export class AuthManager {
  private orgCache = new Map<string, OrgCredentials>();
  private dcCache = new Map<
    string,
    { creds: DataCloudCredentials; expiresAt: number }
  >();

  async getOrgCredentials(targetOrg: string): Promise<OrgCredentials> {
    const cached = this.orgCache.get(targetOrg);
    if (cached) return cached;

    const output = execSync(`sf org display --target-org ${targetOrg} --json`, {
      encoding: "utf-8",
      timeout: 30000
    });

    const parsed = JSON.parse(output);
    const result = parsed.result;

    const creds: OrgCredentials = {
      accessToken: result.accessToken,
      instanceUrl: result.instanceUrl,
      username: result.username
    };

    this.orgCache.set(targetOrg, creds);
    return creds;
  }

  async getDataCloudCredentials(
    targetOrg: string
  ): Promise<DataCloudCredentials> {
    const cached = this.dcCache.get(targetOrg);
    if (cached && cached.expiresAt > Date.now()) return cached.creds;

    return this.exchangeDcToken(targetOrg, false);
  }

  private async exchangeDcToken(
    targetOrg: string,
    isRetry: boolean
  ): Promise<DataCloudCredentials> {
    const orgCreds = await this.getOrgCredentials(targetOrg);

    const response = await fetch(
      `${orgCreds.instanceUrl}/services/a360/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${orgCreds.accessToken}`
        },
        body: "grant_type=urn:salesforce:grant-type:external:cdp"
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({})) as Record<string, unknown>;

      // If "invalid subject token" and we haven't retried, the org token may be stale
      if (!isRetry && String(errorBody.error_description ?? "").includes("invalid subject token")) {
        this.orgCache.delete(targetOrg);
        return this.exchangeDcToken(targetOrg, true);
      }

      const detail = errorBody.error_description ?? errorBody.message ?? JSON.stringify(errorBody);
      throw new Error(
        `Data Cloud token exchange failed: ${detail}. ` +
        `If this persists, use org token tools (query_sql, list_dmos) instead of DC token tools (query_profile). ` +
        `Verify Data Cloud is enabled: Setup > Data Cloud > Settings.`
      );
    }

    const tokenResponse = (await response.json()) as Record<string, unknown>;

    const accessToken = (tokenResponse.access_token ?? tokenResponse.accessToken) as string;
    const instanceUrl = (
      tokenResponse.instance_url ??
      tokenResponse.instanceUrl ??
      tokenResponse.cdp_instance_url ??
      tokenResponse.cdpInstanceUrl
    ) as string;

    if (!accessToken) {
      throw new Error(`Data Cloud token exchange returned no access token. Response keys: ${Object.keys(tokenResponse).join(", ")}`);
    }
    if (!instanceUrl) {
      throw new Error(`Data Cloud token exchange returned no instance URL. Response keys: ${Object.keys(tokenResponse).join(", ")}`);
    }

    const creds: DataCloudCredentials = { accessToken, instanceUrl };

    this.dcCache.set(targetOrg, {
      creds,
      expiresAt: Date.now() + 25 * 60 * 1000 // 25 min TTL (tokens expire ~30 min)
    });

    return creds;
  }

  clearCache(): void {
    this.orgCache.clear();
    this.dcCache.clear();
  }
}
