export interface IndustryDefinition {
  id: string;
  label: string;
  searchNouns: string[];
  suggestedNiches: string[];
}

export const INDUSTRY_TAXONOMY: IndustryDefinition[] = [
  {
    id: "food_hospitality",
    label: "Food & Hospitality",
    searchNouns: ["restaurants", "delivery chains", "eateries", "cafes", "spots"],
    suggestedNiches: [
      "Pizza & Fast Food Delivery",
      "Burgers & Fast Casual",
      "Specialty Coffee & Cafes",
      "Fine Dining & Contemporary",
      "Artisanal Bakery & Desserts",
      "Cloud Kitchens & Catering",
      "Casual Dining & Grill",
    ],
  },
  {
    id: "software_tech",
    label: "Software & Technology",
    searchNouns: ["platforms", "software", "tools", "solutions", "companies"],
    suggestedNiches: [
      "B2B SaaS Platforms",
      "AI & Data Analytics Solutions",
      "Custom Web & App Development",
      "Cloud Infrastructure & DevOps",
      "Cybersecurity Services",
      "MarTech & AdTech",
      "FinTech & Payments Software",
    ],
  },
  {
    id: "healthcare_wellness",
    label: "Healthcare & Wellness",
    searchNouns: ["clinics", "practices", "centers", "doctors", "specialists"],
    suggestedNiches: [
      "Dental & Orthodontics Clinics",
      "Medical Aesthetics & Dermatology",
      "Physiotherapy & Sports Rehab",
      "Mental Health & Psychotherapy",
      "Specialized Medical Clinics",
      "Diagnostic & Telehealth Services",
    ],
  },
  {
    id: "fashion_apparel",
    label: "Apparel, Fashion & Luxury",
    searchNouns: ["brands", "labels", "boutiques", "designers", "stores"],
    suggestedNiches: [
      "Luxury & Pret Womenswear",
      "Men's Apparel & Tailoring",
      "Footwear & Leather Goods",
      "Jewelry & Accessories",
      "Activewear & Athleisure",
      "Sustainable & Eco Fashion",
    ],
  },
  {
    id: "beauty_personal_care",
    label: "Beauty & Personal Care",
    searchNouns: ["salons", "spas", "studios", "parlours", "clinics"],
    suggestedNiches: [
      "Hair & Beauty Salons",
      "Day Spa & Wellness Retreats",
      "Skincare & Cosmetics Brands",
      "Nail, Lash & Brow Studios",
      "Barbershop & Men's Grooming",
    ],
  },
  {
    id: "professional_services",
    label: "Professional & Business Services",
    searchNouns: ["agencies", "firms", "consultancies", "partners"],
    suggestedNiches: [
      "Digital Marketing & Performance SEO",
      "Management & Strategy Consulting",
      "Corporate Law & Legal Advisory",
      "Accounting & Tax Advisory",
      "PR & Communications Agency",
      "Executive Search & Staffing",
    ],
  },
  {
    id: "real_estate",
    label: "Real Estate & Property",
    searchNouns: ["agencies", "brokerages", "developers", "firms"],
    suggestedNiches: [
      "Residential Real Estate Brokerage",
      "Commercial Property & Leasing",
      "Property Development & Architecture",
      "Interior Architecture & Fitouts",
      "Short-Stay & Vacation Rentals",
    ],
  },
  {
    id: "financial_services",
    label: "Financial Services & Fintech",
    searchNouns: ["fintech", "providers", "platforms", "firms", "institutions"],
    suggestedNiches: [
      "Digital Banking & Wallets",
      "Consumer Lending & Microfinance",
      "Wealth Management & Advisory",
      "Insurance & Insurtech",
      "Accounting & Corporate Finance",
    ],
  },
  {
    id: "education_training",
    label: "Education & Training",
    searchNouns: ["schools", "academies", "institutes", "colleges", "programs"],
    suggestedNiches: [
      "K-12 Private International Schools",
      "Higher Education & Colleges",
      "Test Prep & Tutoring Academies",
      "EdTech & Online Learning Platforms",
      "Vocational & Professional Training",
    ],
  },
  {
    id: "fitness_athletics",
    label: "Fitness & Sports",
    searchNouns: ["gyms", "studios", "clubs", "fitness centers", "academies"],
    suggestedNiches: [
      "Boutique Gyms & Fitness Clubs",
      "Yoga & Pilates Studios",
      "CrossFit & Functional Training",
      "Sports Academies & Coaching",
      "Personal Training Studios",
    ],
  },
];

export function getIndustries(): string[] {
  return INDUSTRY_TAXONOMY.map((item) => item.label);
}

export function getNichesForIndustry(industryName: string): string[] {
  if (!industryName) return [];
  const normalized = industryName.toLowerCase().trim();
  const match = INDUSTRY_TAXONOMY.find(
    (item) =>
      item.label.toLowerCase() === normalized ||
      item.id.toLowerCase() === normalized ||
      normalized.includes(item.id) ||
      item.label.toLowerCase().includes(normalized)
  );
  return match ? match.suggestedNiches : [];
}

export function getSearchNounsForIndustry(industryName: string): string[] {
  if (!industryName) return ["companies", "providers"];
  const normalized = industryName.toLowerCase().trim();
  const match = INDUSTRY_TAXONOMY.find(
    (item) =>
      item.label.toLowerCase() === normalized ||
      item.id.toLowerCase() === normalized ||
      normalized.includes(item.id) ||
      item.label.toLowerCase().includes(normalized)
  );
  return match ? match.searchNouns : ["companies", "providers"];
}
