const BASE_URL = 'http://127.0.0.1:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, options);
  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, headers: res.headers, data };
}

async function testCalendar() {
  console.log('🧪 Testing Student Learning Calendar & Light-to-Dark Color Scaling...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Register or login a test student
  const email = `calendar_student_${Date.now()}@example.com`;
  const regRes = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Calendar Test Student',
      email,
      password: 'Password123!',
      role: 'student',
    }),
  });

  assert(regRes.status === 201, 'Test student registered successfully');
  const token = regRes.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Initial Calendar Fetch (should be clean/empty)
  const initCal = await request('/progress/calendar', { headers: authHeaders });
  assert(initCal.status === 200, 'GET /progress/calendar returns 200 OK');
  assert(initCal.data.summary !== undefined, 'Summary stats present in response');

  // 3. Log active study time for today
  console.log('\n3. Logging 25 Minutes of Study Time (Level 2 - Moderate)...');
  const logRes = await request('/progress/log-study-time', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ minutes: 25 }),
  });
  assert(logRes.status === 200, 'POST /progress/log-study-time returns 200 OK');
  assert(logRes.data.level === 2, `Intensity level calculated correctly as 2 (Received: ${logRes.data.level})`);

  // 4. Log additional 60 Minutes (total 85 mins -> Level 4 - Dark)
  console.log('\n4. Logging additional 60 Minutes (Total 85m -> Level 4 - Dark)...');
  const logDeepRes = await request('/progress/log-study-time', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ minutes: 60 }),
  });
  assert(logDeepRes.status === 200, 'POST deep work study time returned 200 OK');
  assert(logDeepRes.data.level === 4, `Intensity level graduated to 4 (Dark) (Received: ${logDeepRes.data.level})`);

  // 5. Seed diverse calendar activities to test all light-to-dark gradient brackets
  console.log('\n5. Seeding sample study habits over past 30 days...');
  const seedRes = await request('/progress/seed-calendar', {
    method: 'POST',
    headers: authHeaders,
  });
  assert(seedRes.status === 200, 'POST /progress/seed-calendar returns 200 OK');

  // 6. Verify calendar heatmap contains all 5 gradient levels (0 to 4)
  console.log('\n6. Verifying Light-to-Dark Color Palette Levels in Calendar Data...');
  const populatedCal = await request('/progress/calendar', { headers: authHeaders });
  assert(populatedCal.status === 200, 'GET /progress/calendar fetched populated activities');

  const levelsFound = new Set();
  Object.values(populatedCal.data.activities).forEach((act) => {
    levelsFound.add(act.level);
  });

  assert(levelsFound.has(1), 'Level 1 (Light: 1-20m) present in calendar');
  assert(levelsFound.has(2), 'Level 2 (Moderate: 21-45m) present in calendar');
  assert(levelsFound.has(3), 'Level 3 (Active: 46-75m) present in calendar');
  assert(levelsFound.has(4), 'Level 4 (Dark / Intense: 75m+) present in calendar');

  assert(populatedCal.data.summary.currentStreak >= 1, `Current streak calculated: ${populatedCal.data.summary.currentStreak} days`);
  assert(populatedCal.data.summary.longestStreak >= 2, `Longest streak calculated: ${populatedCal.data.summary.longestStreak} days`);
  assert(populatedCal.data.summary.totalHours > 0, `Total hours tracked: ${populatedCal.data.summary.totalHours} hrs`);

  console.log(`\n========================================`);
  console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

testCalendar().catch((err) => {
  console.error('Test crashed:', err);
  process.exit(1);
});
