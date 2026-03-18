#!/bin/bash

# ===================================================================
# CDN Upload Script - سكريبت رفع الأصول إلى CDN
# ===================================================================
# This script uploads static assets from /frontend/public to CDN
# هذا السكريبت يرفع الأصول الثابتة من /frontend/public إلى CDN
#
# Usage:
#   ./scripts/upload-to-cdn.sh [cloudflare|aws|bunny]
#
# استخدام:
#   ./scripts/upload-to-cdn.sh [cloudflare|aws|bunny]
# ===================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_message "$BLUE" "
╔═══════════════════════════════════════════════════════════════╗
║         CDN Upload Script - سكريبت رفع الأصول إلى CDN         ║
╚═══════════════════════════════════════════════════════════════╝
"

# Check if CDN provider is specified
CDN_PROVIDER=${1:-"cloudflare"}

print_message "$YELLOW" "📦 CDN Provider: $CDN_PROVIDER"
print_message "$YELLOW" "📁 Source Directory: frontend/public/"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if public directory exists
if [ ! -d "frontend/public" ]; then
    print_message "$RED" "❌ Error: frontend/public directory not found!"
    exit 1
fi

# ===================================================================
# 1. Cloudflare R2
# ===================================================================
upload_cloudflare() {
    print_message "$BLUE" "🌐 Uploading to Cloudflare R2..."

    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        print_message "$RED" "❌ Error: wrangler CLI not found!"
        print_message "$YELLOW" "Install it with: pnpm install -g wrangler"
        exit 1
    fi

    # R2 Bucket name (change this to your bucket name)
    BUCKET_NAME="${CLOUDFLARE_R2_BUCKET:-the-copy-assets}"

    print_message "$YELLOW" "📝 Using bucket: $BUCKET_NAME"

    # Upload fonts
    print_message "$BLUE" "📝 Uploading fonts..."
    if [ -d "frontend/public/fonts" ]; then
        wrangler r2 object put "$BUCKET_NAME/fonts" \
            --file=frontend/public/fonts \
            --recursive \
            --content-type="font/woff2"
        print_message "$GREEN" "✅ Fonts uploaded"
    fi

    # Upload images
    print_message "$BLUE" "🖼️  Uploading images..."
    if [ -d "frontend/public/images" ]; then
        wrangler r2 object put "$BUCKET_NAME/images" \
            --file=frontend/public/images \
            --recursive
        print_message "$GREEN" "✅ Images uploaded"
    fi

    # Upload directors-studio assets
    print_message "$BLUE" "🎬 Uploading directors-studio assets..."
    if [ -d "frontend/public/directors-studio" ]; then
        wrangler r2 object put "$BUCKET_NAME/directors-studio" \
            --file=frontend/public/directors-studio \
            --recursive
        print_message "$GREEN" "✅ Directors Studio assets uploaded"
    fi

    # Upload pdf-worker
    print_message "$BLUE" "📄 Uploading pdf-worker..."
    if [ -d "frontend/public/pdf-worker" ]; then
        wrangler r2 object put "$BUCKET_NAME/pdf-worker" \
            --file=frontend/public/pdf-worker \
            --recursive
        print_message "$GREEN" "✅ PDF Worker uploaded"
    fi

    print_message "$GREEN" "
╔═══════════════════════════════════════════════════════════════╗
║           ✅ Upload to Cloudflare R2 Complete!                ║
╚═══════════════════════════════════════════════════════════════╝
"
}

