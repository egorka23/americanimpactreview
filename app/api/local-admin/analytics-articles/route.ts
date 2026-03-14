import { NextRequest, NextResponse } from "next/server";
import { isLocalAdminRequest } from "@/lib/local-admin";
import { getAllPublishedArticles } from "@/lib/articles";

export async function GET(req: NextRequest) {
  if (!isLocalAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const articles = await getAllPublishedArticles();
    const map: Record<string, { title: string; authors: string[] }> = {};
    for (const a of articles) {
      map[a.slug] = { title: a.title, authors: a.authors || [] };
    }
    return NextResponse.json(map);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load articles" },
      { status: 500 }
    );
  }
}
