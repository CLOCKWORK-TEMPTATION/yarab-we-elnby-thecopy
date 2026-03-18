#!/bin/bash

# Blue-Green Deployment Setup Script
# This script helps set up the blue-green deployment infrastructure

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
SYSTEMD_DIR="/etc/systemd/system"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root for system configuration"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    info "Checking system requirements..."
    
    local required_packages=("nginx" "nodejs" "npm" "git" "curl" "jq")
    local missing_packages=()
    
    for package in "${required_packages[@]}"; do
        if ! command -v "$package" &> /dev/null; then
            missing_packages+=("$package")
        fi
    done
    
    if [ ${#missing_packages[@]} -ne 0 ]; then
        error "Missing required packages: ${missing_packages[*]}"
        info "Please install missing packages and run again"
        exit 1
    fi
    
    success "All required packages are installed"
}

# Install PM2 globally
install_pm2() {
    info "Installing PM2 process manager..."
    
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
        success "PM2 installed successfully"
    else
        info "PM2 is already installed"
    fi
    
    # Setup PM2 startup script
    pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER
    success "PM2 startup script configured"
}

# Create system user
create_user() {
    local username="theeeecopy"
    
    if ! id "$username" &>/dev/null; then
        info "Creating system user: $username"
        useradd -r -m -s /bin/bash "$username"
        success "User $username created"
    else
        info "User $username already exists"
    fi
    
    # Add user to nginx group
    usermod -a -G www-data "$username"
}

# Create directory structure
create_directories() {
    info "Creating directory structure..."
    
    local dirs=(
        "/opt/theeeecopy"
        "/opt/theeeecopy/logs"
        "/opt/theeeecopy/backups"
        "/opt/theeeecopy/scripts"
        "/opt/theeeecopy/nginx"
        "/var/log/theeeecopy"
        "/var/www/theeeecopy"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
        chown theeeecopy:www-data "$dir"
        chmod 755 "$dir"
    done
    
    success "Directory structure created"
}

# Setup Nginx configuration
setup_nginx() {
    info "Setting up Nginx configuration..."
    
    # Copy nginx configuration
    cp "${PROJECT_ROOT}/.nginx/blue-green.conf" "${NGINX_AVAILABLE}/theeeecopy"
    
    # Enable the site
    ln -sf "${NGINX_AVAILABLE}/theeeecopy" "${NGINX_ENABLED}/theeeecopy"
    
    # Test nginx configuration
    if nginx -t; then
        success "Nginx configuration is valid"
    else
        error "Nginx configuration test failed"
        exit 1
    fi
    
    # Create log rotation configuration
    cat > /etc/logrotate.d/theeeecopy << EOF
/var/log/theeeecopy/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 theeeecopy www-data
    postrotate
        systemctl reload nginx
    endscript
}
EOF
    
    success "Nginx configuration completed"
}

# Setup systemd services
setup_systemd_services() {
    info "Setting up systemd services..."
    
    # Blue environment service
    cat > "${SYSTEMD_DIR}/theeeecopy-blue.service" << EOF
[Unit]
Description=Theeeecopy Blue Environment
After=network.target
Wants=network.target

[Service]
Type=forking
User=theeeecopy
Group=www-data
WorkingDirectory=/opt/theeeecopy
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=ENVIRONMENT=blue
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env blue --only blue
ExecReload=/usr/bin/pm2 reload ecosystem.config.js --env blue --only blue
ExecStop=/usr/bin/pm2 stop ecosystem.config.js --env blue --only blue
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Green environment service
    cat > "${SYSTEMD_DIR}/theeeecopy-green.service" << EOF
[Unit]
Description=Theeeecopy Green Environment
After=network.target
Wants=network.target

[Service]
Type=forking
User=theeeecopy
Group=www-data
WorkingDirectory=/opt/theeeecopy
Environment=NODE_ENV=production
Environment=PORT=3002
Environment=ENVIRONMENT=green
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env green --only green
ExecReload=/usr/bin/pm2 reload ecosystem.config.js --env green --only green
ExecStop=/usr/bin/pm2 stop ecosystem.config.js --env green --only green
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd
    systemctl daemon-reload
    
    success "Systemd services created"
}

# Create PM2 ecosystem configuration
create_pm2_config() {
    info "Creating PM2 ecosystem configuration..."
    
    cat > "${PROJECT_ROOT}/ecosystem.config.js" << EOF
module.exports = {
  apps: [
    {
      name: 'blue',
      script: 'backend/dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        ENVIRONMENT: 'blue'
      },
      env_blue: {
        NODE_ENV: 'production',
        PORT: 3001,
        ENVIRONMENT: 'blue',
        ENV_FILE: '.env.blue'
      },
      error_file: '/var/log/theeeecopy/blue-error.log',
      out_file: '/var/log/theeeecopy/blue-out.log',
      log_file: '/var/log/theeeecopy/blue-combined.log',
      time: true
    },
    {
      name: 'green',
      script: 'backend/dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        ENVIRONMENT: 'green'
      },
      env_green: {
        NODE_ENV: 'production',
        PORT: 3002,
        ENVIRONMENT: 'green',
        ENV_FILE: '.env.green'
      },
      error_file: '/var/log/theeeecopy/green-error.log',
      out_file: '/var/log/theeeecopy/green-out.log',
      log_file: '/var/log/theeeecopy/green-combined.log',
      time: true
    }
  ]
};
EOF
    
    success "PM2 ecosystem configuration created"
}

