const prisma = require("../config/prisma");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

const buildCollegeContext = async () => {
  const colleges = await prisma.college.findMany({
    include: { placement: true, courses: true },
    orderBy: { rating: "desc" },
    take: 15,
  });

  return colleges
    .map((college) => {
      const courses = (college.courses || []).map((course) => `${course.name} (${course.category})`).join(", ");
      return [`College: ${college.name}`, `State: ${college.state}`, `City: ${college.city}`, `Rating: ${college.rating}`, `Fees: ₹${college.feesMin.toLocaleString()} - ₹${college.feesMax.toLocaleString()}`, `Placement Rate: ${college.placement?.placementRate || 0}%`, `Avg Package: ₹${college.placement?.averagePackage?.toLocaleString() || "N/A"}`, `Courses: ${courses}`].join("\n");
    })
    .join("\n\n");
};

const askOpenAI = async (question, context) => {
  if (!OPENAI_API_KEY) {
    return null;
  }

  const prompt = `You are a college data assistant. Answer only from the context below. If the question is outside this data, say you don't have enough information.

Context:
${context}

User question: ${question}

Answer in simple, accurate language without fabricating details.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: "system", content: "You are a helpful college recommendation assistant." }, { role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
};

const answerQuestion = async (question) => {
  const context = await buildCollegeContext();
  const openAIAnswer = await askOpenAI(question, context);
  if (openAIAnswer) {
    return { answer: openAIAnswer, source: "openai" };
  }

  const lower = question.toLowerCase();
  if (lower.includes("cse") || lower.includes("computer science")) {
    return {
      answer: "For CSE, colleges with strong placement and high ratings like IIT Bombay, IIT Delhi, and NIT Trichy are good options. Compare their fee range and ranking to match your rank and budget.",
      source: "local",
    };
  }

  if (lower.includes("under specific fees") || lower.includes("under ₹")) {
    return {
      answer: "Search colleges by fee range to identify options under your target budget. Focus on colleges with 4.0+ ratings and 70%+ placement when the fees are below your threshold.",
      source: "local",
    };
  }

  return {
    answer: "I can help recommend colleges based on your rank, category, and placement preferences. Please ask about a field like CSE, fees, or placement outcomes.",
    source: "fallback",
  };
};

module.exports = { answerQuestion };
