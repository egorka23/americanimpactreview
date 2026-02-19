export interface Reviewer {
  name: string;
  degrees: string;
  affiliation: string;
  expertise: string[];
  orcid?: string;
}

export const reviewers: Reviewer[] = [
  {
    name: "Ilia Kuchumov",
    degrees: "BS",
    affiliation: "Shopify, New York, NY",
    expertise: ["Search Systems", "Machine Learning", "Distributed Systems"],
    orcid: "https://orcid.org/0009-0003-6470-5587",
  },
  {
    name: "Elena Alferova",
    degrees: "MS, CCRP",
    affiliation: "UC San Diego Health - Moores Cancer Center, San Diego, CA",
    expertise: ["Clinical Research Regulatory", "Oncology Clinical Trials", "Drug Development"],
    orcid: "https://orcid.org/0009-0000-2010-9968",
  },
  {
    name: "Yuki Tanaka",
    degrees: "PhD",
    affiliation: "University of Tokyo, Tokyo, Japan",
    expertise: ["Robotics", "Computer Vision", "Human-Robot Interaction"],
  },
  {
    name: "Batyrkhan Saduanov",
    degrees: "BS",
    affiliation: "Nazarbayev University, Astana, Kazakhstan",
    expertise: ["Machine Learning", "Brain-Computer Interfaces", "Programming by Demonstration"],
    orcid: "https://orcid.org/0009-0001-4642-0233",
  },
  {
    name: "Daria Shiian",
    degrees: "",
    affiliation: "DD.NYC, New York, NY",
    expertise: ["Branding", "Premium Positioning", "Visual Identity"],
    orcid: "https://orcid.org/0009-0002-4995-5951",
  },
  {
    name: "Konstantin Smirnov",
    degrees: "PhD",
    affiliation: "DAF Trucks NV, Haifa, Israel",
    expertise: ["Automotive Engineering", "ADAS Systems", "Fleet Diagnostics"],
  },
  {
    name: "Nadia Kowalski",
    degrees: "PhD",
    affiliation: "Max Planck Institute for Informatics, Saarbrücken, Germany",
    expertise: ["Machine Learning", "Data Privacy"],
  },
  {
    name: "Vered Sheinman",
    degrees: "",
    affiliation: "SAP, Raanana, Israel",
    expertise: ["Cloud Computing", "Software Quality Engineering", "Chaos Engineering"],
    orcid: "https://orcid.org/0009-0003-5977-4211",
  },
  {
    name: "Eugeniu Munteanu",
    degrees: "",
    affiliation: "Technical University of Moldova, Chisinau, Moldova",
    expertise: ["Embedded Systems", "Wind Turbine Monitoring", "Sensor Applications"],
    orcid: "https://orcid.org/0000-0003-0388-9127",
  },
  {
    name: "Aichurek Nuralieva",
    degrees: "",
    affiliation: "Coca-Cola Company, Atlanta, GA",
    expertise: ["Human Resources", "Employee Engagement", "AI in HR"],
    orcid: "https://orcid.org/0009-0007-9688-0135",
  },
  {
    name: "Svetlana Repina",
    degrees: "",
    affiliation: "Skyeng, Sao Paulo, Brazil",
    expertise: ["Data Analytics", "User Segmentation", "Product Analytics"],
    orcid: "https://orcid.org/0009-0002-1741-857X",
  },
  {
    name: "Iakov Dzhalatyan",
    degrees: "MS",
    affiliation: "Schlumberger, Yerevan, Armenia",
    expertise: ["Reservoir Engineering", "Formation Testing", "Well Testing"],
    orcid: "https://orcid.org/0009-0001-0479-2637",
  },
  {
    name: "Pylyp Okhonko",
    degrees: "",
    affiliation: "Tential, Rockville, MD",
    expertise: ["Application Security", "Web Vulnerability Research", "Content Security Policy"],
  },
  {
    name: "Olga Maraeva",
    degrees: "",
    affiliation: "Independent Consultant, Charlotte, NC",
    expertise: ["Public Relations", "Strategic Communications", "Marketing"],
  },
];
