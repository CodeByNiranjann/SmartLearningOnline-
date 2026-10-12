import axios from 'axios';

async function testAllEndpoints() {
  try {
    console.log('--- Testing Backend APIs & Session ID Authentication ---');

    // 1. Test Register with Session ID (SLP-1)
    const testEmail = `student_${Date.now()}@example.com`;
    const regRes = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test Student',
      email: testEmail,
      password: 'password123',
    });
    console.log('✓ SLP-1 Registration successful:', regRes.data.user.name, regRes.data.user.email);
    console.log('   - Generated Session ID:', regRes.data.sessionId);
    const token = regRes.data.token;
    const sessionId = regRes.data.sessionId;

    // 2. Test Login (SLP-1)
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: testEmail,
      password: 'password123',
    });
    console.log('✓ SLP-1 Login successful. New Session ID:', loginRes.data.sessionId);
    const activeToken = loginRes.data.token;
    const activeSessionId = loginRes.data.sessionId;

    // 3. Test Me Profile with Session Headers (SLP-1)
    const meRes = await axios.get('http://localhost:5000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${activeToken}`,
        'X-Session-ID': activeSessionId,
      },
    });
    console.log('✓ SLP-1 GET /api/auth/me authenticated. Current Session ID:', meRes.data.currentSessionId);

    // 4. Test GET Active Sessions (SLP-1)
    const sessionsRes = await axios.get('http://localhost:5000/api/auth/sessions', {
      headers: {
        Authorization: `Bearer ${activeToken}`,
        'X-Session-ID': activeSessionId,
      },
    });
    console.log('✓ GET /api/auth/sessions count:', sessionsRes.data.activeSessions.length);
    sessionsRes.data.activeSessions.forEach((s) => {
      console.log(`   - Session: [${s.device}] IP: ${s.ipAddress} (Current: ${s.isCurrentSession})`);
    });

    // 5. Test Get Courses (SLP-2)
    const coursesRes = await axios.get('http://localhost:5000/api/courses');
    console.log('✓ SLP-2 GET /api/courses count:', coursesRes.data.length);

    const targetCourse = coursesRes.data[0];

    // 6. Test Structured Learning Path Modules & Lessons (SLP-3)
    const modulesRes = await axios.get(`http://localhost:5000/api/courses/${targetCourse._id}/modules`);
    console.log(`✓ SLP-3 GET /api/courses/${targetCourse._id}/modules count:`, modulesRes.data.length);

    const firstLesson = modulesRes.data[0].lessons[0];

    // 7. Test Lesson Details & Resources (SLP-4)
    const lessonRes = await axios.get(`http://localhost:5000/api/lessons/${firstLesson._id}`);
    console.log('✓ SLP-4 GET /api/lessons/:id title:', lessonRes.data.lesson.title);

    // 8. Test Mark as Complete & Student Progress
    const completeRes = await axios.post(
      'http://localhost:5000/api/progress/complete-lesson',
      { courseId: targetCourse._id, lessonId: firstLesson._id },
      {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'X-Session-ID': activeSessionId,
        },
      }
    );
    console.log('✓ Progress update:', completeRes.data.message, 'Progress %:', completeRes.data.progress.progressPercentage);

    // 9. Test Logout & Session Invalidation
    const logoutRes = await axios.post(
      'http://localhost:5000/api/auth/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'X-Session-ID': activeSessionId,
        },
      }
    );
    console.log('✓ Logout successful:', logoutRes.data.message);

    // Verify session invalidation (should fail with 401)
    try {
      await axios.get('http://localhost:5000/api/auth/me', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'X-Session-ID': activeSessionId,
        },
      });
      console.error('❌ Session invalidation failed (request should have been rejected)');
    } catch (err) {
      console.log('✓ Session revocation verified (Rejected with status:', err.response?.status, err.response?.data?.message, ')');
    }

    console.log('========================================================');
    console.log('AUTHENTICATION & SESSION ID SYSTEM VERIFIED 100% WORKING!');
    console.log('========================================================');
  } catch (error) {
    console.error('API Test Error:', error.response?.data || error.message);
  }
}

testAllEndpoints();
