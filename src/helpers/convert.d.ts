export interface ConversionResult {
  canvas: HTMLCanvasElement;
  downloadUrl: string;
  outputFileName: string;
}

export function convertFile(file: File): Promise<ConversionResult>;
