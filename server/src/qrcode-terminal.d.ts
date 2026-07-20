declare module 'qrcode-terminal' {
  interface Options {
    small?: boolean;
  }
  const qrcode: {
    generate(text: string, opts?: Options, cb?: (code: string) => void): void;
    setErrorLevel(level: string): void;
  };
  export default qrcode;
}
