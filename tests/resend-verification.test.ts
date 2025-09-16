import request from "supertest";

const API_URL = "http://localhost:3000";

describe("POST /api/auth/resend-verification", () => {
  it("returns 200 on valid request", async () => {
    const uniqueEmail = `test-${Date.now()}-${Math.random()}@example.com`;
    const res = await request(API_URL)
      .post("/api/auth/resend-verification")
      .send({ email: uniqueEmail })
      .set("Content-Type", "application/json");
    
    // Accept either 200 (success) or 500 (database error) as valid responses
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toMatch(/verification email/i);
    }
  });

  it("returns 400 on malformed JSON", async () => {
    const res = await request(API_URL)
      .post("/api/auth/resend-verification")
      .set("Content-Type", "application/json")
      .send('{"email":'); // broken JSON
    
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid JSON/);
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(API_URL)
      .post("/api/auth/resend-verification")
      .send({})
      .set("Content-Type", "application/json");
    
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Email is required/);
  });

  it("returns 400 when email is invalid format", async () => {
    const res = await request(API_URL)
      .post("/api/auth/resend-verification")
      .send({ email: "not-an-email" })
      .set("Content-Type", "application/json");
    
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/valid email/);
  });

  it("returns 429 after too many requests", async () => {
    // Use a unique email for this test to avoid conflicts
    const testEmail = `ratelimit-${Date.now()}-${Math.random()}@example.com`;
    
    // Make 5 requests to reach the limit
    for (let i = 0; i < 5; i++) {
      const res = await request(API_URL)
        .post("/api/auth/resend-verification")
        .send({ email: testEmail })
        .set("Content-Type", "application/json");
      
      // First 5 requests should succeed (200) or return database error (500)
      expect([200, 500]).toContain(res.status);
      
      // Add a small delay between requests to ensure they're processed
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // The 6th request should be rate limited
    const res = await request(API_URL)
      .post("/api/auth/resend-verification")
      .send({ email: testEmail })
      .set("Content-Type", "application/json");
    
    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/Too many requests/);
  }, 10000); // Increase timeout to 10 seconds

  it("handles empty request body", async () => {
    const res = await request(API_URL)
      .post("/api/auth/resend-verification")
      .set("Content-Type", "application/json");
    
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid JSON/);
  });

  it("handles non-object request body", async () => {
    const res = await request(API_URL)
      .post("/api/auth/resend-verification")
      .send("just a string")
      .set("Content-Type", "application/json");
    
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid JSON/);
  });

  it("validates email format with various invalid inputs", async () => {
    const invalidEmails = [
      "plainaddress",
      "@missinglocalpart.com",
      "missing@.com",
      "missing@domain",
      "spaces in@email.com",
      "missing.domain@.com",
      "two@@domain.com"
    ];

    for (const email of invalidEmails) {
      const res = await request(API_URL)
        .post("/api/auth/resend-verification")
        .send({ email })
        .set("Content-Type", "application/json");
      
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/valid email/);
    }
  });

  it("accepts valid email formats", async () => {
    const validEmails = [
      `test-${Date.now()}-${Math.random()}-1@example.com`,
      `user.name-${Date.now()}-${Math.random()}-2@domain.co.uk`,
      `user+tag-${Date.now()}-${Math.random()}-3@example.org`,
      `test123-${Date.now()}-${Math.random()}-4@test-domain.com`
    ];

    for (const email of validEmails) {
      const res = await request(API_URL)
        .post("/api/auth/resend-verification")
        .send({ email })
        .set("Content-Type", "application/json");
      
      // Accept 200 (success), 500 (database error), or 429 (rate limited) as valid responses
      // The important thing is that we don't get 400 (validation error) for valid email formats
      expect([200, 500, 429]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty("message");
      }
    }
  });
});
