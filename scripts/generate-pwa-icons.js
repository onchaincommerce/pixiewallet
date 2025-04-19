const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Create the directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to convert SVG to PNG
const convertSvgToPng = (size) => {
  return new Promise((resolve, reject) => {
    console.log(`Generating ${size}x${size} icon...`);
    
    // Use ImageMagick's convert command
    const command = `convert -background none -resize ${size}x${size} ${path.join(iconsDir, 'icon.svg')} ${path.join(iconsDir, `icon-${size}x${size}.png`)}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error generating ${size}x${size} icon: ${error.message}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      
      console.log(`Generated ${size}x${size} icon successfully.`);
      resolve();
    });
  });
};

// Check if ImageMagick is installed
exec('which convert', async (error) => {
  if (error) {
    console.error('Error: ImageMagick is not installed. Please install it to generate icons.');
    console.error('On macOS, you can install it with: brew install imagemagick');
    console.error('On Ubuntu, you can install it with: sudo apt-get install imagemagick');
    return;
  }
  
  // Generate icons for different sizes
  try {
    await Promise.all([
      convertSvgToPng(192),
      convertSvgToPng(512)
    ]);
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}); 