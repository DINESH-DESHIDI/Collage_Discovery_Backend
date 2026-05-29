// prisma/seed.js
// Realistic seed data for the College Discovery Platform

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// ─── College raw data ──────────────────────────────────────────────────────────
const recruiterPool = [
  "Google", "Microsoft", "Amazon", "Goldman Sachs", "McKinsey",
  "TCS", "Infosys", "Deloitte", "Adobe", "JPMorgan",
];

const baseCourses = [
  { name: "B.Tech Computer Science", category: "Engineering", duration: "4 years", fees: 240000, seats: 120 },
  { name: "B.Tech Electronics", category: "Engineering", duration: "4 years", fees: 220000, seats: 90 },
  { name: "MBA", category: "Management", duration: "2 years", fees: 1800000, seats: 240 },
  { name: "BBA", category: "Management", duration: "3 years", fees: 320000, seats: 60 },
  { name: "B.Sc Physics", category: "Science", duration: "3 years", fees: 80000, seats: 60 },
];

const collegesData = [
  {
    slug: "iit-bombay",
    name: "Indian Institute of Technology Bombay",
    shortName: "IITB",
    city: "Mumbai",
    state: "Maharashtra",
    type: "Government",
    rating: 4.8,
    feesMin: 220000,
    feesMax: 280000,
    ranking: 1,
    established: 1958,
    image: "https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80",
  },
  {
    slug: "iit-delhi",
    name: "Indian Institute of Technology Delhi",
    shortName: "IITD",
    city: "New Delhi",
    state: "Delhi",
    type: "Government",
    rating: 4.7,
    feesMin: 220000,
    feesMax: 280000,
    ranking: 2,
    established: 1961,
    image: "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=1200&q=80",
  },
  {
    slug: "iim-ahmedabad",
    name: "Indian Institute of Management Ahmedabad",
    shortName: "IIMA",
    city: "Ahmedabad",
    state: "Gujarat",
    type: "Government",
    rating: 4.9,
    feesMin: 2400000,
    feesMax: 2500000,
    ranking: 3,
    established: 1961,
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80",
  },
  {
    slug: "bits-pilani",
    name: "Birla Institute of Technology and Science",
    shortName: "BITS",
    city: "Pilani",
    state: "Rajasthan",
    type: "Private",
    rating: 4.6,
    feesMin: 450000,
    feesMax: 520000,
    ranking: 4,
    established: 1964,
    image: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1200&q=80",
  },
  {
    slug: "nit-trichy",
    name: "National Institute of Technology Trichy",
    shortName: "NITT",
    city: "Tiruchirappalli",
    state: "Tamil Nadu",
    type: "Government",
    rating: 4.5,
    feesMin: 180000,
    feesMax: 200000,
    ranking: 5,
    established: 1964,
    image: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=1200&q=80",
  },
  {
    slug: "vit-vellore",
    name: "Vellore Institute of Technology",
    shortName: "VIT",
    city: "Vellore",
    state: "Tamil Nadu",
    type: "Private",
    rating: 4.3,
    feesMin: 360000,
    feesMax: 440000,
    ranking: 6,
    established: 1984,
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80",
  },
  {
    slug: "du-delhi",
    name: "University of Delhi",
    shortName: "DU",
    city: "New Delhi",
    state: "Delhi",
    type: "Government",
    rating: 4.4,
    feesMin: 30000,
    feesMax: 90000,
    ranking: 7,
    established: 1922,
    image: "https://images.unsplash.com/photo-1568792923760-d70635a89fdc?w=1200&q=80",
  },
  {
    slug: "manipal",
    name: "Manipal Academy of Higher Education",
    shortName: "MAHE",
    city: "Manipal",
    state: "Karnataka",
    type: "Deemed",
    rating: 4.4,
    feesMin: 480000,
    feesMax: 600000,
    ranking: 8,
    established: 1953,
    image: "https://images.unsplash.com/photo-1599687351724-dfa3c4ff81b1?w=1200&q=80",
  },
  {
    slug: "srm-chennai",
    name: "SRM Institute of Science and Technology",
    shortName: "SRM",
    city: "Chennai",
    state: "Tamil Nadu",
    type: "Private",
    rating: 4.1,
    feesMin: 280000,
    feesMax: 400000,
    ranking: 9,
    established: 1985,
    image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&q=80",
  },
  {
    slug: "aiims-delhi",
    name: "All India Institute of Medical Sciences",
    shortName: "AIIMS",
    city: "New Delhi",
    state: "Delhi",
    type: "Government",
    rating: 4.9,
    feesMin: 6000,
    feesMax: 12000,
    ranking: 10,
    established: 1956,
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80",
  },
  {
    slug: "nls-bangalore",
    name: "National Law School of India University",
    shortName: "NLSIU",
    city: "Bangalore",
    state: "Karnataka",
    type: "Government",
    rating: 4.7,
    feesMin: 280000,
    feesMax: 320000,
    ranking: 11,
    established: 1987,
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=80",
  },
  {
    slug: "nid-ahmedabad",
    name: "National Institute of Design",
    shortName: "NID",
    city: "Ahmedabad",
    state: "Gujarat",
    type: "Government",
    rating: 4.6,
    feesMin: 320000,
    feesMax: 380000,
    ranking: 12,
    established: 1961,
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80",
  },
];

