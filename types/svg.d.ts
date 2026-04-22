// Type declaration so TS recognizes `import Logo from './logo.svg'`.
// The transformer returns a React component. See metro.config.js.
declare module '*.svg' {
  import type { FC } from 'react';
  import type { SvgProps } from 'react-native-svg';
  const content: FC<SvgProps>;
  export default content;
}
