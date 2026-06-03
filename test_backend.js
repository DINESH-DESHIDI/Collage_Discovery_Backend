// test_backend.js - Full API test suite for CollVerse Backend
// Tests: Health, DB, Auth, Colleges, Search, Filter, Compare, Saved, Reviews, Edge cases

const BASE = "http://localhost:5000";
let token = "";
let savedId = "";
let collegeSlug = "iit-bombay";
let passed = 0;
let failed = 0;
let results = [];

// ─── Helpers ────────────────────────────────────────────────────────────────
async function req(method, path, body = null, auth = false) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${BASE}${path}`, opts);
    const json = await res.json();
    return { status: res.status, body: json };
  } catch (err) {
    return { status: 0, body: { error: err.message } };
  }
}

function test(name, condition, detail = "") {
  if (condition) {
    passed++;
    results.push({ status: "✅ PASS", name, detail });
    console.log(`  ✅ PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed++;
    results.push({ status: "❌ FAIL", name, detail });
    console.log(`  ❌ FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// ─── Test groups ─────────────────────────────────────────────────────────────
async function testHealth() {
  console.log("\n══════════════════════════════════════════");
  console.log(" 1. HEALTH & DATABASE CONNECTIVITY");
  console.log("══════════════════════════════════════════");

  const r = await req("GET", "/api/health");
  test("GET /api/health returns 200", r.status === 200, `status=${r.status}`);
  test("DB is connected", r.body?.db === "connected", `db=${r.body?.db}`);
  test("Success flag is true", r.body?.success === true);

  const root = await req("GET", "/");
  test("GET / returns API info", root.status === 200 && root.body?.success === true);
}

async function testAuth() {
  console.log("\n══════════════════════════════════════════");
  console.log(" 2. AUTHENTICATION");
  console.log("══════════════════════════════════════════");

  // Signup validation — missing fields
  const badSignup = await req("POST", "/api/auth/signup", { email: "bad" });
  test("Signup rejects invalid input (422)", badSignup.status === 422, `status=${badSignup.status}`);
  test("Signup returns errors array", Array.isArray(badSignup.body?.errors));

  // Valid signup
  const uniqueEmail = `test_${Date.now()}@collverse.com`;
  const signup = await req("POST", "/api/auth/signup", {
    name: "Test User",
    email: uniqueEmail,
    password: "test1234",
  });
  test("Signup creates new user (201)", signup.status === 201, `status=${signup.status}`);
  test("Signup returns token", typeof signup.body?.data?.token === "string");
  test("Signup returns user object", signup.body?.data?.user?.email === uniqueEmail);

  // Duplicate signup
  const dup = await req("POST", "/api/auth/signup", {
    name: "Test User",
    email: uniqueEmail,
    password: "test1234",
  });
  test("Duplicate signup blocked (409)", dup.status === 409, `status=${dup.status}`);

  // Login with wrong password
  const badLogin = await req("POST", "/api/auth/login", {
    email: "demo@collverse.com",
    password: "wrongpassword",
  });
  test("Login rejects wrong password (401)", badLogin.status === 401, `status=${badLogin.status}`);

  // Valid demo login
  const login = await req("POST", "/api/auth/login", {
    email: "demo@collverse.com",
    password: "demo1234",
  });
  test("Demo login succeeds (200)", login.status === 200, `status=${login.status}`);
  test("Login returns JWT token", typeof login.body?.data?.token === "string");
  test("Login returns user without password", !login.body?.data?.user?.password);

  token = login.body?.data?.token;

  // Profile with token
  const profile = await req("GET", "/api/auth/profile", null, true);
  test("GET /api/auth/profile with token (200)", profile.status === 200, `status=${profile.status}`);
  test("Profile returns correct user", profile.body?.data?.email === "demo@collverse.com");

  // Profile without token
  const noAuth = await req("GET", "/api/auth/profile");
  test("Profile blocked without token (401)", noAuth.status === 401, `status=${noAuth.status}`);
}

async function testColleges() {
  console.log("\n══════════════════════════════════════════");
  console.log(" 3. COLLEGE LISTING & PAGINATION");
  console.log("══════════════════════════════════════════");

  const list = await req("GET", "/api/colleges");
  test("GET /api/colleges returns 200", list.status === 200);
  test("Returns array of colleges", Array.isArray(list.body?.data));
  test("Pagination object present", list.body?.pagination?.total >= 12, `total=${list.body?.pagination?.total}`);
  test("Default limit is 10", list.body?.data?.length === 10);

  const page2 = await req("GET", "/api/colleges?page=2&limit=5");
  test("Pagination page=2 works", page2.status === 200);
  test("Page 2 returns remaining records", page2.body?.data?.length > 0);
  test("Pagination totalPages correct", page2.body?.pagination?.totalPages >= 2);

  const sorted = await req("GET", "/api/colleges?sort=rating");
  test("Sort by rating works", sorted.status === 200);
  const ratings = sorted.body?.data?.map(c => c.rating) || [];
  const isSortedDesc = ratings.every((r, i) => i === 0 || r <= ratings[i - 1]);
  test("Results sorted by rating descending", isSortedDesc);
}

async function testCollegeDetail() {
  console.log("\n══════════════════════════════════════════");
  console.log(" 4. COLLEGE DETAIL (slug & ID)");
  console.log("══════════════════════════════════════════");

  // By slug
  const slug = await req("GET", `/api/colleges/${collegeSlug}`);
  test("GET /api/colleges/:slug returns 200", slug.status === 200);
  test("College has name", typeof slug.body?.data?.name === "string");
  test("College has placement data", slug.body?.data?.placement !== null);
  test("College has courses array", Array.isArray(slug.body?.data?.courses));
  test("College has reviews array", Array.isArray(slug.body?.data?.reviews));
  test("Courses count matches", slug.body?.data?.courses?.length >= 5);
  test("Reviews exist", slug.body?.data?.reviews?.length >= 3);

  // By DB id
  const dbId = slug.body?.data?.id;
  const byId = await req("GET", `/api/colleges/${dbId}`);
  test("GET /api/colleges/:dbId returns same college", byId.body?.data?.slug === collegeSlug);

  // 404 for non-existent
  const notFound = await req("GET", "/api/colleges/non-existent-college-xyz");
  test("Non-existent college returns 404", notFound.status === 404, `status=${notFound.status}`);
}

async function testSearch() {
  console.log("\n══════════════════════════════════════════");
  console.log(" 5. SEARCH & FILTERS");
  console.log("══════════════════════════════════════════");

  // Search by name
  const iit = await req("GET", "/api/colleges/search?search=iit");
  test("Search 'iit' finds colleges", iit.body?.data?.length >= 2, `count=${iit.body?.data?.length}`);
  test("Search results contain 'IIT'", iit.body?.data?.every(c => c.name.toLowerCase().includes("iit") || c.shortName.toLowerCase().includes("iit")));

  // Search by city
  const delhi = await req("GET", "/api/colleges?search=delhi");
  test("Search by city 'delhi' works", delhi.body?.data?.length >= 1);

  // Filter by state
  const tn = await req("GET", "/api/colleges?state=Tamil Nadu");
  test("Filter by state 'Tamil Nadu'", tn.body?.data?.length >= 1);
  test("All results are from Tamil Nadu", tn.body?.data?.every(c => c.state === "Tamil Nadu"));

  // Filter by type
  const govt = await req("GET", "/api/colleges?type=Government");
  test("Filter by type 'Government' works", govt.body?.data?.length >= 1);
  test("All results are Government type", govt.body?.data?.every(c => c.type === "Government"));

  // Filter by rating
  const highRated = await req("GET", "/api/colleges?minRating=4.7");
  test("Filter minRating=4.7 returns high-rated", highRated.body?.data?.length >= 1);
  test("All results have rating >= 4.7", highRated.body?.data?.every(c => c.rating >= 4.7));

  // No results search
  const none = await req("GET", "/api/colleges?search=zzznoresultsxxx");
  test("Empty search returns empty array (not error)", none.status === 200 && none.body?.data?.length === 0);

  // Sort by fees ascending
  const cheapest = await req("GET", "/api/colleges?sort=feesAsc&limit=5");
  test("Sort by feesAsc works", cheapest.status === 200);
  const fees = cheapest.body?.data?.map(c => c.feesMin) || [];
  const isFeesAsc = fees.every((f, i) => i === 0 || f >= fees[i - 1]);
  test("Fees sorted ascending", isFeesAsc);
}

async function testCompare() {
  console.log("\n══════════════════════════════════════════");
  console.log(" 6. COMPARE COLLEGES");
  console.log("══════════════════════════════════════════");

  const compare = await req("GET", "/api/colleges/compare?ids=iit-bombay,iit-delhi,bits-pilani");
  test("Compare 3 colleges returns 200", compare.status === 200);
  test("Returns array of 3 colleges", compare.body?.data?.length === 3, `count=${compare.body?.data?.length}`);
  test("Each college has placement", compare.body?.data?.every(c => c.placement !== null));

  // Missing ids param
  const noIds = await req("GET", "/api/colleges/compare");
  test("Compare without ids returns 400", noIds.status === 400);

  // Only 1 id (invalid)
  const oneId = await req("GET", "/api/colleges/compare?ids=iit-bombay");
  test("Compare with 1 id returns 400", oneId.status === 400);
}

async function testSaved() {
  console.log("\n══════════════════════════════════════════");
  console.log(" 7. SAVED COLLEGES (requires auth)");
  console.log("══════════════════════════════════════════");

  // Get saved without auth
  const noAuth = await req("GET", "/api/saved");
  test("GET /api/saved without auth returns 401", noAuth.status === 401);

  // Save a college
  const save = await req("POST", "/api/saved", { collegeId: "iit-bombay" }, true);
  test("POST /api/saved saves college (201)", save.status === 201, `status=${save.status}`);
  savedId = save.body?.data?.id || save.body?.data?.savedId;

  // Save duplicate (should not error)
  const saveDup = await req("POST", "/api/saved", { collegeId: "iit-bombay" }, true);
  test("Saving duplicate college doesn't crash", saveDup.status === 201 || saveDup.status === 200);

  // Save another college
  await req("POST", "/api/saved", { collegeId: "iit-delhi" }, true);

  // Get saved list
  const saved = await req("GET", "/api/saved", null, true);
  test("GET /api/saved returns array", Array.isArray(saved.body?.data));
  test("Saved list has 2 colleges", saved.body?.data?.length >= 2, `count=${saved.body?.data?.length}`);

  // Save without collegeId
  const noCollegeId = await req("POST", "/api/saved", {}, true);
  test("Save without collegeId returns 400", noCollegeId.status === 400);

  // Save non-existent college
  const noCollege = await req("POST", "/api/saved", { collegeId: "does-not-exist-xyz" }, true);
  test("Save non-existent college returns 404", noCollege.status === 404);

  // Get the savedId from the list for deletion
  const list = await req("GET", "/api/saved", null, true);
  const firstSaved = list.body?.data?.[0];
  savedId = firstSaved?.savedId;

  // Delete saved
  if (savedId) {
    const del = await req("DELETE", `/api/saved/${savedId}`, null, true);
    test("DELETE /api/saved/:id removes record (200)", del.status === 200, `status=${del.status}`);

    // Delete already-deleted
    const delAgain = await req("DELETE", `/api/saved/${savedId}`, null, true);
    test("Delete already-deleted returns 404", delAgain.status === 404, `status=${delAgain.status}`);
  }
}

async function testReviews() {
  console.log("\n══════════════════════════════════════════");
  console.log(" 8. REVIEWS");
  console.log("══════════════════════════════════════════");

  // Get reviews for a college (public)
  const reviews = await req("GET", `/api/reviews/${collegeSlug}`);
  test("GET /api/reviews/:collegeId returns 200", reviews.status === 200);
  test("Reviews is paginated", reviews.body?.pagination?.total > 0, `total=${reviews.body?.pagination?.total}`);
  test("Reviews have required fields", reviews.body?.data?.[0]?.title && reviews.body?.data?.[0]?.rating);

  // Post review without auth
  const noAuth = await req("POST", "/api/reviews", {
    collegeId: collegeSlug, title: "Great", body: "Really loved it here", rating: 4.5
  });
  test("POST /api/reviews without auth returns 401", noAuth.status === 401);

  // Post with invalid data
  const badReview = await req("POST", "/api/reviews", {
    collegeId: collegeSlug, title: "", body: "short", rating: 10,
  }, true);
  test("Review with invalid data returns 422", badReview.status === 422, `status=${badReview.status}`);

  // Post valid review
  const review = await req("POST", "/api/reviews", {
    collegeId: collegeSlug,
    title: "Automated test review — excellent institution",
    body: "This is a test review submitted via automated test suite. The college is excellent in every way.",
    rating: 4.5,
  }, true);
  test("POST valid review returns 201", review.status === 201, `status=${review.status}`);
  test("Review has correct rating", review.body?.data?.rating === 4.5);
  test("Review saved author name", typeof review.body?.data?.author === "string");

  // Reviews for non-existent college
  const noCollege = await req("GET", "/api/reviews/non-existent-college-xyz");
  test("Reviews for non-existent college returns 404", noCollege.status === 404);
}

async function testEdgeCases() {
  console.log("\n══════════════════════════════════════════");
  console.log(" 9. EDGE CASES & ERROR HANDLING");
  console.log("══════════════════════════════════════════");

  // 404 unknown route
  const unknown = await req("GET", "/api/unknown-endpoint");
  test("Unknown route returns 404", unknown.status === 404);

  // Invalid JSON body
  try {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid json",
    });
    const json = await res.json();
    test("Invalid JSON body handled gracefully", res.status === 400 || json.success === false);
  } catch {
    test("Invalid JSON body handled gracefully", true, "fetch threw (expected)");
  }

  // Expired/garbage token
  const garbage = await fetch(`${BASE}/api/auth/profile`, {
    headers: { Authorization: "Bearer garbage.token.value" },
  });
  test("Garbage token rejected (401)", garbage.status === 401);

  // Pagination with extreme values
  const bigPage = await req("GET", "/api/colleges?page=99999&limit=10");
  test("Large page returns empty data, not crash", bigPage.status === 200 && Array.isArray(bigPage.body?.data));

  // Limit capped at 50
  const bigLimit = await req("GET", "/api/colleges?limit=999");
  test("Limit > 50 is capped", bigLimit.body?.data?.length <= 50);
}

// ─── Main runner ─────────────────────────────────────────────────────────────
async function main() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   CollVerse Backend — Full Test Suite    ║");
  console.log("║   Backend: http://localhost:5000         ║");
  console.log("╚══════════════════════════════════════════╝");

  await testHealth();
  await testAuth();
  await testColleges();
  await testCollegeDetail();
  await testSearch();
  await testCompare();
  await testSaved();
  await testReviews();
  await testEdgeCases();

  const total = passed + failed;
  const pct = Math.round((passed / total) * 100);

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║              TEST SUMMARY                ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log(`║  Total Tests : ${String(total).padEnd(26)}║`);
  console.log(`║  ✅ Passed   : ${String(passed).padEnd(26)}║`);
  console.log(`║  ❌ Failed   : ${String(failed).padEnd(26)}║`);
  console.log(`║  Score       : ${String(pct + "%").padEnd(26)}║`);
  console.log("╚══════════════════════════════════════════╝");

  if (failed > 0) {
    console.log("\n❌ FAILED TESTS:");
    results.filter(r => r.status.startsWith("❌")).forEach(r => {
      console.log(`   • ${r.name}${r.detail ? " — " + r.detail : ""}`);
    });
  }
}

main().catch(console.error);
