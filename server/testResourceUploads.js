import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function runTests() {
  console.log('🚀 Starting Comprehensive Lesson Resource & Safe Uploads Test Suite...\n');
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

  try {
    // 1. Authenticate users
    console.log('1. Authenticating Instructor & Registering Test Student...');
    const instLogin = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'instructor@learnhub.com', password: 'instructor123' }),
    });
    assert(instLogin.status === 200 && instLogin.data.token, 'Instructor login succeeded');
    const instructorToken = instLogin.data.token;

    const studentEmail = `safe_upload_student_${Date.now()}@learnhub.com`;
    const studentReg = await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Safe Upload Student',
        email: studentEmail,
        password: 'password123',
      }),
    });
    assert(studentReg.status === 201 && studentReg.data.token, 'Test Student registered successfully');
    const studentToken = studentReg.data.token;

    // 2. Fetch instructor course & lesson
    console.log('\n2. Fetching course & lesson structure...');
    const coursesRes = await request('/courses');
    assert(coursesRes.status === 200 && Array.isArray(coursesRes.data), 'Fetched courses catalog');
    const course = coursesRes.data[0];
    assert(Boolean(course), `Found course: "${course?.title}"`);

    const modulesRes = await request(`/courses/${course._id}/modules`);
    assert(modulesRes.status === 200 && Array.isArray(modulesRes.data), 'Fetched course modules');
    const module = modulesRes.data[0];
    assert(Boolean(module), `Found module: "${module?.title}"`);

    const lesson = module.lessons && module.lessons[0];
    assert(Boolean(lesson), `Found lesson: "${lesson?.title}" (ID: ${lesson?._id})`);
    const lessonId = lesson._id;

    // 3. Test Disallowed Executable Upload (.exe / script)
    console.log('\n3. Testing Security: Disallowed File Format (.exe / script)...');
    const exeBoundary = '----WebKitFormBoundaryExeTest123';
    const fakeExeContent = 'MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00';
    const exeBody = [
      `--${exeBoundary}`,
      'Content-Disposition: form-data; name="title"',
      '',
      'Malicious Executable',
      `--${exeBoundary}`,
      'Content-Disposition: form-data; name="files"; filename="payload.exe"',
      'Content-Type: application/x-msdownload',
      '',
      fakeExeContent,
      `--${exeBoundary}--`,
    ].join('\r\n');

    const exeRes = await request(`/lessons/${lessonId}/resources`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${instructorToken}`,
        'Content-Type': `multipart/form-data; boundary=${exeBoundary}`,
      },
      body: exeBody,
    });
    assert(exeRes.status === 400, `Rejected .exe file with status 400 (Received: ${exeRes.status})`);
    assert(
      typeof exeRes.data.message === 'string' && exeRes.data.message.includes('not supported'),
      `Returned clear security message: "${exeRes.data.message}"`
    );

    // 4. Test Mismatched Content / Spoofed MIME (.pdf extension but HTML content)
    console.log('\n4. Testing Security: Mismatched Magic Bytes (Spoofed PDF)...');
    const spoofBoundary = '----WebKitFormBoundarySpoof123';
    const spoofBody = [
      `--${spoofBoundary}`,
      'Content-Disposition: form-data; name="files"; filename="fake.pdf"',
      'Content-Type: application/pdf',
      '',
      '<html><script>alert("xss")</script></html>',
      `--${spoofBoundary}--`,
    ].join('\r\n');

    const spoofRes = await request(`/lessons/${lessonId}/resources`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${instructorToken}`,
        'Content-Type': `multipart/form-data; boundary=${spoofBoundary}`,
      },
      body: spoofBody,
    });
    assert(spoofRes.status === 400, `Rejected spoofed PDF signature with status 400 (Received: ${spoofRes.status})`);
    assert(
      typeof spoofRes.data.message === 'string' &&
        (spoofRes.data.message.includes('invalid or corrupted') || spoofRes.data.message.includes('not match')),
      `Returned signature mismatch error: "${spoofRes.data.message}"`
    );

    // 5. Test Unauthorized User (Student attempting to upload to lesson)
    console.log('\n5. Testing Security: Student Permission Check (Upload)...');
    const studentBoundary = '----WebKitFormBoundaryStudent123';
    const validPdfBuffer = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    const studentBody = Buffer.concat([
      Buffer.from(`--${studentBoundary}\r\nContent-Disposition: form-data; name="files"; filename="student.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
      validPdfBuffer,
      Buffer.from(`\r\n--${studentBoundary}--\r\n`),
    ]);

    const studentUploadRes = await request(`/lessons/${lessonId}/resources`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': `multipart/form-data; boundary=${studentBoundary}`,
      },
      body: studentBody,
    });
    assert(
      studentUploadRes.status === 403,
      `Student upload correctly forbidden with status 403 (Received: ${studentUploadRes.status})`
    );

    // 6. Test Valid Multi-file Upload (Valid PDF + Valid TXT + Valid PNG)
    console.log('\n6. Testing Valid Multi-File Upload by Authorized Instructor...');
    const uploadBoundary = '----WebKitFormBoundaryValidUpload123';
    
    // Valid PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const validPngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89
    ]);

    const validTxtBuffer = Buffer.from('Welcome to this lesson! Here are your lecture notes and practice exercises.');

    const uploadPayload = Buffer.concat([
      Buffer.from(`--${uploadBoundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nLesson Slide Deck\r\n`),
      Buffer.from(`--${uploadBoundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nOfficial slides and notes\r\n`),
      Buffer.from(`--${uploadBoundary}\r\nContent-Disposition: form-data; name="files"; filename="slides_chapter1.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
      validPdfBuffer,
      Buffer.from(`\r\n--${uploadBoundary}\r\nContent-Disposition: form-data; name="files"; filename="notes.txt"\r\nContent-Type: text/plain\r\n\r\n`),
      validTxtBuffer,
      Buffer.from(`\r\n--${uploadBoundary}\r\nContent-Disposition: form-data; name="files"; filename="architecture_diagram.png"\r\nContent-Type: image/png\r\n\r\n`),
      validPngBuffer,
      Buffer.from(`\r\n--${uploadBoundary}--\r\n`),
    ]);

    const uploadRes = await request(`/lessons/${lessonId}/resources`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${instructorToken}`,
        'Content-Type': `multipart/form-data; boundary=${uploadBoundary}`,
      },
      body: uploadPayload,
    });

    assert(uploadRes.status === 201, `Uploaded 3 valid files successfully with status 201 (Received: ${uploadRes.status})`);
    assert(Array.isArray(uploadRes.data.resources), 'Response contains resources array');
    assert(uploadRes.data.resources.length === 3, `Created 3 resource records (Count: ${uploadRes.data.resources?.length})`);

    const createdResources = uploadRes.data.resources;
    const pdfResource = createdResources.find((r) => r.fileExtension === '.pdf');
    const txtResource = createdResources.find((r) => r.fileExtension === '.txt');
    const pngResource = createdResources.find((r) => r.fileExtension === '.png');

    assert(Boolean(pdfResource), 'PDF resource recorded');
    assert(pdfResource?.type === 'PDF', `PDF resource type is 'PDF' (Actual: ${pdfResource?.type})`);
    assert(Boolean(pdfResource?.storedFilename), `PDF storedFilename generated: ${pdfResource?.storedFilename}`);
    assert(pdfResource?.originalFilename === 'slides_chapter1.pdf', `Original filename preserved: ${pdfResource?.originalFilename}`);
    assert(pdfResource?.fileSizeBytes === validPdfBuffer.length, `File size recorded: ${pdfResource?.fileSizeBytes} bytes`);

    // Verify physical file on disk
    const diskPath = path.join(__dirname, 'uploads', 'resources', pdfResource.storedFilename);
    assert(fs.existsSync(diskPath), `Physical file exists on disk at safe location: ${diskPath}`);

    // 7. Test List Lesson Resources (GET /lessons/:lessonId/resources)
    console.log('\n7. Listing Lesson Resources...');
    const listRes = await request(`/lessons/${lessonId}/resources`, {
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    assert(listRes.status === 200, 'Listing endpoint returns status 200');
    assert(listRes.data.some((r) => r._id === pdfResource._id), 'Listed resources include newly uploaded PDF');

    // 8. Test Retrieve Resource Metadata (GET /resources/:resourceId)
    console.log('\n8. Retrieving Resource Metadata...');
    const metaRes = await request(`/resources/${pdfResource._id}`, {
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    assert(metaRes.status === 200, 'Metadata endpoint returns status 200');
    assert(metaRes.data._id === pdfResource._id, 'Returned correct resource metadata');
    assert(!metaRes.data.storagePath.includes('..'), 'Storage path is sanitized and free of path traversal');

    // 9. Test Authorized Download (GET /resources/:resourceId/download)
    console.log('\n9. Testing Resource Download Endpoint...');
    const dlRes = await request(`/resources/${pdfResource._id}/download`, {
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    assert(dlRes.status === 200, 'Download returns status 200');
    const contentDisp = dlRes.headers.get('content-disposition') || '';
    assert(contentDisp.includes('attachment'), `Content-Disposition specifies attachment: "${contentDisp}"`);
    assert(contentDisp.includes('slides_chapter1.pdf'), `Content-Disposition includes sanitized original filename: "${contentDisp}"`);

    // 10. Test Inline Preview (GET /resources/:resourceId/preview)
    console.log('\n10. Testing Resource Preview Endpoint...');
    const prevRes = await request(`/resources/${pngResource._id}/preview`, {
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    assert(prevRes.status === 200, 'Preview returns status 200');
    const prevDisp = prevRes.headers.get('content-disposition') || '';
    assert(prevDisp.includes('inline'), `Content-Disposition specifies inline: "${prevDisp}"`);
    assert(prevRes.headers.get('content-type') === 'image/png', 'Content-Type is image/png');

    // 11. Test Metadata PATCH (PATCH /resources/:resourceId)
    console.log('\n11. Testing Resource Metadata Update (PATCH)...');
    const patchRes = await request(`/resources/${pdfResource._id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${instructorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Updated Chapter 1 Presentation Slides',
        description: 'Updated comprehensive slides with exam review notes.',
      }),
    });
    assert(patchRes.status === 200, 'PATCH returns status 200');
    assert(patchRes.data.resource?.title === 'Updated Chapter 1 Presentation Slides', 'Title updated in database');
    assert(patchRes.data.resource?.description?.includes('exam review notes'), 'Description updated in database');

    // 12. Test Replace File (PUT /resources/:resourceId/file)
    console.log('\n12. Testing Resource File Replacement (PUT)...');
    const oldStoredFilename = pdfResource.storedFilename;
    const oldFilePath = path.join(__dirname, 'uploads', 'resources', oldStoredFilename);

    const replaceBoundary = '----WebKitFormBoundaryReplace123';
    const newPdfBuffer = Buffer.from('%PDF-1.7\n%new version content here\n%%EOF');
    const replacePayload = Buffer.concat([
      Buffer.from(`--${replaceBoundary}\r\nContent-Disposition: form-data; name="file"; filename="slides_v2.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
      newPdfBuffer,
      Buffer.from(`\r\n--${replaceBoundary}--\r\n`),
    ]);

    const replaceRes = await request(`/resources/${pdfResource._id}/file`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${instructorToken}`,
        'Content-Type': `multipart/form-data; boundary=${replaceBoundary}`,
      },
      body: replacePayload,
    });
    assert(replaceRes.status === 200, 'PUT replacement returns status 200');
    assert(replaceRes.data.resource?.originalFilename === 'slides_v2.pdf', 'Updated original filename recorded');
    assert(!fs.existsSync(oldFilePath), 'Old superseded physical file safely unlinked/deleted from disk');

    const newFilePath = path.join(__dirname, 'uploads', 'resources', replaceRes.data.resource.storedFilename);
    assert(fs.existsSync(newFilePath), 'New physical file exists on disk');

    // 13. Test Unauthorized Deletion (Student attempting delete)
    console.log('\n13. Testing Unauthorized Resource Deletion...');
    const studentDelRes = await request(`/resources/${txtResource._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentDelRes.status === 403, `Student deletion forbidden with status 403 (Received: ${studentDelRes.status})`);

    // 14. Test Resource Deletion (DELETE /resources/:resourceId)
    console.log('\n14. Testing Resource Deletion & File Cleanup...');
    const txtFilePath = path.join(__dirname, 'uploads', 'resources', txtResource.storedFilename);
    assert(fs.existsSync(txtFilePath), 'Text file exists before deletion');

    const delRes = await request(`/resources/${txtResource._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    assert(delRes.status === 200, 'DELETE returns status 200');
    assert(!fs.existsSync(txtFilePath), 'Physical file removed from storage upon deletion');

    const checkRes = await request(`/resources/${txtResource._id}`, {
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    // 15. Test Max Files Limit (> 5 files)
    console.log('\n15. Testing Max File Count Restriction (> 5 files)...');
    const sixBoundary = '----WebKitFormBoundarySixFiles123';
    let sixPayloadChunks = [];
    for (let i = 1; i <= 6; i++) {
      sixPayloadChunks.push(
        Buffer.from(`--${sixBoundary}\r\nContent-Disposition: form-data; name="files"; filename="file_${i}.txt"\r\nContent-Type: text/plain\r\n\r\nFile content ${i}\r\n`)
      );
    }
    sixPayloadChunks.push(Buffer.from(`--${sixBoundary}--\r\n`));
    const sixRes = await request(`/lessons/${lessonId}/resources`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${instructorToken}`,
        'Content-Type': `multipart/form-data; boundary=${sixBoundary}`,
      },
      body: Buffer.concat(sixPayloadChunks),
    });
    assert(sixRes.status === 400, `Rejected >5 files batch with status 400 (Received: ${sixRes.status})`);
    assert(
      typeof sixRes.data.message === 'string' &&
        (sixRes.data.message.includes('maximum of 5') || sixRes.data.message.includes('limit') || sixRes.data.message.includes('Unexpected field') || sixRes.data.message.includes('Too many files')),
      `Returned clear max files limit error: "${sixRes.data.message}"`
    );

    // 16. Test Lesson Cascade Cleanup on Deletion
    console.log('\n16. Testing Cascade Cleanup when Lesson is Deleted...');
    const createLessonRes = await request(`/modules/${module._id}/lessons`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${instructorToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Temporary Test Lesson for Cascade',
        content: 'Testing resource file unlinking on lesson delete',
        order: 99,
      }),
    });
    assert(createLessonRes.status === 201, 'Created temporary lesson');
    const tempLessonId = createLessonRes.data.lesson?._id || createLessonRes.data._id;

    // Upload resource to temp lesson
    const cascadeBoundary = '----WebKitFormBoundaryCascadeTest123';
    const cascadePayload = Buffer.concat([
      Buffer.from(`--${cascadeBoundary}\r\nContent-Disposition: form-data; name="files"; filename="cascade_test.txt"\r\nContent-Type: text/plain\r\n\r\nTesting cascade file deletion on lesson removal\r\n`),
      Buffer.from(`--${cascadeBoundary}--\r\n`),
    ]);
    const cascadeUploadRes = await request(`/lessons/${tempLessonId}/resources`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${instructorToken}`,
        'Content-Type': `multipart/form-data; boundary=${cascadeBoundary}`,
      },
      body: cascadePayload,
    });
    assert(cascadeUploadRes.status === 201, 'Uploaded resource to temporary lesson');
    const cascadeResItem = cascadeUploadRes.data.resources[0];
    const cascadeFilePath = path.join(__dirname, 'uploads', 'resources', cascadeResItem.storedFilename);
    assert(fs.existsSync(cascadeFilePath), 'Cascade resource file exists on disk');

    // Delete the lesson
    const delLessonRes = await request(`/lessons/${tempLessonId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    assert(delLessonRes.status === 200, 'Lesson deleted successfully');

    // Verify resource record and file are cleaned up
    const cascadeMetaRes = await request(`/resources/${cascadeResItem._id}`, {
      headers: { Authorization: `Bearer ${instructorToken}` },
    });
    assert(cascadeMetaRes.status === 404, 'Associated resource record deleted with lesson');
    assert(!fs.existsSync(cascadeFilePath), 'Associated storage file safely deleted with lesson');

    // Clean up remaining test resources from earlier tests
    if (pngResource) {
      await request(`/resources/${pngResource._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${instructorToken}` },
      });
    }
    if (pdfResource) {
      await request(`/resources/${pdfResource._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${instructorToken}` },
      });
    }

    console.log(`\n========================================`);
    console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Unhandled error during test run:', err);
    process.exit(1);
  }
}

runTests();