// ─── Review seed data ──────────────────────────────────────────────────────────
const reviewTemplates = [
  {
    title: "Outstanding academics and campus life",
    body: "Faculty is world-class, placements are strong, and the peer group pushes you to do your best work. Hostels could use an upgrade though.",
    rating: 4.5,
    author: "Aarav Sharma",
  },
  {
    title: "Great exposure, intense workload",
    body: "Plenty of clubs and research opportunities. Be ready to grind — coursework is rigorous but rewarding.",
    rating: 4.0,
    author: "Priya Menon",
  },
  {
    title: "Best decision of my life",
    body: "Network you build here is unmatched. Alumni actively help juniors and the recruitment cell is top-notch.",
    rating: 4.8,
    author: "Rahul Verma",
  },
];

// ─── Seed function ─────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data in correct order to avoid FK violations
  await prisma.comparison.deleteMany();
  await prisma.savedCollege.deleteMany();
  await prisma.review.deleteMany();
  await prisma.course.deleteMany();
  await prisma.placement.deleteMany();
  await prisma.college.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleared existing data");

  // Seed demo user
  const hashedPassword = await bcrypt.hash("demo1234", 12);
  const demoUser = await prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@collverse.com",
      password: hashedPassword,
      avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Demo&backgroundType=gradientLinear",
    },
  });
  console.log(`✅ Created demo user: ${demoUser.email}`);

  // Seed colleges
  for (const college of collegesData) {
    const logo = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(college.shortName)}&backgroundType=gradientLinear`;

    const created = await prisma.college.create({
      data: {
        slug: college.slug,
        name: college.name,
        shortName: college.shortName,
        city: college.city,
        state: college.state,
        image: college.image,
        logo,
        rating: college.rating,
        reviewsCount: 200 + Math.floor(college.rating * 100),
        feesMin: college.feesMin,
        feesMax: college.feesMax,
        established: college.established,
        type: college.type,
        ranking: college.ranking,
        accreditation: ["NAAC A++", "NBA", "UGC"],
        description: `${college.name} is a premier ${college.type.toLowerCase()} institution established in ${college.established}, renowned for academic excellence, cutting-edge research, and a vibrant student community.`,
        facilities: [
          "Smart Classrooms", "Central Library", "Sports Complex",
          "Hostels", "Innovation Lab", "Cafeteria", "Medical Center", "Wi-Fi Campus",
        ],

        // Create nested placement
        placement: {
          create: {
            averagePackage: 1200000 + college.ranking * 50000,
            highestPackage: Math.max(3000000, 8000000 - college.ranking * 100000),
            placementRate: Math.min(98, 70 + Math.round(college.rating * 5)),
            topRecruiters: recruiterPool.slice(0, 6),
          },
        },

        // Create nested courses
        courses: {
          create: baseCourses,
        },

        // Create nested reviews
        reviews: {
          create: reviewTemplates.map((r) => ({ ...r })),
        },
      },
    });

    console.log(`  📚 Seeded: ${created.name}`);
  }

  console.log("\n✅ Seed completed successfully!");
  console.log(`   → ${collegesData.length} colleges created`);
  console.log(`   → Demo login: demo@collverse.com / demo1234`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
