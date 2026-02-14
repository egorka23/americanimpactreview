export const TAXONOMY: Record<string, string[]> = {
  "Computer Science": ["Systems & Infrastructure", "Cybersecurity", "Software Engineering", "Networking"],
  "Health & Biotech": ["Genomics", "Immunology", "Public Health", "Biomedical Devices"],
  "AI & Data": ["Machine Learning", "NLP", "Computer Vision", "Data Ethics"],
  "Marketing": ["Digital Marketing", "MarTech", "Consumer Behavior", "Advertising"],
  "Business": ["Management", "Strategy", "Entrepreneurship", "Finance"],
  "Sports Science": ["Biomechanics", "Physiology", "Nutrition", "Performance Analysis"],
  "Sports Medicine": ["Diagnostics", "Rehabilitation", "Injury Prevention", "Exercise Physiology"],
  "Energy & Climate": ["Solar & Wind", "Grid Systems", "Climate Policy", "Sustainability"],
  "Human Performance": ["Cognitive Science", "Ergonomics", "Training Methods", "Wearable Tech"],
  "Social Sciences": ["Education", "Economics", "Policy Analysis", "Urban Studies"],
  "Engineering": ["Robotics", "Materials Science", "Aerospace", "Civil Engineering"],
  "Art & Design": ["Visual Arts", "Music", "Photography", "Art History"],
  "Beauty & Wellness": ["Cosmetology", "Aesthetics", "Nutrition", "Mindfulness"],
};

export const CATEGORIES = Object.keys(TAXONOMY);

export const CATEGORY_COLORS: Record<string, string> = {
  "Computer Science": "#2563eb",      // blue
  "Health & Biotech": "#059669",      // emerald
  "AI & Data": "#7c3aed",            // violet
  "Marketing": "#ea580c",            // orange
  "Business": "#ca8a04",             // amber
  "Sports Science": "#dc2626",       // red
  "Sports Medicine": "#0d9488",      // teal
  "Energy & Climate": "#16a34a",     // green
  "Human Performance": "#0891b2",    // cyan
  "Social Sciences": "#6366f1",      // indigo
  "Engineering": "#475569",          // slate
  "Art & Design": "#c026d3",         // fuchsia
  "Beauty & Wellness": "#ec4899",    // pink
};
