declare module "mammoth" {
  interface ConversionResult {
    value: string;
    messages: unknown[];
  }
  function extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<ConversionResult>;
}
