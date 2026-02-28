const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const { PDFDocument, rgb } = require('pdf-lib');

/**
 * PDF SERVICE
 * 
 * Handles:
 * 1. Converting PDF pages to images (using Python + PyMuPDF)
 * 2. Cropping left illustrations from pages
 * 3. Rebuilding PDF with personalized illustrations
 */

// ============================================
// STEP 1: Convert PDF to images using Python
// ============================================
function extractPagesFromPDF(pdfPath, outputDir) {
  return new Promise(function (resolve, reject) {
    var scriptPath = path.join(__dirname, '..', 'scripts', 'pdf_to_images.py');
    var command = 'python "' + scriptPath + '" "' + pdfPath + '" "' + outputDir + '"';

    console.log('📄 Extracting pages from PDF...');
    console.log('   Command:', command);

    exec(command, { maxBuffer: 50 * 1024 * 1024 }, function (error, stdout, stderr) {
      if (error) {
        console.error('❌ PDF extraction error:', error.message);
        reject(new Error('Failed to extract PDF pages: ' + error.message));
        return;
      }

      // Print progress from Python script
      if (stderr) {
        console.log('   ' + stderr.trim());
      }

      try {
        var result = JSON.parse(stdout.trim());

        if (result.error) {
          reject(new Error(result.error));
          return;
        }

        console.log('✅ Extracted ' + result.totalPages + ' pages from PDF');
        resolve(result);
      } catch (parseError) {
        console.error('❌ Failed to parse Python output:', stdout);
        reject(new Error('Failed to parse PDF extraction result'));
      }
    });
  });
}

// ============================================
// STEP 2: Process template (admin upload)
// ============================================
async function processTemplate(pdfPath, templateId) {
  var templateDir = path.join(process.env.TEMPLATE_DIR || './server/templates', templateId);

  // Create template directory
  await fs.mkdir(templateDir, { recursive: true });

  // Copy original PDF (we need this later for rebuilding)
  var originalPdfPath = path.join(templateDir, 'original.pdf');
  await fs.copyFile(pdfPath, originalPdfPath);

  // Extract pages and illustrations using Python
  var result = await extractPagesFromPDF(pdfPath, templateDir);

  // Save metadata
  var metadata = {
    templateId: templateId,
    name: 'Untitled Template',
    pageCount: result.totalPages,
    pages: result.pages,
    illustrations: result.illustrations,
    pageWidth: result.pageWidth,
    pageHeight: result.pageHeight,
    illustrationWidth: result.illustrationWidth,
    dpi: result.dpi,
    createdAt: new Date().toISOString()
  };

  var metadataPath = path.join(templateDir, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

  console.log('✅ Template processed and saved');
  console.log('   Template ID:', templateId);
  console.log('   Pages:', result.totalPages);

  return metadata;
}

// ============================================
// STEP 3: Rebuild PDF with personalized images
// ============================================
async function rebuildPDF(templateId, personalizedIllustrations, outputPath) {
  console.log('📄 Rebuilding PDF with personalized illustrations...');

  var templateDir = path.join(process.env.TEMPLATE_DIR || './server/templates', templateId);
  var originalPdfPath = path.join(templateDir, 'original.pdf');

  // Read the original PDF
  var pdfBytes = await fs.readFile(originalPdfPath);
  var pdfDoc = await PDFDocument.load(pdfBytes);
  var pages = pdfDoc.getPages();

  // For each page, replace the left illustration
  for (var i = 0; i < pages.length && i < personalizedIllustrations.length; i++) {
    var page = pages[i];
    var pageSize = page.getSize();
    var leftWidth = pageSize.width / 2; // Left 50% is illustration

    // Read the personalized illustration
    var illustrationBytes = await fs.readFile(personalizedIllustrations[i]);

    // Determine image type
    var illustrationPath = personalizedIllustrations[i];
    var pngImage;

    if (illustrationPath.endsWith('.jpg') || illustrationPath.endsWith('.jpeg')) {
      pngImage = await pdfDoc.embedJpg(illustrationBytes);
    } else {
      pngImage = await pdfDoc.embedPng(illustrationBytes);
    }

    // Cover the old left illustration with white rectangle
    page.drawRectangle({
      x: 0,
      y: 0,
      width: leftWidth,
      height: pageSize.height,
      color: rgb(1, 1, 1)
    });

    // Draw the new personalized illustration
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: leftWidth,
      height: pageSize.height
    });

    console.log('   ✅ Page ' + (i + 1) + ' illustration replaced');
  }

  // Save the modified PDF
  var modifiedPdfBytes = await pdfDoc.save();
  await fs.writeFile(outputPath, modifiedPdfBytes);

  console.log('✅ Personalized PDF created: ' + outputPath);
  return outputPath;
}

// Export all functions
module.exports = {
  extractPagesFromPDF: extractPagesFromPDF,
  processTemplate: processTemplate,
  rebuildPDF: rebuildPDF
};