var fs = require('fs').promises;
var path = require('path');
var { exec } = require('child_process');

/**
 * FACE SERVICE (Local Python - FREE)
 *
 * Uses InsightFace + inswapper running locally
 * Fixed: handles extra stdout messages from InsightFace
 */

// ============================================
// Helper: Delay
// ============================================
function delay(ms, message) {
  if (message) {
    console.log('   ' + message);
  }
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// ============================================
// Helper: Extract JSON from messy output
// InsightFace prints model loading info to stdout
// We need to find the actual JSON in all that text
// ============================================
function extractJSON(text) {
  // Try to find a JSON object in the text
  // Look for the LAST line that starts with {
  var lines = text.trim().split('\n');

  // Search from the end (JSON is usually the last line)
  for (var i = lines.length - 1; i >= 0; i--) {
    var line = lines[i].trim();
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        return JSON.parse(line);
      } catch (e) {
        // Not valid JSON, keep looking
      }
    }
  }

  // If no single line works, try to find JSON anywhere in the text
  var jsonStart = text.lastIndexOf('{"');
  if (jsonStart !== -1) {
    // Find the matching closing brace
    var depth = 0;
    for (var j = jsonStart; j < text.length; j++) {
      if (text[j] === '{') depth++;
      if (text[j] === '}') depth--;
      if (depth === 0) {
        var jsonStr = text.substring(jsonStart, j + 1);
        try {
          return JSON.parse(jsonStr);
        } catch (e) {
          // Not valid JSON
        }
        break;
      }
    }
  }

  return null;
}

// ============================================
// Run Python face swap on single page
// ============================================
function runPythonSwap(childPhotoPath, illustrationPath, outputPath) {
  return new Promise(function (resolve, reject) {
    var scriptPath = path.join(__dirname, '..', 'scripts', 'face_swap.py');

    var command = 'python "' + scriptPath + '" "'
      + childPhotoPath + '" "'
      + illustrationPath + '" "'
      + outputPath + '"';

    console.log('   Running Python face swap...');

    exec(
      command,
      { maxBuffer: 50 * 1024 * 1024, timeout: 300000 },
      function (error, stdout, stderr) {
        // Print Python progress (stderr has our progress messages)
        if (stderr) {
          var lines = stderr.trim().split('\n');
          lines.forEach(function (line) {
            if (line.trim()) {
              console.log('   🐍 ' + line.trim());
            }
          });
        }

        if (error) {
          reject(new Error('Python failed: ' + error.message));
          return;
        }

        // Extract JSON from stdout (may have extra InsightFace messages)
        var result = extractJSON(stdout);

        if (result) {
          resolve(result);
        } else {
          reject(new Error('No valid JSON found in Python output'));
        }
      }
    );
  });
}

// ============================================
// Run Python batch swap (all pages at once)
// ============================================
function runPythonBatchSwap(childPhotoPath, illustrationPaths, outputDir) {
  return new Promise(async function (resolve, reject) {
    var scriptPath = path.join(__dirname, '..', 'scripts', 'face_swap.py');

    // Save illustration paths to a temp JSON file
    var listFilePath = path.join(outputDir, 'illustrations-list.json');
    await fs.writeFile(listFilePath, JSON.stringify(illustrationPaths));

    var command = 'python "' + scriptPath + '" "'
      + childPhotoPath + '" "'
      + listFilePath + '" "'
      + outputDir + '"';

    console.log('   Running Python batch face swap...');
    console.log('   Cost: FREE (running locally!)');
    console.log('');

    exec(
      command,
      { maxBuffer: 50 * 1024 * 1024, timeout: 600000 },
      function (error, stdout, stderr) {
        // Print Python progress
        if (stderr) {
          var lines = stderr.trim().split('\n');
          lines.forEach(function (line) {
            if (line.trim()) {
              console.log('   🐍 ' + line.trim());
            }
          });
        }

        if (error) {
          reject(new Error('Python batch failed: ' + error.message));
          return;
        }

        // Extract JSON from stdout
        var result = extractJSON(stdout);

        if (result) {
          resolve(result);
        } else {
          reject(new Error('No valid JSON found in batch output'));
        }
      }
    );
  });
}

// ============================================
// Swap face on single illustration
// ============================================
async function swapFaceOnIllustration(illustrationPath, childPhotoPath, outputPath, pageNumber) {
  console.log('🎨 Swapping face on page ' + pageNumber + '...');

  try {
    var result = await runPythonSwap(childPhotoPath, illustrationPath, outputPath);

    if (result.success) {
      console.log('   ✅ Page ' + pageNumber + ' face swapped!');
      return {
        success: true,
        page: pageNumber,
        outputPath: outputPath
      };
    } else {
      console.log('   ⚠️ Page ' + pageNumber + ': ' + result.error);
      await fs.copyFile(illustrationPath, outputPath);
      return {
        success: false,
        page: pageNumber,
        error: result.error,
        outputPath: outputPath
      };
    }

  } catch (error) {
    console.error('   ❌ Page ' + pageNumber + ' error:', error.message);
    await fs.copyFile(illustrationPath, outputPath);
    return {
      success: false,
      page: pageNumber,
      error: error.message,
      outputPath: outputPath
    };
  }
}

// ============================================
// Process ALL pages (uses batch mode)
// ============================================
async function processAllPages(illustrations, childPhotoPath, outputDir) {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   FACE SWAP (InsightFace - Local - FREE)');
  console.log('   Processing ' + illustrations.length + ' pages');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  try {
    var result = await runPythonBatchSwap(
      childPhotoPath,
      illustrations,
      outputDir
    );

    if (result.success) {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('   RESULTS: ' + result.successCount + '/' + result.totalPages + ' pages swapped');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

      var outputPaths = [];
      for (var i = 0; i < illustrations.length; i++) {
        outputPaths.push(
          path.join(outputDir, 'swapped-' + (i + 1) + '.png')
        );
      }

      return {
        results: result.results,
        successCount: result.successCount,
        failCount: result.failCount,
        totalPages: result.totalPages,
        outputPaths: outputPaths
      };
    } else {
      throw new Error(result.error || 'Batch processing failed');
    }

  } catch (error) {
    console.error('❌ Batch error:', error.message);
    console.log('Falling back to single-page mode...');

    var results = [];
    var successCount = 0;
    var failCount = 0;
    var outputPaths = [];

    for (var i = 0; i < illustrations.length; i++) {
      var pageNumber = i + 1;
      var outputPath = path.join(outputDir, 'swapped-' + pageNumber + '.png');

      var pageResult = await swapFaceOnIllustration(
        illustrations[i],
        childPhotoPath,
        outputPath,
        pageNumber
      );

      results.push(pageResult);
      outputPaths.push(outputPath);

      if (pageResult.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    return {
      results: results,
      successCount: successCount,
      failCount: failCount,
      totalPages: illustrations.length,
      outputPaths: outputPaths
    };
  }
}

module.exports = {
  swapFaceOnIllustration: swapFaceOnIllustration,
  processAllPages: processAllPages
};