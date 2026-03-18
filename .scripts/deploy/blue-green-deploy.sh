#!/bin/bash

# Blue-Green Deployment Script
# This script implements the blue-green deployment strategy for the theeeecopy project

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_FILE="${PROJECT_ROOT}/logs/deployment.log"
DEPLOYMENT_CONFIG="${PROJECT_ROOT}/deployment.config"

# Default configuration
BLUE_PORT=${BLUE_PORT:-3001}
GREEN_PORT=${GREEN_PORT:-3002}
NGINX_CONFIG="/etc/nginx/sites-available/theeeecopy"
NGINX_ENABLED_CONFIG="/etc/nginx/sites-enabled/theeeecopy"
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-60}
SMOKE_TEST_TIMEOUT=${SMOKE_TEST_TIMEOUT:-120}
ROLLBACK_ON_FAILURE=${ROLLBACK_ON_FAILURE:-true}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

info() {
    log "INFO" "$@"
    echo -e "${BLUE}[INFO]${NC} $*"
}

warn() {
    log "WARN" "$@"
    echo -e "${YELLOW}[WARN]${NC} $*"
}

error() {
    log "ERROR" "$@"
    echo -e "${RED}[ERROR]${NC} $*"
}

success() {
    log "SUCCESS" "$@"
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

# Check if required tools are available
check_dependencies() {
    local deps=("nginx" "curl" "jq" "pm2" "git")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Missing dependencies: ${missing_deps[*]}"
        exit 1
    fi
    
    info "All dependencies are available"
}

# Create necessary directories
create_directories() {
    mkdir -p "${PROJECT_ROOT}/logs"
    mkdir -p "${PROJECT_ROOT}/backups"
    mkdir -p "${PROJECT_ROOT}/scripts"
    info "Created necessary directories"
}

# Get current active environment
get_current_environment() {
    if [ -f "${NGINX_CONFIG}" ]; then
        if grep -q "localhost:${BLUE_PORT}" "${NGINX_CONFIG}"; then
            echo "blue"
        elif grep -q "localhost:${GREEN_PORT}" "${NGINX_CONFIG}"; then
            echo "green"
        else
            echo "unknown"
        fi
    else
        echo "unknown"
    fi
}

# Get inactive environment
get_inactive_environment() {
    local current=$(get_current_environment)
    if [ "$current" = "blue" ]; then
        echo "green"
    elif [ "$current" = "green" ]; then
        echo "blue"
    else
        echo "blue" # Default to blue if unknown
    fi
}

# Check if environment is healthy
check_health() {
    local environment=$1
    local port=$2
    local health_url="http://localhost:${port}/health"
    local max_attempts=30
    local attempt=1
    
    info "Checking health of ${environment} environment on port ${port}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "${health_url}" > /dev/null; then
            success "Health check passed for ${environment} environment"
            return 0
        else
            warn "Health check attempt ${attempt}/${max_attempts} failed for ${environment}"
            sleep 2
            attempt=$((attempt + 1))
        fi
    done
    
    error "Health check failed for ${environment} environment after ${max_attempts} attempts"
    return 1
}

# Check readiness of environment
check_readiness() {
    local environment=$1
    local port=$2
    local readiness_url="http://localhost:${port}/health/ready"
    local max_attempts=30
    local attempt=1
    
    info "Checking readiness of ${environment} environment on port ${port}"
    
    while [ $attempt -le $max_attempts ]; do
        local response=$(curl -f -s "${readiness_url}" 2>/dev/null || echo '{"status":"not_ready"}')
        local status=$(echo "$response" | jq -r '.status' 2>/dev/null || echo "not_ready")
        
        if [ "$status" = "ready" ]; then
            success "Readiness check passed for ${environment} environment"
            return 0
        else
            warn "Readiness check attempt ${attempt}/${max_attempts} failed for ${environment}"
            sleep 2
            attempt=$((attempt + 1))
        fi
    done
    
    error "Readiness check failed for ${environment} environment after ${max_attempts} attempts"
    return 1
}

# Run smoke tests
run_smoke_tests() {
    local environment=$1
    local port=$2
    local smoke_test_url="http://localhost:${port}/health/detailed"
    
    info "Running smoke tests for ${environment} environment"
    
    # Test basic health endpoint
    if ! curl -f -s "http://localhost:${port}/health" > /dev/null; then
        error "Basic health check failed for ${environment}"
        return 1
    fi
    
    # Test detailed health endpoint
    local response=$(curl -f -s "${smoke_test_url}" 2>/dev/null || echo '{}')
    local overall_status=$(echo "$response" | jq -r '.status' 2>/dev/null || echo "unknown")
    
    if [ "$overall_status" = "healthy" ]; then
        success "Smoke tests passed for ${environment} environment"
        return 0
    else
        error "Smoke tests failed for ${environment} environment"
        echo "Response: $response"
        return 1
    fi
}

# Deploy to specific environment
deploy_to_environment() {
    local environment=$1
    local port=$2
    
    info "Deploying to ${environment} environment on port ${port}"
    
    cd "${PROJECT_ROOT}"
    
    # Pull latest changes
    info "Pulling latest changes from git"
    git pull origin main
    
    # Install dependencies
    info "Installing dependencies"
    pnpm install --frozen-lockfile
    
    # Build the application
    info "Building the application"
    pnpm build
    
    # Set environment variables for this environment
    export PORT=$port
    export NODE_ENV="production"
    export ENVIRONMENT="${environment}"
    
    # Stop existing PM2 process if running
    pm2 stop "theeeecopy-${environment}" 2>/dev/null || true
    pm2 delete "theeeecopy-${environment}" 2>/dev/null || true
    
    # Start the application with PM2
    info "Starting ${environment} environment with PM2"
    pm2 start dist/server.js --name "theeeecopy-${environment}" --env production --port $port
    
    # Wait for application to start
    sleep 10
    
    # Check if PM2 process is running
    if pm2 describe "theeeecopy-${environment}" > /dev/null 2>&1; then
        success "Successfully deployed to ${environment} environment"
        return 0
    else
        error "Failed to deploy to ${environment} environment"
        return 1
    fi
}

# Update Nginx configuration to switch traffic
switch_traffic() {
    local new_environment=$1
    local new_port=$2
    
    info "Switching traffic to ${new_environment} environment on port ${new_port}"
    
    # Create backup of current Nginx config
    cp "${NGINX_CONFIG}" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Update Nginx configuration
    cat > "${NGINX_CONFIG}" << EOF
upstream theeeecopy_backend {
    server localhost:${new_port} max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name _;
    
    # Health checks
    location /health {
        proxy_pass http://theeeecopy_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        access_log off;
    }
    
    location /health/live {
        proxy_pass http://theeeecopy_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        access_log off;
    }
    
    location /health/ready {
        proxy_pass http://theeeecopy_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        access_log off;
    }
    
    # Main application
    location / {
        proxy_pass http://theeeecopy_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
EOF
    
    # Test Nginx configuration
    if nginx -t; then
        # Reload Nginx
        nginx -s reload
        success "Successfully switched traffic to ${new_environment} environment"
        return 0
    else
        error "Nginx configuration test failed"
        return 1
    fi
}

# Rollback to previous environment
rollback() {
    local previous_environment=$1
    local previous_port=$2
    
    warn "Rolling back to ${previous_environment} environment on port ${previous_port}"
    
    # Switch traffic back to previous environment
    if switch_traffic "$previous_environment" "$previous_port"; then
        success "Successfully rolled back to ${previous_environment} environment"
        
        # Stop the new environment
        local current_environment=$(get_current_environment)
        if [ "$current_environment" != "$previous_environment" ]; then
            pm2 stop "theeeecopy-${previous_environment}" 2>/dev/null || true
        fi
        
        return 0
    else
        error "Rollback failed - manual intervention required"
        return 1
    fi
}

# Main deployment function
deploy() {
    info "Starting Blue-Green deployment process"
    
    # Check dependencies
    check_dependencies
    
    # Create directories
    create_directories
    
    # Get current and target environments
    local current_environment=$(get_current_environment)
    local target_environment=$(get_inactive_environment)
    
    info "Current active environment: ${current_environment}"
    info "Target environment: ${target_environment}"
    
    # Determine ports
    local target_port
    local current_port
    if [ "$target_environment" = "blue" ]; then
        target_port=$BLUE_PORT
        current_port=$GREEN_PORT
    else
        target_port=$GREEN_PORT
        current_port=$BLUE_PORT
    fi
    
    # Deploy to target environment
    if ! deploy_to_environment "$target_environment" "$target_port"; then
        error "Deployment to ${target_environment} failed"
        exit 1
    fi
    
    # Wait for application to be ready
    sleep 5
    
    # Run health checks
    if ! check_health "$target_environment" "$target_port"; then
        error "Health check failed for ${target_environment}"
        if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
            rollback "$current_environment" "$current_port"
        fi
        exit 1
    fi
    
    # Run readiness checks
    if ! check_readiness "$target_environment" "$target_port"; then
        error "Readiness check failed for ${target_environment}"
        if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
            rollback "$current_environment" "$current_port"
        fi
        exit 1
    fi
    
    # Run smoke tests
    if ! run_smoke_tests "$target_environment" "$target_port"; then
        error "Smoke tests failed for ${target_environment}"
        if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
            rollback "$current_environment" "$current_port"
        fi
        exit 1
    fi
    
    # Switch traffic
    if ! switch_traffic "$target_environment" "$target_port"; then
        error "Traffic switch failed"
        if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
            rollback "$current_environment" "$current_port"
        fi
        exit 1
    fi
    
    # Wait a bit and verify traffic is flowing
    sleep 5
    
    # Final health check on the new active environment
    if ! check_health "$target_environment" "$target_port"; then
        error "Final health check failed after traffic switch"
        if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
            rollback "$current_environment" "$current_port"
        fi
        exit 1
    fi
    
    success "Blue-Green deployment completed successfully!"
    success "New active environment: ${target_environment}"
    success "Previous environment: ${current_environment} (kept as backup)"
    
    # Cleanup old environment after successful deployment
    info "Cleaning up previous environment (${current_environment}) in 60 seconds..."
    (
        sleep 60
        pm2 stop "theeeecopy-${current_environment}" 2>/dev/null || true
        pm2 delete "theeeecopy-${current_environment}" 2>/dev/null || true
        info "Cleaned up previous environment (${current_environment})"
    ) &
}

# Status function
status() {
    local current_environment=$(get_current_environment)
    local blue_status="stopped"
    local green_status="stopped"
    
    if pm2 describe "theeeecopy-blue" > /dev/null 2>&1; then
        blue_status=$(pm2 jlist | jq -r '.[] | select(.name=="theeeecopy-blue") | .pm2_env.status' 2>/dev/null || echo "unknown")
    fi
    
    if pm2 describe "theeeecopy-green" > /dev/null 2>&1; then
        green_status=$(pm2 jlist | jq -r '.[] | select(.name=="theeeecopy-green") | .pm2_env.status' 2>/dev/null || echo "unknown")
    fi
    
    echo -e "${BLUE}=== Blue-Green Deployment Status ===${NC}"
    echo -e "Current Active Environment: ${GREEN}${current_environment}${NC}"
    echo -e "Blue Environment: ${blue_status}"
    echo -e "Green Environment: ${green_status}"
    echo -e "Blue Port: ${BLUE_PORT}"
    echo -e "Green Port: ${GREEN_PORT}"
}

# Help function
help() {
    echo "Blue-Green Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy    - Perform blue-green deployment"
    echo "  status    - Show current deployment status"
    echo "  rollback  - Rollback to previous environment (manual)"
    echo "  help      - Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  BLUE_PORT              - Port for blue environment (default: 3001)"
    echo "  GREEN_PORT             - Port for green environment (default: 3002)"
    echo "  HEALTH_CHECK_TIMEOUT   - Health check timeout in seconds (default: 60)"
    echo "  SMOKE_TEST_TIMEOUT     - Smoke test timeout in seconds (default: 120)"
    echo "  ROLLBACK_ON_FAILURE    - Auto rollback on failure (default: true)"
    echo ""
    echo "Example:"
    echo "  $0 deploy"
    echo "  BLUE_PORT=3003 GREEN_PORT=3004 $0 deploy"
}

# Main script logic
main() {
    case "${1:-deploy}" in
        deploy)
            deploy
            ;;
        status)
            status
            ;;
        rollback)
            # Manual rollback - requires knowing which environment to rollback to
            error "Manual rollback not implemented. Use status to check current state."
            exit 1
            ;;
        help|--help|-h)
            help
            ;;
        *)
            error "Unknown command: $1"
            help
            exit 1
            ;;
    esac
}

# Create log file
touch "${LOG_FILE}"

# Run main function
main "$@"