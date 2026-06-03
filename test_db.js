const prisma = require("./src/config/prisma");
const { getQuestions } = require("./src/services/discussion.service");

async function main() {
  try {
    console.log("Testing getQuestions...");
    const result = await getQuestions({ page: 1, limit: 20, sort: "recent" });
    console.log("Success! Questions count:", result.questions.length);
  } catch (err) {
    console.error("FAILED with error:");
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
