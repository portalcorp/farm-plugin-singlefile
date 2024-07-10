import type { JsPlugin } from "@farmfe/core";
interface Options {
    inlinePattern?: string[];
    deleteInlinedFiles?: boolean;
}
export default function farmSingleFilePlugin(options?: Options): JsPlugin;
export {};
