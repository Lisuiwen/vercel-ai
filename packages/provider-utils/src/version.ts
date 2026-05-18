// 在构建时注入的该包的版本字符串。
declare const __PACKAGE_VERSION__: string | undefined;
export const VERSION: string =
  typeof __PACKAGE_VERSION__ !== 'undefined'
    ? __PACKAGE_VERSION__
    : '0.0.0-test';
