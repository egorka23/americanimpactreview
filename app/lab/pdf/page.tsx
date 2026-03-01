import { notFound } from "next/navigation";
import PdfLabClient from "./PdfLabClient";

export const dynamic = "force-dynamic";

export default function PdfLabPage() {
  if (process.env.PDF_LAB_ENABLED !== "true") {
    notFound();
  }

  return <PdfLabClient />;
}
