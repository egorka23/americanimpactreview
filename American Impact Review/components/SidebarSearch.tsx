"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listRecentArticles } from "@/lib/firestore";
import type { Article } from "@/lib/types";

export function SidebarSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    listRecentArticles().then(setArticles).catch(() => setArticles([]));
  }, []);

  const suggestions = useMemo(() => {
    const titles = new Set<string>();
    const authors = new Set<string>();
    const categories = new Set<string>();
    articles.forEach((article) => {
      if (article.title) titles.add(article.title);
      if (article.authorUsername) authors.add(`@${article.authorUsername}`);
      if (article.category) categories.add(`#${article.category}`);
    });
    return [...titles, ...authors, ...categories].slice(0, 20);
  }, [articles]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/explore?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section id="search" className="alt">
      <input
        type="text"
        placeholder="Search"
        value={value}
        list="sidebar-search-suggestions"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
        }}
      />
      <datalist id="sidebar-search-suggestions">
        {suggestions.map((item) => (
          <option value={item} key={item} />
        ))}
      </datalist>
    </section>
  );
}
