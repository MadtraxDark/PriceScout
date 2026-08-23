import { crawlKabumProducts } from "../utils/scraping/kabum.ts";

const urls = process.argv.slice(2);
if (urls.length === 0) {
  throw new Error("Informe ao menos uma URL de produto KaBuM.");
}

const products = await crawlKabumProducts(urls);
process.stdout.write(`${JSON.stringify(products, null, 2)}\n`);
