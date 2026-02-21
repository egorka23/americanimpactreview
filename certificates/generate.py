#!/usr/bin/env python3
"""
Certificate of Publication Generator — American Impact Review

Usage:
  # Single certificate:
  python generate.py --title "Article Title" --author "John Doe, Ph.D." \
    --received "January 15, 2026" --published "February 10, 2026" \
    --doi "10.xxxx/air.2026.001"

  # Batch from CSV:
  python generate.py --csv data.csv

  CSV format (headers):
    title, author, received, published, doi
"""

import argparse
import csv
import os
import re
import subprocess
import sys
from pathlib import Path


TEMPLATE_PATH = Path(__file__).parent / "template.html"
SIGNATURE_PATH = Path(__file__).parent / "signature.svg"
OUTPUT_DIR = Path(__file__).parent / "output"


def slugify(text: str) -> str:
    """Create a safe filename from text."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text[:80]


def fill_template(title: str, author: str, received: str, published: str, doi: str) -> str:
    """Replace placeholders in the HTML template."""
    html = TEMPLATE_PATH.read_text(encoding="utf-8")
    html = html.replace("{{ARTICLE_TITLE}}", title)
    html = html.replace("{{AUTHOR_NAME}}", author)
    html = html.replace("{{RECEIVED_DATE}}", received)
    html = html.replace("{{PUBLISHED_DATE}}", published)
    html = html.replace("{{DOI}}", doi)

    # Inline the signature SVG so Chrome headless can render it
    if SIGNATURE_PATH.exists():
        sig_uri = SIGNATURE_PATH.resolve().as_uri()
        html = html.replace('src="signature.svg"', f'src="{sig_uri}"')

    # Fix font path for Amsterdam.ttf
    font_path = Path(__file__).parent / "Amsterdam.ttf"
    if font_path.exists():
        font_uri = font_path.resolve().as_uri()
        html = html.replace("url('Amsterdam.ttf')", f"url('{font_uri}')")

    return html


def html_to_pdf(html_content: str, output_path: Path):
    """Convert HTML string to PDF using Puppeteer (Node.js)."""
    # Write temp HTML file
    temp_html = output_path.with_suffix(".html")
    temp_html.write_text(html_content, encoding="utf-8")

    render_script = Path(__file__).parent / "render-pdf.js"

    cmd = ["node", str(render_script), str(temp_html.resolve()), str(output_path)]
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=str(Path(__file__).parent))

    # Clean up temp HTML
    temp_html.unlink(missing_ok=True)

    if result.returncode != 0:
        print(f"Chrome error: {result.stderr}")
        sys.exit(1)

    print(f"  -> {output_path}")


def generate_one(title: str, author: str, received: str, published: str, doi: str):
    """Generate a single certificate PDF."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    html = fill_template(title, author, received, published, doi)
    filename = f"certificate-{slugify(author)}.pdf"
    output_path = OUTPUT_DIR / filename

    print(f"Generating: {author} — {title}")
    html_to_pdf(html, output_path)


def generate_batch(csv_path: str):
    """Generate certificates from a CSV file."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            title = row["title"].strip()
            author = row["author"].strip()
            received = row["received"].strip()
            published = row["published"].strip()
            doi = row["doi"].strip()

            html = fill_template(title, author, received, published, doi)
            filename = f"certificate-{slugify(author)}.pdf"
            output_path = OUTPUT_DIR / filename

            print(f"Generating: {author} — {title}")
            html_to_pdf(html, output_path)
            count += 1

    print(f"\nDone! {count} certificate(s) in {OUTPUT_DIR}/")


def main():
    parser = argparse.ArgumentParser(description="Generate Publication Certificates")
    parser.add_argument("--csv", help="Path to CSV file with certificate data")
    parser.add_argument("--title", help="Article title")
    parser.add_argument("--author", help="Author name")
    parser.add_argument("--received", help="Received date")
    parser.add_argument("--published", help="Published date")
    parser.add_argument("--doi", help="DOI value")

    args = parser.parse_args()

    if args.csv:
        generate_batch(args.csv)
    elif args.title and args.author:
        generate_one(
            title=args.title,
            author=args.author,
            received=args.received or "TBD",
            published=args.published or "TBD",
            doi=args.doi or "TBD",
        )
    else:
        parser.print_help()
        print("\nExample:")
        print('  python generate.py --title "My Article" --author "John Doe" \\')
        print('    --received "Jan 1, 2026" --published "Feb 1, 2026" --doi "10.xxx/air.001"')


if __name__ == "__main__":
    main()
