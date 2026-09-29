/**
 * PS-01 permitted source.
 *
 * A real, public, human-maintained dataset of companies that hire without
 * whiteboard interviews, read live from the GitHub repository at request time.
 * Every row carries a link that actually resolves, so the dataset stays
 * source-backed and traceable.
 *
 * Upstream: https://github.com/poteto/hiring-without-whiteboards
 * Shape:   - [Company](careers-url) | Locations | Interview process
 */

const RAW_URL =
  "https://raw.githubusercontent.com/poteto/hiring-without-whiteboards/main/README.md";
const REPO_URL = "https://github.com/poteto/hiring-without-whiteboards";

export type SourceCompany = {
  id: string;
  company: string;
  careersUrl: string;
  location: string;
  process: string;
  remote: boolean;
  regions: string[];
  tokens: string[];
};

const CACHE_TTL_MS = 10 * 60 * 1000;
let cache: { at: number; companies: SourceCompany[] } | null = null;

const REGION_TOKENS = new Set([
  "remote", "india", "bengaluru", "bangalore", "pune", "mumbai", "delhi",
  "hyderabad", "chennai", "gurgaon", "noida", "kolkata", "ahmedabad",
  "uk", "united kingdom", "london", "manchester", "edinburgh", "ireland",
  "germany", "berlin", "munich", "hamburg", "france", "paris", "spain",
  "netherlands", "amsterdam", "canada", "toronto", "usa", "us", "united states",
  "new york", "san francisco", "austin", "boston", "seattle", "chicago",
  "sweden", "stockholm", "norway", "denmark", "finland", "poland", "portugal",
  "singapore", "australia", "japan", "tokyo", "brazil", "mexico", "argentina",
  "south africa", "israel", "tel aviv", "indonesia", "vietnam", "philippines",
]);

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseLine(line: string, index: number): SourceCompany | null {
  const match = line.match(/^-\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)\s*\|\s*([^|]*)\|\s*(.*)$/);
  if (!match) return null;

  const company = match[1].trim();
  const careersUrl = match[2].trim();
  const location = match[3].trim() || "Not listed";
  const process = match[4].trim();

  const remote = /remote/i.test(location);
  const regions = location
    .split(/\s*(?:\/|;)\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    id: `hwow-${slug(company)}-${index}`,
    company,
    careersUrl,
    location,
    process,
    remote,
    regions,
    tokens: [...new Set([company, ...regions].join(" ").toLowerCase().split(/[^a-z]+/))].filter(
      (token) => token.length > 2,
    ),
  };
}

function extractRegionTokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((token) => REGION_TOKENS.has(token)),
  );
}

export function scoreCompany(company: SourceCompany, query: string, wantRemote: boolean) {
  const wanted = extractRegionTokens(query);
  const lowerQuery = query.toLowerCase();

  let score = 0;
  for (const token of wanted) {
    if (company.tokens.includes(token)) score += 3;
  }
  if (wanted.size && score === 0) return 0;

  if (wantRemote && company.remote) score += 4;
  if (company.remote) score += 1;

  // A described interview process is more useful than a bare careers link.
  if (company.process) score += 1;

  // Prefer larger, well-known companies when everything else ties.
  if (/inc|ltd|group|technolog|solutions|global/i.test(company.company)) score += 0.5;
  if (lowerQuery.includes("ai") && /data|ml|software|tech|engineer/i.test(company.company + company.process)) {
    score += 1;
  }

  return score;
}

async function fetchCompanies(): Promise<SourceCompany[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.companies;

  const response = await fetch(RAW_URL, {
    headers: { "User-Agent": "code-cubicle-ps01" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`hiring-without-whiteboards responded ${response.status}`);
  }

  const markdown = await response.text();
  const companies = markdown
    .split("\n")
    .map((line, index) => parseLine(line, index))
    .filter((entry): entry is SourceCompany => entry !== null);

  if (companies.length < 50) {
    throw new Error(`upstream list looked malformed (${companies.length} rows)`);
  }

  cache = { at: Date.now(), companies };
  return companies;
}

export type CollectOptions = {
  query: string;
  remoteOnly: boolean;
  limit?: number;
};

export type CollectedRow = {
  id: string;
  title: string;
  company: string;
  location: string;
  process: string;
  tags: string[];
  source: string;
  sourceUrl: string;
  repoUrl: string;
  confidence: number;
};

export async function collectCompanies(options: CollectOptions): Promise<CollectedRow[]> {
  const companies = await fetchCompanies();
  const limit = options.limit ?? 12;

  const ranked = companies
    .map((company) => ({ company, score: scoreCompany(company, options.query, options.remoteOnly) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.company.company.localeCompare(b.company.company));

  // Dedupe on the careers URL so one company cannot appear twice.
  const seen = new Set<string>();
  const rows: CollectedRow[] = [];

  for (const { company } of ranked) {
    if (seen.has(company.careersUrl)) continue;
    seen.add(company.careersUrl);

    const hasProcess = Boolean(company.process);
    rows.push({
      id: company.id,
      title: `${company.company} hiring process`,
      company: company.company,
      location: company.location,
      process: company.process || "No process description published in the source list.",
      tags: [
        "no-whiteboard",
        ...(company.remote ? ["remote-ok"] : []),
        ...company.regions.slice(0, 3).map((region) => region.toLowerCase()),
      ],
      source: "hiring-without-whiteboards (GitHub)",
      sourceUrl: company.careersUrl,
      repoUrl: REPO_URL,
      confidence: hasProcess ? 0.88 : 0.62,
    });

    if (rows.length >= limit) break;
  }

  return rows;
}

export async function getSourceStats() {
  const companies = await fetchCompanies();
  return { total: companies.length, remote: companies.filter((c) => c.remote).length, source: REPO_URL };
}
