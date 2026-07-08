import { readdir, readFile, writeFile } from "node:fs/promises";

const publicDir = new URL("../.output/public/", import.meta.url);
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

function getPagesBase() {
  const envBase = process.env.GITHUB_PAGES_BASE?.trim();
  if (envBase) {
    return `/${envBase.replace(/^\/+|\/+$/g, "")}`;
  }

  if (typeof packageJson.homepage === "string") {
    const { pathname } = new URL(packageJson.homepage);
    return pathname.replace(/\/+$/g, "");
  }

  return "";
}

const base = getPagesBase();
const assets = await readdir(new URL("assets/", publicDir));
const entry = assets.find((file) => /^index-.*\.js$/.test(file));
const stylesheet = assets.find((file) => /^styles-.*\.css$/.test(file));

if (!entry) {
  throw new Error("Could not find the generated client entry in .output/public/assets");
}

const assetPath = (file) => `${base}/assets/${file}`;

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>مركز الفرقان القرآني — بوابة الخير</title>
    <meta name="description" content="نظام فارس اليوم وفارس الأسبوع لطلاب مركز الفرقان القرآني.">
    <link rel="icon" href="${base}/favicon.ico" type="image/x-icon">
    ${stylesheet ? `<link rel="stylesheet" href="${assetPath(stylesheet)}">` : ""}
    <script>
      (function () {
        var params = new URLSearchParams(window.location.search);
        var redirectPath = params.get("p");
        if (!redirectPath) return;
        params.delete("p");
        var query = params.toString().replace(/~and~/g, "&");
        var normalizedPath = redirectPath.charAt(0) === "/" ? redirectPath : "/" + redirectPath;
        window.history.replaceState(null, "", "${base}" + normalizedPath + (query ? "?" + query : "") + window.location.hash);
      })();
    </script>
    <script type="module" src="${assetPath(entry)}"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

await writeFile(new URL("index.html", publicDir), html);
console.log(`Prepared GitHub Pages artifact at .output/public with base '${base || "/"}'.`);
