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
    name: "Ilia Kuchumov",
    degrees: "BS",
    affiliation: "Shopify, New York, NY",
    expertise: ["Search Systems", "Machine Learning", "Distributed Systems"],
    orcid: "https://orcid.org/0009-0003-6470-5587",
  },
  {
    name: "Iakov Dzhalatyan",
    degrees: "MS",
    affiliation: "Schlumberger, Moscow, Russia",
    expertise: ["Reservoir Engineering", "Formation Testing", "Well Testing"],
    orcid: "https://orcid.org/0009-0001-0479-2637",
  },
  {
    name: "Daria Shiian",
    degrees: "",
    affiliation: "DD.NYC, New York, NY",
    expertise: ["Branding", "Premium Positioning", "Visual Identity"],
    orcid: "https://orcid.org/0009-0002-4995-5951",
  },
  {
    name: "Eugeniu Munteanu",
    degrees: "",
    affiliation: "Technical University of Moldova, Chisinau, Moldova",
    expertise: ["Embedded Systems", "Wind Turbine Monitoring", "Sensor Applications"],
    orcid: "https://orcid.org/0000-0003-0388-9127",
  },
  {
    name: "Konstantin Smirnov",
    degrees: "PhD",
    affiliation: "DAF Trucks NV, Haifa, Israel",
    expertise: ["Automotive Engineering", "ADAS Systems", "Fleet Diagnostics"],
  },
  {
    name: "Svetlana Repina",
    degrees: "",
    affiliation: "Skyeng, Moscow, Russia",
    expertise: ["Data Analytics", "User Segmentation", "Product Analytics"],
    orcid: "https://orcid.org/0009-0002-1741-857X",
  },
  {
    name: "Aichurek Nuralieva",
    degrees: "",
    affiliation: "Coca-Cola Company, Atlanta, GA",
    expertise: ["Human Resources", "Employee Engagement", "AI in HR"],
    orcid: "https://orcid.org/0009-0007-9688-0135",
  },
  {
    name: "Olga Maraeva",
    degrees: "",
    affiliation: "Independent Consultant, Charlotte, NC",
    expertise: ["Public Relations", "Strategic Communications", "Marketing"],
  },
];
