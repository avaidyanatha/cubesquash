declare module './cardlink/index.js' {
  const plugin: import('unified').Plugin<[]>;
  export default plugin;
}
declare module './cardrow/index.js' {
  const plugin: import('unified').Plugin<[]>;
  export default plugin;
}
declare module './centering/index.js' {
  const plugin: import('unified').Plugin<[]>;
  export default plugin;
}
declare module './symbols/index.js' {
  const plugin: import('unified').Plugin<[{ allowed?: string[] }?]>;
  export default plugin;
}
declare module './userlink/index.js' {
  const plugin: import('unified').Plugin<[{ callback?: (name: string) => void }?]>;
  export default plugin;
}
