// Simple script to extract wallet addresses from Next.js cache and logs
// No API access needed

import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Function to extract Ethereum addresses from text
function extractAddresses(text) {
  // Match standard Ethereum addresses
  const addressRegex = /0x[a-fA-F0-9]{40}/g;
  const matches = text.match(addressRegex);
  return matches ? [...new Set(matches)] : [];
}

// Function to recursively read files from a directory
function readFilesInDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other large directories
      if (!['node_modules', '.git', '.next/cache/webpack'].includes(file)) {
        readFilesInDir(filePath, fileList);
      }
    } else if (
      // Only look at these file types
      (file.endsWith('.json') || file.endsWith('.log') || file.endsWith('.txt')) &&
      // And check file size is not too big
      stat.size < 5 * 1024 * 1024 // 5MB max
    ) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Search for addresses in Next.js local storage cache
function searchLocalStorage() {
  console.log('🔍 Searching for wallet addresses in Next.js cache...');
  
  // Places to look for addresses
  const searchDirs = [
    '.next/server/app',
    '.next/cache/fetch-cache'
  ];
  
  let allAddresses = [];
  
  searchDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Directory ${dir} does not exist, skipping`);
      return;
    }
    
    try {
      const files = readFilesInDir(dir);
      console.log(`Found ${files.length} files in ${dir} to search`);
      
      files.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const addresses = extractAddresses(content);
          
          if (addresses.length > 0) {
            console.log(`Found ${addresses.length} addresses in ${file}`);
            allAddresses = [...allAddresses, ...addresses];
          }
        } catch (err) {
          // Skip files that can't be read
        }
      });
    } catch (err) {
      console.error(`Error reading ${dir}:`, err);
    }
  });
  
  // Unique addresses only
  allAddresses = [...new Set(allAddresses)];
  
  if (allAddresses.length > 0) {
    console.log(`\n✅ Found ${allAddresses.length} unique wallet addresses:`);
    
    // Group addresses
    allAddresses.forEach((addr, i) => {
      console.log(`${i+1}. ${addr}`);
      console.log(`   Verify: https://sepolia.basescan.org/address/${addr}`);
    });
  } else {
    console.log('❌ No wallet addresses found');
  }
  
  return allAddresses;
}

// Directly parse any log files in the root directory
function parseLogFiles() {
  console.log('\n🔍 Searching log files in project root...');
  
  const logFiles = fs.readdirSync('.')
    .filter(file => file.endsWith('.log') || file.toLowerCase().includes('log'));
  
  if (logFiles.length === 0) {
    console.log('No log files found in project root');
    return [];
  }
  
  console.log(`Found ${logFiles.length} log files to parse`);
  
  let allAddresses = [];
  
  logFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const addresses = extractAddresses(content);
      
      if (addresses.length > 0) {
        console.log(`Found ${addresses.length} addresses in ${file}`);
        allAddresses = [...allAddresses, ...addresses];
      }
    } catch (err) {
      console.error(`Error reading ${file}:`, err);
    }
  });
  
  // Unique addresses only
  allAddresses = [...new Set(allAddresses)];
  
  if (allAddresses.length > 0) {
    console.log(`\n✅ Found ${allAddresses.length} unique wallet addresses in logs:`);
    
    allAddresses.forEach((addr, i) => {
      console.log(`${i+1}. ${addr}`);
      console.log(`   Verify: https://sepolia.basescan.org/address/${addr}`);
    });
  } else {
    console.log('❌ No wallet addresses found in log files');
  }
  
  return allAddresses;
}

// Main function
async function main() {
  console.log('====================================');
  console.log('    WALLET ADDRESS FINDER');
  console.log('====================================');
  
  // Get CDP key information
  console.log(`Network ID: ${process.env.NEXT_PUBLIC_CDP_NETWORK_ID || 'base-sepolia'}`);
  
  // Search Next.js cache
  const cacheAddresses = searchLocalStorage();
  
  // Parse log files
  const logAddresses = parseLogFiles();
  
  // Combine all unique addresses
  const allAddresses = [...new Set([...cacheAddresses, ...logAddresses])];
  
  console.log('\n====================================');
  console.log(`Total unique addresses found: ${allAddresses.length}`);
  console.log('====================================');
  
  if (allAddresses.length > 0) {
    console.log('\nVerify all addresses:');
    allAddresses.forEach(addr => {
      console.log(`https://sepolia.basescan.org/address/${addr}`);
    });
  }
}

// Run the script
main().catch(console.error); 