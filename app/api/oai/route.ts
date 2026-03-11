import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishedArticles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const REPO_NAME = "American Impact Review";
const BASE_URL = "https://americanimpactreview.com/api/oai";
const ADMIN_EMAIL = "egor@globaltalentfoundation.org";
const DOI_PREFIX = "10.66308/air.";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return new Date().toISOString().split("T")[0];
  return new Date(d).toISOString().split("T")[0];
}

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [raw];
  } catch {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

function wrapResponse(verb: string, body: string, params: URLSearchParams): string {
  const responseDate = new Date().toISOString();
  const requestAttrs = Array.from(params.entries())
    .map(([k, v]) => `<request ${k}="${escapeXml(v)}">${BASE_URL}</request>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd">
  <responseDate>${responseDate}</responseDate>
  ${requestAttrs || `<request>${BASE_URL}</request>`}
  ${body}
</OAI-PMH>`;
}

function errorResponse(code: string, message: string, params: URLSearchParams): string {
  return wrapResponse("error", `<error code="${code}">${escapeXml(message)}</error>`, params);
}

function identify(params: URLSearchParams): string {
  return wrapResponse(
    "Identify",
    `<Identify>
    <repositoryName>${escapeXml(REPO_NAME)}</repositoryName>
    <baseURL>${BASE_URL}</baseURL>
    <protocolVersion>2.0</protocolVersion>
    <adminEmail>${ADMIN_EMAIL}</adminEmail>
    <earliestDatestamp>2026-01-01</earliestDatestamp>
    <deletedRecord>no</deletedRecord>
    <granularity>YYYY-MM-DD</granularity>
    <description>
      <oai-identifier xmlns="http://www.openarchives.org/OAI/2.0/oai-identifier"
                      xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai-identifier http://www.openarchives.org/OAI/2.0/oai-identifier.xsd">
        <scheme>oai</scheme>
        <repositoryIdentifier>americanimpactreview.com</repositoryIdentifier>
        <delimiter>:</delimiter>
        <sampleIdentifier>oai:americanimpactreview.com:e2026001</sampleIdentifier>
      </oai-identifier>
    </description>
  </Identify>`,
    params
  );
}

function listMetadataFormats(params: URLSearchParams): string {
  return wrapResponse(
    "ListMetadataFormats",
    `<ListMetadataFormats>
    <metadataFormat>
      <metadataPrefix>oai_dc</metadataPrefix>
      <schema>http://www.openarchives.org/OAI/2.0/oai_dc.xsd</schema>
      <metadataNamespace>http://www.openarchives.org/OAI/2.0/oai_dc/</metadataNamespace>
    </metadataFormat>
  </ListMetadataFormats>`,
    params
  );
}

function listSets(params: URLSearchParams): string {
  return wrapResponse(
    "ListSets",
    `<ListSets>
    <set>
      <setSpec>openaire</setSpec>
      <setName>OpenAIRE</setName>
    </set>
    <set>
      <setSpec>driver</setSpec>
      <setName>DRIVER</setName>
    </set>
  </ListSets>`,
    params
  );
}

type ArticleRow = typeof publishedArticles.$inferSelect;

function articleToRecord(article: ArticleRow): string {
  const oaiId = `oai:americanimpactreview.com:${article.slug}`;
  const datestamp = formatDate(article.publishedAt || article.createdAt);
  const authors = parseJsonArray(article.authors);
  const keywords = article.keywords
    ? parseJsonArray(article.keywords).length > 1
      ? parseJsonArray(article.keywords)
      : article.keywords.split(",").map((k) => k.trim().replace(/^["'\[]+|["'\]]+$/g, "")).filter(Boolean)
    : [];
  const doi = article.doi || `${DOI_PREFIX}${article.slug}`;

  const creatorElements = authors
    .map((a) => `        <dc:creator>${escapeXml(a)}</dc:creator>`)
    .join("\n");

  const subjectElements = keywords
    .map((k) => `        <dc:subject>${escapeXml(k)}</dc:subject>`)
    .join("\n");

  return `<record>
      <header>
        <identifier>${oaiId}</identifier>
        <datestamp>${datestamp}</datestamp>
        <setSpec>openaire</setSpec>
        <setSpec>driver</setSpec>
      </header>
      <metadata>
        <oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/"
                   xmlns:dc="http://purl.org/dc/elements/1.1/"
                   xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd">
          <dc:title>${escapeXml(article.title)}</dc:title>
${creatorElements}
${subjectElements}
          <dc:description>${escapeXml(article.abstract || "")}</dc:description>
          <dc:publisher>Global Talent Foundation</dc:publisher>
          <dc:date>${datestamp}</dc:date>
          <dc:type>article</dc:type>
          <dc:format>text/html</dc:format>
          <dc:identifier>https://americanimpactreview.com/article/${article.slug}</dc:identifier>
          <dc:identifier>https://doi.org/${doi}</dc:identifier>
          <dc:source>${escapeXml(REPO_NAME)}</dc:source>
          <dc:language>en</dc:language>
          <dc:rights>https://creativecommons.org/licenses/by/4.0/</dc:rights>
          <dc:rights>open access</dc:rights>
        </oai_dc:dc>
      </metadata>
    </record>`;
}

async function getPublishedArticles(from?: string, until?: string): Promise<ArticleRow[]> {
  const rows = await db
    .select()
    .from(publishedArticles)
    .where(eq(publishedArticles.status, "published"));

  return rows.filter((r) => {
    if (r.visibility !== "public") return false;
    if (from || until) {
      const d = formatDate(r.publishedAt || r.createdAt);
      if (from && d < from) return false;
      if (until && d > until) return false;
    }
    return true;
  });
}

async function listRecords(params: URLSearchParams): Promise<string> {
  const prefix = params.get("metadataPrefix");
  if (prefix !== "oai_dc") {
    return errorResponse("cannotDisseminateFormat", "Only oai_dc is supported", params);
  }

  const from = params.get("from") || undefined;
  const until = params.get("until") || undefined;
  const articles = await getPublishedArticles(from, until);

  if (articles.length === 0) {
    return errorResponse("noRecordsMatch", "No records match the request", params);
  }

  const records = articles.map(articleToRecord).join("\n");
  return wrapResponse("ListRecords", `<ListRecords>\n${records}\n</ListRecords>`, params);
}

async function listIdentifiers(params: URLSearchParams): Promise<string> {
  const prefix = params.get("metadataPrefix");
  if (prefix !== "oai_dc") {
    return errorResponse("cannotDisseminateFormat", "Only oai_dc is supported", params);
  }

  const from = params.get("from") || undefined;
  const until = params.get("until") || undefined;
  const articles = await getPublishedArticles(from, until);

  if (articles.length === 0) {
    return errorResponse("noRecordsMatch", "No records match the request", params);
  }

  const headers = articles
    .map((a) => {
      const oaiId = `oai:americanimpactreview.com:${a.slug}`;
      const datestamp = formatDate(a.publishedAt || a.createdAt);
      return `<header>
      <identifier>${oaiId}</identifier>
      <datestamp>${datestamp}</datestamp>
      <setSpec>openaire</setSpec>
    </header>`;
    })
    .join("\n");

  return wrapResponse("ListIdentifiers", `<ListIdentifiers>\n${headers}\n</ListIdentifiers>`, params);
}

async function getRecord(params: URLSearchParams): Promise<string> {
  const prefix = params.get("metadataPrefix");
  if (prefix !== "oai_dc") {
    return errorResponse("cannotDisseminateFormat", "Only oai_dc is supported", params);
  }

  const identifier = params.get("identifier");
  if (!identifier) {
    return errorResponse("badArgument", "Missing identifier", params);
  }

  const slug = identifier.replace("oai:americanimpactreview.com:", "");
  const rows = await db
    .select()
    .from(publishedArticles)
    .where(eq(publishedArticles.slug, slug));

  if (rows.length === 0) {
    return errorResponse("idDoesNotExist", "Record not found", params);
  }

  const record = articleToRecord(rows[0]);
  return wrapResponse("GetRecord", `<GetRecord>\n${record}\n</GetRecord>`, params);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const verb = params.get("verb");

  let xml: string;

  switch (verb) {
    case "Identify":
      xml = identify(params);
      break;
    case "ListMetadataFormats":
      xml = listMetadataFormats(params);
      break;
    case "ListSets":
      xml = listSets(params);
      break;
    case "ListRecords":
      xml = await listRecords(params);
      break;
    case "ListIdentifiers":
      xml = await listIdentifiers(params);
      break;
    case "GetRecord":
      xml = await getRecord(params);
      break;
    default:
      xml = errorResponse("badVerb", "Illegal OAI-PMH verb", params);
  }

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
