import micromatch from "micromatch";
import path from "path";
import fs from "fs/promises";
import mime from "mime-types";
import type { JsPlugin, PluginFinalizeResourcesHookParams } from "@farmfe/core";

interface Options {
  inlinePattern?: string[];
  // removeFarmModuleLoader?: boolean;
  deleteInlinedFiles?: boolean;
}

const defaultOptions: Options = {
  inlinePattern: [],
  deleteInlinedFiles: true,
};

function escapeClosingScriptTag(str: string): string {
  return str.replace(/<\/script/gi, "<\\/script");
}

function replaceScript(
  html: string,
  scriptFilename: string,
  scriptCode: string
  // removeFarmModuleLoader = false
): string {
  const reScript = new RegExp(`<script([^>]*?) src=["']?[/]*${scriptFilename}["']? ([^>]*)></script>`);
  const preloadMarker = /"?__VITE_PRELOAD__"?/g;
  const newCode = scriptCode.replace(preloadMarker, "void 0");
  const escapedCode = escapeClosingScriptTag(newCode);
  const inlined = html.replace(
    reScript,
    (_, beforeSrc, afterSrc) => `<script${beforeSrc} ${afterSrc}>${escapedCode}</script>`
  );
  // return removeFarmModuleLoader ? _removeFarmModuleLoader(inlined) : inlined;
  return inlined;
}

function replaceCss(html: string, scriptFilename: string, scriptCode: string): string {
  const reStyle = new RegExp(`<link([^>]*?) href=/${scriptFilename}>`);
  const legacyCharSetDeclaration = /@charset "UTF-8";/;
  const inlined = html.replace(reStyle, (_, beforeSrc, afterSrc) => `<style${beforeSrc}>${scriptCode}</style>`);
  return inlined;
}

async function replaceMedia(html: string, resourcesMap: any, basePath: string): Promise<string> {
  // Replace static media
  const mediaRegex = /<(img|audio|video)([^>]*?)(src|poster)=["']([^"']+)["']([^>]*)>/gi;
  let processedHtml = await Promise.all(
    html.split(mediaRegex).map(async (part, i) => {
      if (i % 6 === 0) return part;
      if (i % 6 === 4) {
        const filePath = path.join(basePath, part);
        try {
          const resource = resourcesMap[filePath];
          if (resource) {
            const mimeType = mime.lookup(filePath) || "application/octet-stream";
            const base64 = Buffer.from(resource.bytes).toString("base64");
            return `data:${mimeType};base64,${base64}`;
          } else {
            console.warn(`Resource not found: ${filePath}`);
            return part;
          }
        } catch (error) {
          console.error(`Error processing media file: ${filePath}`, error);
          return part;
        }
      }
      return part;
    })
  ).then((parts) => parts.join(""));

  // Replace dynamically injected media
  // Handle cases where the URL is assigned to a variable
  const variableAssignmentRegex = /\b(let|const|var)\s+(\w+)\s*=\s*["'](\/.+?)["']/g;
  processedHtml = processedHtml.replace(variableAssignmentRegex, (match, keyword, varName, url) => {
    const filePath = url.slice(1); // Remove the leading slash
    const resource = resourcesMap[filePath];
    if (resource) {
      const mimeType = mime.lookup(filePath) || "application/octet-stream";
      const base64 = Buffer.from(resource.bytes).toString("base64");
      return `${keyword} ${varName}="data:${mimeType};base64,${base64}"`;
    }
    return match;
  });

  return processedHtml;
}

const isJsFile = /\.[mc]?js$/;
const isCssFile = /\.css$/;
const isHtmlFile = /\.html?$/;

// const _removeFarmModuleLoader = (html: string) =>
//   html.replaceAll(
//     /<script[^>]*(?:data-farm-resource=true|data-farm-entry-script=true|farm_entry=true)[^>]*>[\s\S]*?<\/script>/g,
//     ''
//   );

export default function farmSingleFilePlugin(options?: Options): JsPlugin {
  const mergedOptions = { ...defaultOptions, ...options };
  return {
    name: "farm-plugin-singlefile",
    finalizeResources: {
      async executor(params: PluginFinalizeResourcesHookParams) {
        const { resourcesMap } = params;
        const htmlResource = Object.values(resourcesMap).find((r) => r.resourceType === "html");

        if (htmlResource) {
          let htmlContent = Buffer.from(htmlResource.bytes).toString("utf-8");
          const bundlesToDelete: string[] = [];

          for (const [filename, resource] of Object.entries(resourcesMap)) {
            if (
              mergedOptions.inlinePattern &&
              mergedOptions.inlinePattern.length &&
              !micromatch.isMatch(filename, mergedOptions.inlinePattern)
            ) {
              console.debug(`NOTE: asset not inlined: ${filename}`);
              continue;
            }

            if (resource.resourceType === "js" && isJsFile.test(filename)) {
              const content = Buffer.from(resource.bytes).toString("utf-8");
              htmlContent = replaceScript(
                htmlContent,
                filename,
                content
                // options.removeFarmModuleLoader
              );
              bundlesToDelete.push(filename);
            } else if (resource.resourceType === "css" && isCssFile.test(filename)) {
              const content = Buffer.from(resource.bytes).toString("utf-8");
              htmlContent = replaceCss(htmlContent, filename, content);
              bundlesToDelete.push(filename);
            }
          }

          // Inline media files (both static and dynamic)
          const basePath = path.dirname(htmlResource.name);
          htmlContent = await replaceMedia(htmlContent, resourcesMap, basePath);

          htmlResource.bytes = [...Buffer.from(htmlContent, "utf-8")];

          if (mergedOptions.deleteInlinedFiles !== false) {
            for (const name of bundlesToDelete) {
              delete resourcesMap[name];
            }
          }

          return {
            [htmlResource.name]: htmlResource,
          };
        }

        return resourcesMap;
      },
    },
  };
}