# ===================================================================
# 2. AWS S3 / CloudFront
# ===================================================================
upload_aws() {
    print_message "$BLUE" "☁️  Uploading to AWS S3..."

    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_message "$RED" "❌ Error: AWS CLI not found!"
        print_message "$YELLOW" "Install it from: https://aws.amazon.com/cli/"
        exit 1
    fi

    # S3 Bucket name (change this to your bucket name)
    S3_BUCKET="${AWS_S3_BUCKET:-the-copy-assets}"

    print_message "$YELLOW" "📝 Using bucket: s3://$S3_BUCKET"

    # Sync all files with cache headers
    print_message "$BLUE" "📤 Syncing all assets..."
    aws s3 sync frontend/public/ "s3://$S3_BUCKET/" \
        --acl public-read \
        --cache-control "public, max-age=31536000, immutable" \
        --metadata-directive REPLACE \
        --delete

    print_message "$GREEN" "✅ All assets synced to S3"

    # Get CloudFront Distribution ID (optional)
    DISTRIBUTION_ID="${AWS_CLOUDFRONT_DISTRIBUTION_ID:-}"

    if [ -n "$DISTRIBUTION_ID" ]; then
        print_message "$BLUE" "🔄 Invalidating CloudFront cache..."
        aws cloudfront create-invalidation \
            --distribution-id "$DISTRIBUTION_ID" \
            --paths "/*"
        print_message "$GREEN" "✅ Cache invalidated"
    else
        print_message "$YELLOW" "⚠️  No CloudFront Distribution ID set. Skipping cache invalidation."
        print_message "$YELLOW" "    Set AWS_CLOUDFRONT_DISTRIBUTION_ID to enable."
    fi

    print_message "$GREEN" "
╔═══════════════════════════════════════════════════════════════╗
║              ✅ Upload to AWS S3 Complete!                    ║
╚═══════════════════════════════════════════════════════════════╝
"
}

# ===================================================================
# 3. BunnyCDN
# ===================================================================
upload_bunny() {
    print_message "$BLUE" "🐰 Uploading to BunnyCDN..."

    # Check if required env vars are set
    if [ -z "$BUNNYCDN_API_KEY" ] || [ -z "$BUNNYCDN_STORAGE_ZONE" ]; then
        print_message "$RED" "❌ Error: BunnyCDN credentials not set!"
        print_message "$YELLOW" "Set BUNNYCDN_API_KEY and BUNNYCDN_STORAGE_ZONE"
        exit 1
    fi

    STORAGE_ZONE="$BUNNYCDN_STORAGE_ZONE"
    API_KEY="$BUNNYCDN_API_KEY"
    REGION="${BUNNYCDN_REGION:-de}"  # Default to Germany

    # Upload function
    upload_file() {
        local file=$1
        local remote_path=$2

        curl -X PUT \
            "https://$REGION.storage.bunnycdn.com/$STORAGE_ZONE/$remote_path" \
            -H "AccessKey: $API_KEY" \
            -H "Content-Type: application/octet-stream" \
            --data-binary "@$file" \
            --silent
    }

    # Upload all files
    print_message "$BLUE" "📤 Uploading files..."

    find frontend/public -type f | while read file; do
        relative_path="${file#frontend/public/}"
        print_message "$YELLOW" "  Uploading: $relative_path"
        upload_file "$file" "$relative_path"
    done

    print_message "$GREEN" "
╔═══════════════════════════════════════════════════════════════╗
║             ✅ Upload to BunnyCDN Complete!                   ║
╚═══════════════════════════════════════════════════════════════╝
"
}

# ===================================================================
# Main execution
# ===================================================================
case "$CDN_PROVIDER" in
    cloudflare|cf)
        upload_cloudflare
        ;;
    aws|s3)
        upload_aws
        ;;
    bunny|bunnycdn)
        upload_bunny
        ;;
    *)
        print_message "$RED" "❌ Error: Unknown CDN provider '$CDN_PROVIDER'"
        print_message "$YELLOW" "Supported providers: cloudflare, aws, bunny"
        echo ""
        print_message "$BLUE" "Usage:"
        echo "  ./scripts/upload-to-cdn.sh cloudflare"
        echo "  ./scripts/upload-to-cdn.sh aws"
        echo "  ./scripts/upload-to-cdn.sh bunny"
        exit 1
        ;;
esac

# ===================================================================
# Post-upload summary
# ===================================================================
print_message "$GREEN" "
✅ Upload Complete!

📊 Summary:
   - Provider: $CDN_PROVIDER
   - Source: frontend/public/
   - Assets: ~4 MB total

📝 Next Steps:
   1. Update .env.local with CDN URL
   2. Set NEXT_PUBLIC_ENABLE_CDN=true
   3. Test with: pnpm build && pnpm start
   4. Check assets load from CDN in DevTools

📖 Documentation: docs/CDN_SETUP.md
"

exit 0
