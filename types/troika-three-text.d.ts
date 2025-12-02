declare module 'troika-three-text' {
  export function configureTextGeometry(geometry: any, options?: any): void;
  export function preloadFont(url: string, options?: any): Promise<void>;
  export const Text: {
    new (...args: any[]): any;
  };
}