# Setup firewall
setup_firewall() {
    info "Setting up firewall rules..."
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow internal communication (for health checks)
    ufw allow from 127.0.0.1 to 127.0.0.1 port 3001
    ufw allow from 127.0.0.1 to 127.0.0.1 port 3002
    
    # Enable firewall
    ufw --force enable
    
    success "Firewall configured"
}

# Create deployment configuration
create_deployment_config() {
    info "Creating deployment configuration..."
    
    cat > "${PROJECT_ROOT}/deployment.config" << EOF
# Blue-Green Deployment Configuration
BLUE_PORT=3001
GREEN_PORT=3002
NGINX_CONFIG=/etc/nginx/sites-available/theeeecopy
NGINX_ENABLED_CONFIG=/etc/nginx/sites-enabled/theeeecopy
HEALTH_CHECK_TIMEOUT=60
SMOKE_TEST_TIMEOUT=120
ROLLBACK_ON_FAILURE=true

# Database Configuration
BLUE_DATABASE_URL=postgresql://username:password@localhost:5432/theeeecopy_blue
GREEN_DATABASE_URL=postgresql://username:password@localhost:5432/theeeecopy_green

# Redis Configuration
BLUE_REDIS_URL=redis://localhost:6379/0
GREEN_REDIS_URL=redis://localhost:6379/1

# SSL Configuration (if applicable)
SSL_ENABLED=false
SSL_CERT_PATH=/etc/ssl/certs/theeeecopy.crt
SSL_KEY_PATH=/etc/ssl/private/theeeecopy.key

# Monitoring
SENTRY_DSN=your-sentry-dsn
METRICS_ENABLED=true
LOG_LEVEL=info
EOF
    
    success "Deployment configuration created"
}

# Create health check script
create_health_check_script() {
    info "Creating health check script..."
    
    cat > "${PROJECT_ROOT}/scripts/health-check.sh" << 'EOF'
#!/bin/bash

# Health Check Script for Blue-Green Deployment

BLUE_PORT=3001
GREEN_PORT=3002

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check_health() {
    local port=$1
    local name=$2
    
    if curl -f -s "http://localhost:${port}/health" > /dev/null; then
        echo -e "${GREEN}✅ $name health check passed${NC}"
        return 0
    else
        echo -e "${RED}❌ $name health check failed${NC}"
        return 1
    fi
}

check_readiness() {
    local port=$1
    local name=$2
    
    local response=$(curl -f -s "http://localhost:${port}/health/ready" 2>/dev/null || echo '{"status":"not_ready"}')
    local status=$(echo "$response" | jq -r '.status' 2>/dev/null || echo "not_ready")
    
    if [ "$status" = "ready" ]; then
        echo -e "${GREEN}✅ $name readiness check passed${NC}"
        return 0
    else
        echo -e "${RED}❌ $name readiness check failed${NC}"
        return 1
    fi
}

echo "=== Health Check Report ==="
echo "Timestamp: $(date)"
echo ""

echo "Blue Environment (Port $BLUE_PORT):"
check_health $BLUE_PORT "Blue"
check_readiness $BLUE_PORT "Blue"
echo ""

echo "Green Environment (Port $GREEN_PORT):"
check_health $GREEN_PORT "Green"
check_readiness $GREEN_PORT "Green"
echo ""

echo "=== Nginx Status ==="
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${RED}❌ Nginx is not running${NC}"
fi
EOF
    
    chmod +x "${PROJECT_ROOT}/scripts/health-check.sh"
    success "Health check script created"
}

