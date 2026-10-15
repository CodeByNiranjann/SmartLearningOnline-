import axios from 'axios';
import mongoose from 'mongoose';
import Course from './models/Course.js';
import Enrollment from './models/Enrollment.js';

async function testProof() {
  const baseURL = 'http://localhost:5000/api';
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online-learning');

  console.log('===========================================================');
  console.log('PROOF OF ACCEPTANCE CRITERIA: MULTI-FIELD CATALOG & ENROLL');
  console.log('===========================================================\n');

  // 1. Fetch public catalog
  const catalogRes = await axios.get(baseURL + '/courses');
  const catalog = catalogRes.data;
  console.log(`✓ 1. Public catalog returned ${catalog.length} published courses.`);

  // Verify all fields are represented
  const fields = [...new Set(catalog.map(c => c.category))];
  console.log('   Fields / Categories represented:', fields.join(', '));

  // Verify unpublished course is hidden
  const draftInDB = await Course.findOne({ status: 'draft' });
  const draftInCatalog = catalog.find(c => c.status === 'draft' || c.title.includes('Draft'));
  if (draftInCatalog) {
    throw new Error('FAILED: Draft course found in public catalog!');
  }
  console.log(`✓ 2. Unpublished course (${draftInDB ? draftInDB.title : 'None'}) is STRICTLY HIDDEN from public learners.`);

  // Direct access of unpublished course returns 404
  if (draftInDB) {
    try {
      await axios.get(`${baseURL}/courses/${draftInDB._id}`);
      throw new Error('FAILED: Direct fetch of draft course should return 404!');
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log(`✓ 3. Direct access to draft course ID returns 404 Not Found.`);
      } else {
        throw err;
      }
    }
  }

  // 4. Test Search by Keyword
  const searchKeywords = ['React', 'Python', 'DevOps', 'Flutter'];
  for (const kw of searchKeywords) {
    const sRes = await axios.get(`${baseURL}/courses`, { params: { search: kw } });
    if (sRes.data.length === 0) {
      throw new Error(`FAILED: Search for keyword "${kw}" returned 0 results`);
    }
    console.log(`✓ 4. Search keyword "${kw}": found ${sRes.data.length} course(s) -> "${sRes.data[0].title}"`);
  }

  // 5. Test Filter by Field / Category
  for (const cat of ['Web Development', 'Data Science & AI', 'Cloud & DevOps', 'Cybersecurity', 'Mobile Development']) {
    const cRes = await axios.get(`${baseURL}/courses`, { params: { category: cat } });
    if (cRes.data.length === 0 || cRes.data.some(c => c.category !== cat)) {
      throw new Error(`FAILED: Category filter for "${cat}" did not match properly`);
    }
    console.log(`✓ 5. Filter Category "${cat}": returned ${cRes.data.length} course(s)`);
  }

  // 6. Test Filter by Difficulty
  for (const diff of ['Beginner', 'Intermediate', 'Advanced']) {
    const dRes = await axios.get(`${baseURL}/courses`, { params: { difficulty: diff } });
    if (dRes.data.length === 0 || dRes.data.some(c => c.difficulty !== diff)) {
      throw new Error(`FAILED: Difficulty filter for "${diff}" did not match properly`);
    }
    console.log(`✓ 6. Filter Difficulty "${diff}": returned ${dRes.data.length} course(s)`);
  }

  // 7. Test Enrollment and Duplicate Prevention
  const rand = Date.now();
  const learnerRes = await axios.post(`${baseURL}/auth/register`, {
    name: 'Learner Verification ' + rand,
    email: 'learner_proof_' + rand + '@learnhub.com',
    password: 'password123'
  });
  const token = learnerRes.data.token;
  const learnerId = learnerRes.data.user.id;
  const targetCourse = catalog[0];

  console.log(`\n✓ 7. Register new learner: ${learnerRes.data.user.email}`);

  // First enrollment -> must succeed (201)
  const enroll1 = await axios.post(`${baseURL}/courses/${targetCourse._id}/enroll`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`✓ 8. First Enrollment in "${targetCourse.title}": Status ${enroll1.status} - "${enroll1.data.message}"`);
  if (enroll1.status !== 201) {
    throw new Error('FAILED: Expected 201 for first enrollment');
  }

  // Duplicate enrollment attempt -> must be rejected with 400
  try {
    const enroll2 = await axios.post(`${baseURL}/courses/${targetCourse._id}/enroll`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (enroll2.status !== 400) {
      throw new Error('FAILED: Duplicate enrollment did not return 400');
    }
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log(`✓ 9. Duplicate Enrollment Attempt: Correctly blocked with 400 - "${err.response.data.message}"`);
    } else {
      throw err;
    }
  }

  // Verify only 1 record in DB
  const countInDB = await Enrollment.countDocuments({ userId: learnerId, courseId: targetCourse._id });
  console.log(`✓ 10. Database verification: Exactly ${countInDB} enrollment record in MongoDB (No duplicates).`);
  if (countInDB !== 1) {
    throw new Error('FAILED: Found duplicate records in DB!');
  }

  // Attempt to enroll in draft course -> must be rejected
  if (draftInDB) {
    try {
      await axios.post(`${baseURL}/courses/${draftInDB._id}/enroll`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      throw new Error('FAILED: Enrolling in draft course was not blocked!');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`✓ 11. Enrollment in unpublished draft course: Correctly blocked with 400 - "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }
  }

  await mongoose.disconnect();
  console.log('\n===========================================================');
  console.log('ALL PROOF CRITERIA VERIFIED AND 100% OPERATIONAL!');
  console.log('===========================================================');
}

testProof().catch(err => {
  console.error('Test proof failed:', err.response?.data || err.message);
  process.exit(1);
});
