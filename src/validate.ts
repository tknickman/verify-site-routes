import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import xml2js from "xml2js";
import path from "path";

interface SitemapUrl {
  loc: string[];
}

async function fetchSitemap(sitemapDomain: string): Promise<string[]> {
  const sitemapUrl = `${sitemapDomain}/sitemap.xml`;
  const response = await fetch(sitemapUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
  }

  const xmlData = await response.text();
  const result = await xml2js.parseStringPromise(xmlData);

  // Assuming the URLs are in the <urlset><url><loc>...</loc></url> format
  return result.urlset.url.map((entry: SitemapUrl) => entry.loc[0]);
}

async function fetchPageTitle(
  pageUrl: string,
  protectionBypass?: string
): Promise<string | null> {
  // if the protectionBypass is provided, set the x-vercel-protection-bypass header
  const headers: Record<string, string> = protectionBypass
    ? { "x-vercel-protection-bypass": protectionBypass }
    : {};
  const response = await fetch(pageUrl, {
    headers,
  });

  if (!response.ok) {
    console.log(`• ❌ Failed - Status: ${response.status} (${pageUrl})`);
    return null;
  }

  const text = await response.text();
  const dom = new JSDOM(text);
  const title =
    dom.window.document.querySelector("title")?.textContent || "No title found";

  return title;
}

interface ValidatePagesOptions {
  batch?: string;
  protectionBypass?: string;
  path?: string;
}

export async function validatePages(
  sitemapDomain: string,
  testDomain: string,
  opts: ValidatePagesOptions
): Promise<void> {
  const batchSize = Number(opts.batch ?? 10);
  const pathFilter = opts.path ?? "";
  let totalChecked = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  try {
    const pages = await fetchSitemap(sitemapDomain);
    for (let i = 0; i < pages.length; i += batchSize) {
      const batch = pages.slice(i, i + batchSize);
      const checkPromises = batch.map(async (page) => {
        // Skip if the page does not start with the specified path filter
        if (pathFilter && !page.startsWith(`${sitemapDomain}/${pathFilter}`)) {
          console.log(`• ⏩ Skipped - ${page}`);
          skipped++;
          return;
        }

        const testUrl = page.replace(sitemapDomain, testDomain); // Replace sitemap domain with test domain
        totalChecked++;

        const title = await fetchPageTitle(testUrl, opts.protectionBypass);

        if (title) {
          console.log(`• ✅ ${title} ([2m${testUrl}[0m)`); // Output with a dimmed URL
          passed++;
        } else {
          failed++;
        }
      });

      await Promise.all(checkPromises); // Process batch concurrently
    }

    // Summary

    console.log(
      `\n\nValidated all pages from "${sitemapDomain}" exist on "${testDomain}"`
    );
    console.log(`  • Path Filter: ${pathFilter || "None"}`);

    console.log(`\nSummary:`);
    console.log(
      `  • Total URLs Checked: ${totalChecked} / ${pages.length} (${(
        (totalChecked / pages.length) *
        100
      ).toFixed(2)}%)`
    );
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  ⏩ Skipped: ${skipped}`);

    // Exit with code 1 if any pages failed, otherwise exit with code 0
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error(`Error validating pages: ${error.message}`);
    process.exit(1); // Exit with code 1 on error
  }
}
