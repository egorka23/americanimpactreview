"use client";

import { useState } from "react";
import { seedFakeData } from "@/lib/seed";

export default function SeedPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      const result = await seedFakeData();
      setStatus(result.status);
    } catch (error) {
      setStatus("failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <header className="major">
        <h2>Seed demo data</h2>
      </header>
      <p>Creates 10 sample articles and 5 sample profiles if your database is empty.</p>
      <ul className="actions">
        <li>
          <button className="button" onClick={handleSeed} disabled={loading}>
            {loading ? "Seeding..." : "Seed fake articles"}
          </button>
        </li>
      </ul>
      {status ? <p>Status: {status}</p> : null}
    </section>
  );
}
