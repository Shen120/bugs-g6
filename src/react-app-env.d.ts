/// <reference types="react-scripts" />

declare module "*.css";
declare module "*.less" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module "*.module.less" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";