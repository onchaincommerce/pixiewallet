#!/bin/bash
# Direct curl script to access Coinbase CDP API
# This script reads API credentials from .env file

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "Error: .env file not found"
  exit 1
fi

# Check if required variables are set
if [ -z "$CDP_API_KEY_ID" ] || [ -z "$CDP_API_KEY_SECRET" ] || [ -z "$CDP_WALLET_SECRET" ]; then
  echo "Error: CDP credentials missing from .env file"
  echo "Required: CDP_API_KEY_ID, CDP_API_KEY_SECRET, and CDP_WALLET_SECRET"
  exit 1
fi

# Print credentials being used (partially redacted for security)
echo "Using CDP API Key ID: $CDP_API_KEY_ID"
echo "Using CDP API Key Secret: ${CDP_API_KEY_SECRET:0:5}...${CDP_API_KEY_SECRET: -5}"
echo "Using CDP Wallet Secret: ${CDP_WALLET_SECRET:0:5}..."

# Function to generate the authentication signature
generate_signature() {
  local timestamp=$1
  local method=$2
  local path=$3
  local body=$4

  # Create the message to sign
  local message="${timestamp}${method}${path}${body}"
  
  # Generate the signature using OpenSSL
  local signature=$(echo -n "$message" | openssl dgst -sha256 -hmac "$CDP_API_KEY_SECRET" | cut -d ' ' -f 2)
  echo "$signature"
}

# Basic curl function for CDP API requests
make_request() {
  local method=$1
  local path=$2
  local body=$3
  
  # Generate timestamp (seconds since epoch)
  local timestamp=$(date +%s)
  
  # Generate signature
  local signature=$(generate_signature "$timestamp" "$method" "$path" "$body")
  
  # Base URL - using the one defined in the .env file
  local url="${CDP_API_URL:-https://api.cdp.coinbase.com}$path"
  
  echo "Making $method request to: $url"
  echo "Timestamp: $timestamp"
  echo "Signature: $signature"
  
  # Make the curl request with all required headers
  curl -s -X "$method" "$url" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -H "X-CB-ACCESS-KEY: $CDP_API_KEY_ID" \
    -H "X-CB-ACCESS-TIMESTAMP: $timestamp" \
    -H "X-CB-ACCESS-SIGN: $signature" \
    -H "X-CB-WALLET-SECRET: $CDP_WALLET_SECRET" \
    -d "$body" | jq . || echo "Response is not valid JSON"
  
  echo # Add a newline after the response
}

# Function to list EOA accounts - try various endpoint paths based on docs
list_eoa_accounts() {
  echo "=== Attempt 1: Listing EOA Accounts via /platform/v2/evm/accounts ==="
  make_request "GET" "/platform/v2/evm/accounts" ""
  
  echo -e "\n=== Attempt 2: Listing EOA Accounts via /v2/evm/accounts ==="
  make_request "GET" "/v2/evm/accounts" ""
  
  echo -e "\n=== Attempt 3: Listing EOA Accounts via /evm/accounts ==="
  make_request "GET" "/evm/accounts" ""
}

# Function to list smart accounts - try various endpoint paths
list_smart_accounts() {
  echo "=== Attempt 1: Listing Smart Accounts via /platform/v2/evm/smart-accounts ==="
  make_request "GET" "/platform/v2/evm/smart-accounts" ""
  
  echo -e "\n=== Attempt 2: Listing Smart Accounts via /v2/evm/smart-accounts ==="
  make_request "GET" "/v2/evm/smart-accounts" ""
  
  echo -e "\n=== Attempt 3: Listing Smart Accounts via /evm/smart-accounts ==="
  make_request "GET" "/evm/smart-accounts" ""
}

# Execute both API calls
echo "======================================"
echo "  COINBASE CDP API DIRECT CURL CALLS"
echo "======================================"
echo "Network ID: ${NEXT_PUBLIC_CDP_NETWORK_ID:-base-sepolia}"
echo "API URL: ${CDP_API_URL:-https://api.cdp.coinbase.com}"
echo "======================================"

# Install jq for JSON formatting if not available
if ! command -v jq &> /dev/null; then
  echo "Note: Installing jq would improve output formatting"
fi

# Run the API calls
list_eoa_accounts
echo
list_smart_accounts

echo "======================================"
echo "Done!" 