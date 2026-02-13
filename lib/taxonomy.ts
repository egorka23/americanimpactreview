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
  "Computer Science": "#2563eb",
  "Health & Biotech": "#059669",
  "AI & Data": "#7c3aed",
  "Marketing": "#ea580c",
  "Business": "#ca8a04",
  "Sports Science": "#dc2626",
  "Sports Medicine": "#e11d48",
  "Energy & Climate": "#d97706",
  "Human Performance": "#0891b2",
  "Social Sciences": "#6366f1",
  "Engineering": "#475569",
  "Art & Design": "#be185d",
  "Beauty & Wellness": "#ec4899",
};