# Create monitoring script
create_monitoring_script() {
    info "Creating monitoring script..."
    
    cat > "${PROJECT_ROOT}/scripts/monitor.sh" << 'EOF'
#!/bin/bash

# Monitoring Script for Blue-Green Deployment

# Configuration
ALERT_EMAIL="admin@your-domain.com"
LOG_FILE="/var/log/theeeecopy/monitor.log"

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Function to send alert
send_alert() {
    local subject="$1"
    local message="$2"
    
    # Send email alert (requires mailutils)
    echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
    
    # Log the alert
    log_message "ALERT: $subject - $message"
}

# Check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    
    if ! curl -f -s "http://localhost:${port}/health" > /dev/null; then
        send_alert "Service Down" "The $service_name service on port $port is not responding to health checks."
        return 1
    fi
    
    return 0
}

# Check Nginx
check_nginx() {
    if ! systemctl is-active --quiet nginx; then
        send_alert "Nginx Down" "Nginx service is not running."
        return 1
    fi
    
    return 0
}

# Check disk space
check_disk_space() {
    local threshold=90
    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$usage" -gt "$threshold" ]; then
        send_alert "Disk Space Warning" "Disk usage is at ${usage}%, which exceeds the threshold of ${threshold}%."
        return 1
    fi
    
    return 0
}

# Check memory usage
check_memory() {
    local threshold=90
    local usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    
    if [ "$usage" -gt "$threshold" ]; then
        send_alert "Memory Warning" "Memory usage is at ${usage}%, which exceeds the threshold of ${threshold}%."
        return 1
    fi
    
    return 0
}

# Main monitoring function
main() {
    log_message "Starting monitoring check"
    
    local errors=0
    
    # Check services
    check_service "Blue" 3001 || errors=$((errors + 1))
    check_service "Green" 3002 || errors=$((errors + 1))
    check_nginx || errors=$((errors + 1))
    
    # Check system resources
    check_disk_space || errors=$((errors + 1))
    check_memory || errors=$((errors + 1))
    
    if [ $errors -eq 0 ]; then
        log_message "All checks passed"
    else
        log_message "Monitoring check completed with $errors errors"
    fi
}

# Run the monitoring check
main
EOF
    
    chmod +x "${PROJECT_ROOT}/scripts/monitor.sh"
    success "Monitoring script created"
}

# Setup cron jobs
setup_cron() {
    info "Setting up cron jobs..."
    
    # Add cron job for health checks
    (crontab -l 2>/dev/null; echo "*/5 * * * * ${PROJECT_ROOT}/scripts/health-check.sh >> /var/log/theeeecopy/cron.log 2>&1") | crontab -
    
    # Add cron job for monitoring
    (crontab -l 2>/dev/null; echo "*/10 * * * * ${PROJECT_ROOT}/scripts/monitor.sh >> /var/log/theeeecopy/cron.log 2>&1") | crontab -
    
    success "Cron jobs configured"
}

# Main setup function
main() {
    info "Starting Blue-Green Deployment Setup"
    
    check_root
    check_requirements
    create_user
    create_directories
    install_pm2
    setup_nginx
    setup_systemd_services
    create_pm2_config
    setup_firewall
    create_deployment_config
    create_health_check_script
    create_monitoring_script
    setup_cron
    
    success "Blue-Green Deployment setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Configure your environment variables in .env.blue and .env.green"
    echo "2. Start the services: systemctl start theeeecopy-blue theeeecopy-green"
    echo "3. Enable services on boot: systemctl enable theeeecopy-blue theeeecopy-green"
    echo "4. Test the deployment: ${PROJECT_ROOT}/scripts/health-check.sh"
    echo "5. Run initial deployment: ${PROJECT_ROOT}/scripts/deploy/blue-green-deploy.sh deploy"
    echo ""
    echo "For monitoring, check:"
    echo "- Health status: ${PROJECT_ROOT}/scripts/health-check.sh"
    echo "- Logs: tail -f /var/log/theeeecopy/*.log"
    echo "- Nginx logs: tail -f /var/log/nginx/theeeecopy_*.log"
}

# Run main function
main "$@"