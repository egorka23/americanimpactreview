import { Metadata } from "next";
import ReviewPrintClient from "./ReviewPrintClient";

export const metadata: Metadata = {
  title: "Peer Review Record — American Impact Review",
  robots: "noindex, nofollow",
};

export default function ReviewPrintPage() {
  return <ReviewPrintClient />;
}
