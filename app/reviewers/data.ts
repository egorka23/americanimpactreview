export interface Reviewer {
  name: string;
  degrees: string;
  affiliation: string;
  expertise: string[];
  orcid?: string;
}

export const reviewers: Reviewer[] = [
  {
    name: "Sarah Chen",
    degrees: "PhD",
    affiliation: "Stanford University, Stanford, CA",
    expertise: ["Artificial Intelligence", "Natural Language Processing"],
    orcid: "https://orcid.org/0000-0002-1234-5678",
  },
  {
    name: "Marcus Rivera",
    degrees: "MD, MPH",
    affiliation: "Johns Hopkins Bloomberg School of Public Health, Baltimore, MD",
    expertise: ["Epidemiology", "Global Health"],
  },
  {
    name: "Elena Petrova",
    degrees: "PhD",
    affiliation: "ETH Zurich, Zurich, Switzerland",
    expertise: ["Computational Biology", "Genomics", "Bioinformatics"],
    orcid: "https://orcid.org/0000-0003-9876-5432",
  },
  {
    name: "David Okonkwo",
    degrees: "PhD, MBA",
    affiliation: "University of Michigan, Ann Arbor, MI",
    expertise: ["Entrepreneurship", "Business Strategy", "Innovation Management"],
  },
  {
    name: "Aisha Patel",
    degrees: "PhD",
    affiliation: "Imperial College London, London, UK",
    expertise: ["Renewable Energy", "Materials Science"],
    orcid: "https://orcid.org/0000-0001-5555-7777",
  },
  {
    name: "James Whitfield",
    degrees: "PsyD",
    affiliation: "University of California, Los Angeles, CA",
    expertise: ["Clinical Psychology", "Cognitive Behavioral Therapy"],
  },
  {
    name: "Yuki Tanaka",
    degrees: "PhD",
    affiliation: "University of Tokyo, Tokyo, Japan",
    expertise: ["Robotics", "Computer Vision", "Human-Robot Interaction"],
    orcid: "https://orcid.org/0000-0002-8888-3333",
  },
  {
    name: "Carlos Mendoza",
    degrees: "MD",
    affiliation: "Mayo Clinic, Rochester, MN",
    expertise: ["Cardiology", "Clinical Trials"],
  },
  {
    name: "Nadia Kowalski",
    degrees: "PhD",
    affiliation: "Max Planck Institute for Informatics, Saarbrücken, Germany",
    expertise: ["Machine Learning", "Data Privacy"],
    orcid: "https://orcid.org/0000-0003-2222-4444",
  },
  {
    name: "Robert Chang",
    degrees: "MS",
    affiliation: "Tesla Inc., Austin, TX",
    expertise: ["Battery Technology", "Energy Storage", "Electrical Engineering"],
  },
  {
    name: "Olga Maraeva",
    degrees: "",
    affiliation: "Independent Consultant, Charlotte, NC",
    expertise: ["Public Relations", "Strategic Communications", "Marketing"],
  },
];
