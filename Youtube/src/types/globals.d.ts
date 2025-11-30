declare module '*.css' {
  // The content doesn't matter much for CSS since it's a side-effect import
  // but this is a common declaration pattern for asset files.
  const content: any;
  export default content;
}