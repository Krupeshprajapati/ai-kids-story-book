require('dotenv').config();
var express = require('express');
var cors = require('cors');
var multer = require('multer');
var path = require('path');
var fs = require('fs');
var fsPromises = require('fs').promises;
var { v4: uuidv4 } = require('uuid');
var path = require("path");

// Our services
var pdfService = require('./services/pdfService');
var faceService = require('./services/faceService');

// Create Express app
var app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// Create directories if they don't exist
var dirs = ['./server/uploads', './server/templates', './server/output'];
dirs.forEach(function (dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure file upload
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './server/uploads');
  },
  filename: function (req, file, cb) {
    var uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

var upload = multer({ storage: storage });

// Store jobs in memory (simple approach for now)
var jobs = {};

// ============================================
// ENDPOINT 1: Health Check
// ============================================
// Health check (JSON)
app.get('/health', function (req, res) {
  res.json({
    message: 'Personalized Storybook Server is running!',
    status: 'OK',
    version: '1.0.0'
  });
});

// Serve UI
app.get('/', function (req, res) {
  res.sendFile(require('path').join(__dirname, 'test.html'));
});

// ============================================
// ENDPOINT 2: Upload Template PDF (Admin)
// ============================================
app.post('/api/templates/upload', upload.single('template'), async function (req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    var templateId = uuidv4();
    var templateName = req.body.name || 'Untitled Template';
    var pdfPath = req.file.path;

    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   TEMPLATE UPLOAD                        ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log('📚 Name:', templateName);
    console.log('📄 File:', req.file.filename);
    console.log('🆔 ID:', templateId);

    // Process the template (extract pages + illustrations)
    var metadata = await pdfService.processTemplate(pdfPath, templateId);
    metadata.name = templateName;

    // Update metadata with name
    var metadataPath = path.join(
      process.env.TEMPLATE_DIR || './server/templates',
      templateId,
      'metadata.json'
    );
    await fsPromises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    // Clean up uploaded file (we already copied it to templates folder)
    await fsPromises.unlink(pdfPath);

    console.log('✅ Template ready!');
    console.log('');

    res.json({
      message: 'Template uploaded and processed successfully!',
      templateId: templateId,
      name: templateName,
      pageCount: metadata.pageCount
    });

  } catch (error) {
    console.error('❌ Template upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ENDPOINT 3: List All Templates
// ============================================
app.get('/api/templates', async function (req, res) {
  try {
    var templateDir = process.env.TEMPLATE_DIR || './server/templates';

    // Check if directory exists
    if (!fs.existsSync(templateDir)) {
      return res.json({ templates: [] });
    }

    var templateIds = await fsPromises.readdir(templateDir);
    var templates = [];

    for (var i = 0; i < templateIds.length; i++) {
      try {
        var metadataPath = path.join(templateDir, templateIds[i], 'metadata.json');
        var metadata = JSON.parse(await fsPromises.readFile(metadataPath, 'utf-8'));
        templates.push({
          templateId: metadata.templateId,
          name: metadata.name,
          pageCount: metadata.pageCount,
          createdAt: metadata.createdAt
        });
      } catch (err) {
        // Skip invalid template folders
      }
    }

    res.json({ templates: templates });

  } catch (error) {
    console.error('❌ List templates error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ENDPOINT 4: Upload Child Photo
// ============================================
app.post('/api/upload-face', upload.single('photo'), async function (req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    var identityId = uuidv4();

    // Store identity photo in its own folder
    var identityDir = path.join('./server/uploads/identities', identityId);
    await fsPromises.mkdir(identityDir, { recursive: true });

    var storedPhotoPath = path.join(identityDir, 'photo' + path.extname(req.file.originalname));
    await fsPromises.rename(req.file.path, storedPhotoPath);

    console.log('📸 Child photo uploaded');
    console.log('🆔 Identity ID:', identityId);

    res.json({
      message: 'Photo uploaded successfully!',
      identityId: identityId
    });

  } catch (error) {
    console.error('❌ Upload face error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ENDPOINT 5: Generate Personalized Book
// ============================================
app.post('/api/generate-book', async function (req, res) {
  try {
    var templateId = req.body.templateId;
    var identityId = req.body.identityId;
    var childName = req.body.childName || '';

    if (!templateId) {
      return res.status(400).json({ error: 'Missing templateId' });
    }
    if (!identityId) {
      return res.status(400).json({ error: 'Missing identityId' });
    }

    // Create a job
    var jobId = uuidv4();
    jobs[jobId] = {
      jobId: jobId,
      status: 'processing',
      message: 'Starting personalization...',
      progress: 0,
      createdAt: new Date().toISOString()
    };

    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   GENERATING PERSONALIZED BOOK           ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log('🆔 Job ID:', jobId);
    console.log('📚 Template:', templateId);
    console.log('👤 Identity:', identityId);
    console.log('👶 Name:', childName || '(not provided)');
    console.log('');

    // Send response immediately (processing happens in background)
    res.json({
      message: 'Personalization started!',
      jobId: jobId,
      estimatedTime: '2-4 minutes'
    });

    // Start processing in background
    processBook(jobId, templateId, identityId, childName);

  } catch (error) {
    console.error('❌ Generate book error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Background Processing Function
// ============================================
async function processBook(jobId, templateId, identityId, childName) {
  try {
    // ── Step 1: Load template metadata ──
    jobs[jobId].message = 'Loading template...';
    jobs[jobId].progress = 5;

    var templateDir = path.join(process.env.TEMPLATE_DIR || './server/templates', templateId);
    var metadataPath = path.join(templateDir, 'metadata.json');
    var metadata = JSON.parse(await fsPromises.readFile(metadataPath, 'utf-8'));

    console.log('📚 Template loaded:', metadata.name);
    console.log('📄 Pages:', metadata.pageCount);

    // ── Step 2: Find child photo ──
    jobs[jobId].message = 'Loading child photo...';
    jobs[jobId].progress = 10;

    var identityDir = path.join('./server/uploads/identities', identityId);
    var identityFiles = await fsPromises.readdir(identityDir);
    var photoFile = identityFiles.find(function (f) {
      return f.startsWith('photo');
    });

    if (!photoFile) {
      throw new Error('Child photo not found');
    }

    var childPhotoPath = path.join(identityDir, photoFile);
    console.log('📸 Child photo found:', photoFile);

    // ── Step 3: Create output directory ──
    var outputDir = path.join(process.env.OUTPUT_DIR || './server/output', jobId);
    await fsPromises.mkdir(outputDir, { recursive: true });

    // ── Step 4: Face swap on all pages ──
    jobs[jobId].message = 'Swapping faces on illustrations...';
    jobs[jobId].progress = 15;

    // Update progress for each page
    var illustrations = metadata.illustrations;
    var swapResults = [];

    for (var i = 0; i < illustrations.length; i++) {
      var pageNum = i + 1;
      jobs[jobId].message = 'Processing page ' + pageNum + ' of ' + illustrations.length + '...';
      jobs[jobId].progress = 15 + Math.round((i / illustrations.length) * 65);

      var illustrationPath = illustrations[i];
      var outputPath = path.join(outputDir, 'swapped-' + pageNum + '.png');

      var result = await faceService.swapFaceOnIllustration(
        illustrationPath,
        childPhotoPath,
        outputPath,
        pageNum
      );

      swapResults.push(result);

      // Delay between API calls
      if (i < illustrations.length - 1) {
        await new Promise(function (resolve) { setTimeout(resolve, 2000); });
      }
    }

    // ── Step 5: Rebuild PDF ──
    jobs[jobId].message = 'Creating personalized PDF...';
    jobs[jobId].progress = 85;

    var outputPdfPath = path.join(outputDir, 'personalized-book.pdf');
    var swappedPaths = swapResults.map(function (r) { return r.outputPath; });

    await pdfService.rebuildPDF(templateId, swappedPaths, outputPdfPath);

    // ── Step 6: Done! ──
    var successCount = swapResults.filter(function (r) { return r.success; }).length;
    var failCount = swapResults.filter(function (r) { return !r.success; }).length;

    jobs[jobId].status = 'completed';
    jobs[jobId].message = 'Book personalized successfully!';
    jobs[jobId].progress = 100;
    jobs[jobId].result = {
      pdfPath: outputPdfPath,
      successCount: successCount,
      failCount: failCount,
      totalPages: illustrations.length
    };

    console.log('');
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   ✅ PERSONALIZATION COMPLETE!            ║');
    console.log('╠═══════════════════════════════════════════╣');
    console.log('║   Pages: ' + illustrations.length + '                              ║');
    console.log('║   Success: ' + successCount + '                            ║');
    console.log('║   Failed: ' + failCount + '                             ║');
    console.log('╚═══════════════════════════════════════════╝');
    console.log('');

  } catch (error) {
    console.error('❌ Job failed:', error);
    jobs[jobId].status = 'failed';
    jobs[jobId].message = 'Error: ' + error.message;
  }
}

// ============================================
// ENDPOINT 6: Check Job Status
// ============================================
app.get('/api/jobs/:jobId', function (req, res) {
  var job = jobs[req.params.jobId];

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(job);
});

// ============================================
// ENDPOINT 7: Download Personalized PDF
// ============================================
app.get('/api/jobs/:jobId/download', function (req, res) {
  var job = jobs[req.params.jobId];

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.status !== 'completed') {
    return res.status(400).json({
      error: 'Book is not ready yet',
      status: job.status,
      message: job.message
    });
  }

  var pdfPath = job.result.pdfPath;

  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'PDF file not found' });
  }

  res.download(pdfPath, 'personalized-storybook.pdf');
});

// ============================================
// START SERVER
// ============================================
var PORT = process.env.PORT || 5001;
app.listen(PORT, function () {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║       PERSONALIZED STORYBOOK SERVER v1.0         ║');
  console.log('╠═══════════════════════════════════════════════════╣');
  console.log('║                                                   ║');
  console.log('║   🌐 URL: http://localhost:' + PORT + '                ║');
  console.log('║                                                   ║');
  console.log('║   Endpoints:                                      ║');
  console.log('║   POST /api/templates/upload  - Upload PDF        ║');
  console.log('║   GET  /api/templates         - List templates    ║');
  console.log('║   POST /api/upload-face       - Upload photo     ║');
  console.log('║   POST /api/generate-book     - Generate book    ║');
  console.log('║   GET  /api/jobs/:id          - Job status       ║');
  console.log('║   GET  /api/jobs/:id/download - Download PDF     ║');
  console.log('║                                                   ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');
});