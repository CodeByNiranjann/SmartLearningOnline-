import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING PART 3 (ADMIN MANAGEMENT & AUDIT LOG) TEST SUITE ---');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 1. Admin login
    console.log('\n1. Logging in as Admin...');
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@learnhub.com',
      password: 'admin123'
    });
    const adminToken = adminLogin.data.token;
    const adminId = adminLogin.data.user.id || adminLogin.data.user._id;
    assert(!!adminToken, 'Admin logged in successfully');

    // 2. Paginated user listing
    console.log('\n2. Fetching paginated users...');
    const usersRes = await axios.get(`${BASE_URL}/admin/users?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(usersRes.status === 200, 'Paginated users returned 200');
    assert(Array.isArray(usersRes.data.users), 'Response contains users array');
    assert(typeof usersRes.data.total === 'number', `Total count is number (${usersRes.data.total})`);
    assert(usersRes.data.page === 1, 'Current page is 1');
    assert(usersRes.data.limit === 5, 'Limit is 5');

    // Filter by role
    const instructorsRes = await axios.get(`${BASE_URL}/admin/users?role=instructor`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(instructorsRes.data.users.every(u => u.role === 'instructor'), 'Role filter returns only instructors');

    // 3. Prevent self-deactivation and self-demotion
    console.log('\n3. Testing self-action guards...');
    try {
      await axios.patch(`${BASE_URL}/admin/users/${adminId}`, {
        status: 'deactivated',
        reason: 'Testing self deactivation'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(false, 'Should have blocked self-deactivation');
    } catch (err) {
      assert(err.response?.status === 400, 'Self-deactivation blocked with 400');
    }

    try {
      await axios.patch(`${BASE_URL}/admin/users/${adminId}`, {
        role: 'student',
        reason: 'Testing self demotion'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(false, 'Should have blocked self-demotion');
    } catch (err) {
      assert(err.response?.status === 400, 'Self-demotion blocked with 400');
    }

    // 4. Create a test student user to test status modification
    console.log('\n4. Registering a test student...');
    const testStudentEmail = `audit_test_${Date.now()}@test.com`;
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Audit Target Student',
      email: testStudentEmail,
      password: 'Password123!',
      role: 'student'
    });
    const targetUserId = regRes.data.user.id || regRes.data.user._id;
    const initialStudentToken = regRes.data.token;
    assert(!!targetUserId, `Created target user: ${targetUserId}`);

    // 5. Test mandatory reason requirement
    console.log('\n5. Testing mandatory reason requirement for status changes...');
    try {
      await axios.patch(`${BASE_URL}/admin/users/${targetUserId}`, {
        status: 'deactivated',
        reason: '   ' // empty reason
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(false, 'Should have blocked status change without reason');
    } catch (err) {
      assert(err.response?.status === 400, 'Empty reason blocked with 400');
    }

    // 6. Deactivate student with valid reason
    console.log('\n6. Deactivating student with valid reason...');
    const deactRes = await axios.patch(`${BASE_URL}/admin/users/${targetUserId}`, {
      status: 'deactivated',
      reason: 'Violation of platform terms of service during assessment'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deactRes.status === 200, 'Deactivation returned 200');
    assert(deactRes.data.user.status === 'deactivated', 'User status set to deactivated');
    assert(deactRes.data.user.isActive === false, 'User isActive set to false');

    // 7. Verify deactivated user cannot log in
    console.log('\n7. Verifying deactivated user cannot log in...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: testStudentEmail,
        password: 'Password123!'
      });
      assert(false, 'Deactivated user should not be able to log in');
    } catch (err) {
      assert(err.response?.status === 401, 'Login blocked with 401');
      assert(err.response?.data?.message.includes('deactivated'), 'Error informs account is deactivated');
    }

    // 8. Verify existing token of deactivated user is rejected by auth middleware
    console.log('\n8. Verifying existing session/token of deactivated user is blocked...');
    try {
      await axios.get(`${BASE_URL}/courses`, {
        headers: { Authorization: `Bearer ${initialStudentToken}` }
      });
      // Note: if courses is public it might pass with optional protect, so let's call protected /api/quizzes/student
      await axios.get(`${BASE_URL}/quizzes/student`, {
        headers: { Authorization: `Bearer ${initialStudentToken}` }
      });
      assert(false, 'Deactivated token should be blocked by protect middleware');
    } catch (err) {
      assert(err.response?.status === 401, 'Deactivated user request rejected with 401');
    }

    // 9. Reactivate user with reason
    console.log('\n9. Reactivating user with reason...');
    const reactRes = await axios.patch(`${BASE_URL}/admin/users/${targetUserId}`, {
      status: 'active',
      reason: 'Appeal approved by administrator'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(reactRes.status === 200, 'Reactivation returned 200');
    assert(reactRes.data.user.status === 'active', 'User status set to active');

    // Now student can log in again
    const loginAgain = await axios.post(`${BASE_URL}/auth/login`, {
      email: testStudentEmail,
      password: 'Password123!'
    });
    assert(!!loginAgain.data.token, 'Reactivated user successfully logged in');

    // 10. Audit Log Inspection
    console.log('\n10. Checking append-only audit trail logs...');
    const auditRes = await axios.get(`${BASE_URL}/admin/audit-logs?limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(auditRes.status === 200, 'Audit logs returned 200');
    assert(Array.isArray(auditRes.data.logs), 'Audit logs list returned');
    assert(auditRes.data.logs.length >= 2, 'Found at least 2 audit events');

    const deactEvent = auditRes.data.logs.find(l => l.action === 'USER_DEACTIVATED' && l.targetId === targetUserId);
    assert(!!deactEvent, 'Found USER_DEACTIVATED audit log entry');
    assert(deactEvent.reason === 'Violation of platform terms of service during assessment', 'Audit log matches exact justification reason');
    assert(deactEvent.actorEmail === 'admin@learnhub.com', 'Actor email recorded properly');
    assert(deactEvent.before?.status === 'active', 'Before status recorded in audit log');
    assert(deactEvent.after?.status === 'deactivated', 'After status recorded in audit log');
    assert(!deactEvent.before?.password && !deactEvent.after?.password, 'Password hash is strictly excluded from audit log');

    const reactEvent = auditRes.data.logs.find(l => l.action === 'USER_ACTIVATED' && l.targetId === targetUserId);
    assert(!!reactEvent, 'Found USER_ACTIVATED audit log entry');
    assert(reactEvent.reason === 'Appeal approved by administrator', 'Reactivation reason recorded');

    console.log(`\n=================================================`);
    console.log(`ALL PART 3 TESTS PASSED: ${passed}/${total}`);
    console.log(`=================================================\n`);

  } catch (error) {
    console.error('\nPart 3 test suite failed with error:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
