describe("generateCompletions NoObjectGeneratedError fallback", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("falls back to JSON-only generateText when tool was not called", async () => {
    const generateObject = jest.fn();
    const generateText = jest.fn();

    class MockNoObjectGeneratedError extends Error {
      static isInstance(err: unknown): boolean {
        return err instanceof MockNoObjectGeneratedError;
      }
    }

    generateObject.mockImplementation(() => {
      throw new MockNoObjectGeneratedError(
        "No object generated: the tool was not called.",
      );
    });
    generateText.mockResolvedValue({
      text: JSON.stringify({
        extractedData: { is_built_for_scale: true },
        shouldUseSmartscrape: false,
      }),
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
    });

    jest.doMock("ai", () => ({
      generateObject,
      generateText,
      NoObjectGeneratedError: MockNoObjectGeneratedError,
      jsonSchema: (schema: any) => schema,
      AISDKError: class AISDKError extends Error {},
    }));

    jest.doMock("@dqbd/tiktoken", () => ({
      encoding_for_model: jest.fn(),
    }));

    const { generateCompletions } = await import("./llmExtract");

    const logger: any = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      child: function () {
        return this;
      },
    };
    const costTracking: any = { addCall: jest.fn() };

    const schema = {
      type: "object",
      properties: {
        extractedData: {
          type: "object",
          properties: { is_built_for_scale: { type: "boolean" } },
          required: ["is_built_for_scale"],
          additionalProperties: false,
        },
        shouldUseSmartscrape: { type: "boolean" },
      },
      required: ["extractedData", "shouldUseSmartscrape"],
      additionalProperties: false,
    };

    const res = await generateCompletions({
      logger,
      options: {
        systemPrompt: "Return JSON.",
        prompt: "Extract.",
        schema,
      },
      markdown: "# Title",
      model: "test-model" as any,
      retryModel: "fallback-model" as any,
      costTrackingOptions: { costTracking, metadata: {} },
      metadata: { teamId: "t", functionId: "fn" },
    });

    expect(generateObject).toHaveBeenCalledTimes(1);
    expect(generateText).toHaveBeenCalled();
    expect(res.extract).toEqual({
      extractedData: { is_built_for_scale: true },
      shouldUseSmartscrape: false,
    });
  });
});

