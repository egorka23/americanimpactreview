import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiIntakeRuns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureLocalAdminSchema, isLocalAdminRequest } from "@/lib/local-admin";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!isLocalAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureLocalAdminSchema();

    const [row] = await db
      .select()
      .from(aiIntakeRuns)
      .where(eq(aiIntakeRuns.id, params.id));

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: row.id,
      status: row.status,
      extracted: row.extractedJson ? JSON.parse(row.extractedJson) : null,
      confidence: row.confidenceJson ? JSON.parse(row.confidenceJson) : null,
      warnings: row.warningsJson ? JSON.parse(row.warningsJson) : [],
      evidence: row.evidenceJson ? JSON.parse(row.evidenceJson) : null,
      file: { url: row.originalFileUrl, name: row.originalFileName },
      modelVersion: row.modelVersion,
      error: row.errorMessage,
    });
  } catch (error) {
    console.error("AI intake status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
