const fs = require("fs");
const path = require("path");

async function syncCategories() {
  console.log("Fetching categories/genres from Meosss...");
  const all = [];

  for (let page = 1; page <= 10; page++) {
    try {
      const res = await fetch(
        `https://meosss.com/wp-json/wp/v2/genre?per_page=100&page=${page}&orderby=count&order=desc`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        },
      );
      if (!res.ok) break;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;
      all.push(...data);
      console.log(`Page ${page}: fetched ${data.length} genres.`);
    } catch (err) {
      console.error(`Error on page ${page}:`, err.message);
      break;
    }
  }

  function clean(str) {
    if (!str) return "";
    return str
      .replace(/&gt;/g, ">")
      .replace(/&lt;/g, "<")
      .replace(/&amp;/g, "&")
      .replace(/&#8211;/g, "-")
      .replace(/&quot;/g, '"')
      .replace(/&#8217;/g, "'");
  }

  const cleaned = all.map((g) => ({
    id: g.id,
    name: clean(g.name),
    slug: g.slug,
    count: g.count,
  }));

  // Sort by count descending, then alphabetical
  cleaned.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const targetPath = path.join(
    __dirname,
    "..",
    "src",
    "constants",
    "meosss_genres.json",
  );
  fs.writeFileSync(targetPath, JSON.stringify(cleaned, null, 2));

  console.log(
    `Successfully synced ${cleaned.length} categories to src/constants/meosss_genres.json!`,
  );
}

syncCategories().catch(console.error);
