import { describe, it, expect, vi } from "vitest";
import { createDmoTool, transformForCreate } from "../../../../src/tools/dmo/create-dmo.js";

describe("transformForCreate", () => {
  it("strips __dlm suffix from name", () => {
    const result = transformForCreate({ name: "PRA_Test__dlm" });
    expect(result.name).toBe("PRA_Test");
  });

  it("renames type to dataType in fields", () => {
    const result = transformForCreate({
      name: "Test",
      fields: [{ name: "Score", type: "Number", label: "Score" }]
    });
    const field = (result.fields as any[])[0];
    expect(field.dataType).toBe("Number");
    expect(field.type).toBeUndefined();
  });

  it("removes keyQualifierName and creationType from fields", () => {
    const result = transformForCreate({
      name: "Test",
      fields: [{ name: "Id", type: "Text", keyQualifierName: "KQ_Id", creationType: "Custom" }]
    });
    const field = (result.fields as any[])[0];
    expect(field.keyQualifierName).toBeUndefined();
    expect(field.creationType).toBeUndefined();
  });

  it("preserves dataType if already present", () => {
    const result = transformForCreate({
      name: "Test",
      fields: [{ name: "Score", dataType: "Number" }]
    });
    const field = (result.fields as any[])[0];
    expect(field.dataType).toBe("Number");
  });

  it("leaves name alone if no __dlm suffix", () => {
    const result = transformForCreate({ name: "PRA_Test" });
    expect(result.name).toBe("PRA_Test");
  });

  it("strips __c suffix from field names", () => {
    const result = transformForCreate({
      name: "Test",
      fields: [
        { name: "Id_c__c", dataType: "Text" },
        { name: "Provider_c__c", dataType: "Text" },
        { name: "Name_c__c", dataType: "Text" }
      ]
    });
    const fields = result.fields as any[];
    expect(fields[0].name).toBe("Id_c");
    expect(fields[1].name).toBe("Provider_c");
    expect(fields[2].name).toBe("Name_c");
  });

  it("adds isPrimaryKey false to non-PK fields", () => {
    const result = transformForCreate({
      name: "Test",
      fields: [
        { name: "Score", dataType: "Number" },
        { name: "Name", dataType: "Text" }
      ]
    });
    const fields = result.fields as any[];
    expect(fields[0].isPrimaryKey).toBe(false);
    expect(fields[1].isPrimaryKey).toBe(false);
  });

  it("preserves isPrimaryKey true on PK fields", () => {
    const result = transformForCreate({
      name: "Test",
      fields: [
        { name: "Id", dataType: "Text", isPrimaryKey: true },
        { name: "Score", dataType: "Number" }
      ]
    });
    const fields = result.fields as any[];
    expect(fields[0].isPrimaryKey).toBe(true);
    expect(fields[1].isPrimaryKey).toBe(false);
  });
});

describe("createDmoTool", () => {
  const mockAuth = {
    getOrgCredentials: vi.fn().mockResolvedValue({
      accessToken: "token",
      instanceUrl: "https://test-org.my.salesforce.com"
    })
  };

  it("returns transformed preview when confirm is false", async () => {
    const mockHttp = { post: vi.fn() };
    const definition = { name: "Test__dlm", fields: [{ name: "Score", type: "Number" }] };

    const result = await createDmoTool(
      { target_org: "TestOrg", definition, confirm: false },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.preview).toBe(true);
    expect((result.definition as any).name).toBe("Test");
    expect((result.definition as any).fields[0].dataType).toBe("Number");
    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  it("creates DMO with transformed definition when confirm is true", async () => {
    const mockHttp = {
      post: vi.fn().mockResolvedValue({ name: "Test__dlm", success: true })
    };
    const definition = { name: "Test__dlm", fields: [{ name: "Score", type: "Number" }] };

    const result = await createDmoTool(
      { target_org: "TestOrg", definition, confirm: true },
      mockAuth as any,
      mockHttp as any
    );

    expect(result.name).toBe("Test__dlm");
    const postBody = mockHttp.post.mock.calls[0][2];
    expect(postBody.name).toBe("Test");
    expect(postBody.fields[0].dataType).toBe("Number");
  });
});
