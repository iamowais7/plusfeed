import { config } from "dotenv";
config();
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const BATCH_SIZE = 500; // Insert in batches to avoid memory issues
const TOTAL_CONTENT = 10_000;

const VIDEO_TOPICS = [
  "React Tutorial", "Next.js Guide", "TypeScript Basics", "Node.js Deep Dive",
  "CSS Grid Masterclass", "Docker for Developers", "GraphQL API Design",
  "Machine Learning Intro", "Python Automation", "Cloud Architecture",
  "System Design Interview", "Data Structures", "Algorithm Analysis",
  "DevOps Pipeline", "Kubernetes Deployment", "Microservices Pattern",
  "Web Security Best Practices", "Performance Optimization", "Testing Strategies",
];

const ARTICLE_TOPICS = [
  "The Future of Web Development", "Why TypeScript is Worth It", "Building Scalable APIs",
  "Database Indexing Explained", "Clean Code Principles", "Functional Programming in JS",
  "Understanding Event Loop", "CSS Architecture at Scale", "Monorepo Strategy",
  "Zero Downtime Deployments", "Caching Strategies", "Rate Limiting Patterns",
  "OAuth 2.0 Demystified", "WebSockets vs SSE", "Edge Computing Trends",
  "The CAP Theorem", "Eventual Consistency", "CQRS and Event Sourcing",
];

const TAGS = [
  "javascript", "typescript", "react", "nextjs", "nodejs", "python",
  "devops", "cloud", "database", "security", "performance", "architecture",
  "tutorial", "deep-dive", "beginner", "advanced", "career", "tools",
  "css", "html", "api", "testing", "docker", "kubernetes",
];

function randomTags(n = 3): string[] {
  return faker.helpers.arrayElements(TAGS, n);
}

function randomTitle(type: "VIDEO" | "ARTICLE"): string {
  const topics = type === "VIDEO" ? VIDEO_TOPICS : ARTICLE_TOPICS;
  const base = faker.helpers.arrayElement(topics);
  const suffix = faker.helpers.arrayElement([
    "", " — Complete Guide", " for Beginners", " in 2024",
    ": Practical Examples", " — Part 1", " Deep Dive",
  ]);
  return `${base}${suffix}`;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

async function main() {
  console.log("🌱 Starting seed...");
  console.log(`📊 Target: ${TOTAL_CONTENT.toLocaleString()} content records`);

  // ─── Create admin user ────────────────────────────────────────────────────

  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@pulsefeed.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@pulsefeed.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin user: admin@pulsefeed.com / admin123`);

  // ─── Create regular user ─────────────────────────────────────────────────

  const userPassword = await bcrypt.hash("user1234", 12);
  const regularUser = await prisma.user.upsert({
    where: { email: "user@pulsefeed.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "user@pulsefeed.com",
      password: userPassword,
      role: "USER",
    },
  });
  console.log(`✅ Demo user: user@pulsefeed.com / user1234`);

  // ─── Seed content in batches ─────────────────────────────────────────────

  let created = 0;
  const slugSet = new Set<string>();

  while (created < TOTAL_CONTENT) {
    const batchSize = Math.min(BATCH_SIZE, TOTAL_CONTENT - created);
    const batch = [];

    for (let i = 0; i < batchSize; i++) {
      const type = faker.helpers.arrayElement(["VIDEO", "ARTICLE"] as const);
      const title = randomTitle(type);
      let slug = slugify(title);

      // Ensure unique slug
      if (slugSet.has(slug)) {
        slug = `${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      }
      slugSet.add(slug);

      const isVideo = type === "VIDEO";

      batch.push({
        title,
        slug,
        type,
        description: faker.lorem.paragraph(2),
        thumbnail: `https://picsum.photos/seed/${slug.slice(0, 10)}/800/450`,
        url: isVideo
          ? `https://example.com/videos/${faker.string.uuid()}`
          : `<h2>${faker.lorem.sentence()}</h2><p>${faker.lorem.paragraphs(10, "</p><p>")}</p>`,
        viewCount: faker.number.int({ min: 0, max: 50000 }),
        likeCount: faker.number.int({ min: 0, max: 5000 }),
        bookmarkCount: faker.number.int({ min: 0, max: 2000 }),
        tags: randomTags(faker.number.int({ min: 1, max: 5 })),
        published: faker.datatype.boolean({ probability: 0.85 }),
        authorName: faker.person.fullName(),
        createdAt: faker.date.between({ from: "2023-01-01", to: new Date() }),
        updatedAt: new Date(),
      });
    }

    await prisma.content.createMany({ data: batch, skipDuplicates: true });
    created += batchSize;

    process.stdout.write(
      `\r  Progress: ${created.toLocaleString()} / ${TOTAL_CONTENT.toLocaleString()} (${Math.round((created / TOTAL_CONTENT) * 100)}%)`
    );
  }

  console.log("\n✅ Content seeded");

  // ─── Seed some engagements ────────────────────────────────────────────────

  const sampleContent = await prisma.content.findMany({
    take: 50,
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  const engagements = [];
  for (const item of sampleContent) {
    if (Math.random() > 0.5) {
      engagements.push({
        userId: regularUser.id,
        contentId: item.id,
        type: "LIKE" as const,
      });
    }
    if (Math.random() > 0.7) {
      engagements.push({
        userId: regularUser.id,
        contentId: item.id,
        type: "BOOKMARK" as const,
      });
    }
    if (Math.random() > 0.5) {
      engagements.push({
        userId: admin.id,
        contentId: item.id,
        type: "LIKE" as const,
      });
    }
  }

  if (engagements.length > 0) {
    await prisma.engagement.createMany({
      data: engagements,
      skipDuplicates: true,
    });
  }
  console.log(`✅ ${engagements.length} engagements seeded`);

  // ─── Seed some progress ───────────────────────────────────────────────────

  const progressItems = sampleContent.slice(0, 10).map((item: { id: string }) => ({
    userId: regularUser.id,
    contentId: item.id,
    lastPosition: faker.number.int({ min: 10, max: 80 }),
    isCompleted: false,
    updatedAt: new Date(),
  }));

  await prisma.progress.createMany({ data: progressItems, skipDuplicates: true });
  console.log(`✅ ${progressItems.length} progress records seeded`);

  console.log("\n🎉 Seed complete!");
  console.log("─".repeat(40));
  console.log(`Admin:  admin@pulsefeed.com / admin123`);
  console.log(`User:   user@pulsefeed.com  / user1234`);
  console.log("─".repeat(40));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
