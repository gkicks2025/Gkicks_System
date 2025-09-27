#!/bin/bash

# GKicks Complete VPS Deployment Script
# Domain: g-kicks.shop
# VPS: 72.60.198.110

set -e

# Configuration
DOMAIN="g-kicks.shop"
APP_NAME="gkicks"
APP_DIR="/var/www/gkicks"
DB_NAME="gkicks"
DB_USER="gkicks_user"
DB_PASS="GKicks2024!SecurePass"
MYSQL_ROOT_PASS="root123"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        exit 1
    fi
}

# Update system packages
update_system() {
    print_status "Updating system packages..."
    apt update && apt upgrade -y
    apt install -y curl wget git unzip software-properties-common
    print_success "System updated successfully"
}

# Install Node.js 18
install_nodejs() {
    print_status "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Install PM2 globally
    npm install -g pm2
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    print_success "Node.js $node_version and npm $npm_version installed"
    print_success "PM2 installed globally"
}

# Install and configure MySQL
install_mysql() {
    print_status "Installing MySQL Server..."
    
    # Update package list
    apt update
    
    # Set MySQL root password during installation
    export DEBIAN_FRONTEND=noninteractive
    debconf-set-selections <<< "mysql-server mysql-server/root_password password $MYSQL_ROOT_PASS"
    debconf-set-selections <<< "mysql-server mysql-server/root_password_again password $MYSQL_ROOT_PASS"
    
    apt install -y mysql-server
    
    # Start and enable MySQL
    systemctl start mysql
    systemctl enable mysql
    
    # Wait for MySQL to be ready
    sleep 5
    
    # Alternative method to set root password if debconf didn't work
    if ! mysql -u root -p$MYSQL_ROOT_PASS -e "SELECT 1;" > /dev/null 2>&1; then
        print_status "Setting MySQL root password manually..."
        
        # Try to connect without password first (fresh installation)
        mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASS';" > /dev/null 2>&1 || {
            # If that fails, try using mysql_secure_installation approach
            mysql -u root << EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASS';
FLUSH PRIVILEGES;
EOF
        }
    fi
    
    # Test the connection
    if mysql -u root -p$MYSQL_ROOT_PASS -e "SELECT 1;" > /dev/null 2>&1; then
        print_success "MySQL root password set successfully"
    else
        print_error "Failed to set MySQL root password"
        return 1
    fi
    
    # Secure MySQL installation
    mysql -u root -p$MYSQL_ROOT_PASS -e "DELETE FROM mysql.user WHERE User='';"
    mysql -u root -p$MYSQL_ROOT_PASS -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
    mysql -u root -p$MYSQL_ROOT_PASS -e "DROP DATABASE IF EXISTS test;"
    mysql -u root -p$MYSQL_ROOT_PASS -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
    mysql -u root -p$MYSQL_ROOT_PASS -e "FLUSH PRIVILEGES;"
    
    print_success "MySQL installed and secured"
}

# Setup database
setup_database() {
    print_status "Setting up GKicks database..."
    
    # Create database and user
    mysql -u root -p$MYSQL_ROOT_PASS << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    # Test the new user connection
    mysql -u $DB_USER -p$DB_PASS -e "SELECT 1;" $DB_NAME > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "Database user $DB_USER created and tested successfully"
    else
        print_error "Failed to create or test database user"
        return 1
    fi
    
    print_success "Database and user setup completed"
}

# Install and configure Nginx
install_nginx() {
    print_status "Installing Nginx..."
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    
    # Create log directories
    mkdir -p /var/log/nginx
    mkdir -p /var/log/gkicks
    
    print_success "Nginx installed and started"
}

# Setup application directory
setup_app_directory() {
    print_status "Setting up application directory..."
    
    # Create directories
    mkdir -p $APP_DIR
    mkdir -p $APP_DIR/public/uploads
    mkdir -p /var/log/gkicks
    mkdir -p /var/backups/gkicks
    
    # Copy files from deployment directory
    if [ -d "/tmp/gkicks-deployment" ]; then
        print_status "Copying application files..."
        cp -r /tmp/gkicks-deployment/* $APP_DIR/
        
        # Set proper permissions
        chown -R www-data:www-data $APP_DIR
        chmod -R 755 $APP_DIR
        chmod -R 777 $APP_DIR/public/uploads
    else
        print_warning "No deployment files found in /tmp/gkicks-deployment"
        print_warning "Please ensure files are uploaded to the server"
    fi
    
    print_success "Application directory setup completed"
}

# Install application dependencies
install_dependencies() {
    print_status "Installing application dependencies..."
    
    cd $APP_DIR
    
    # Install production dependencies with legacy peer deps to resolve conflicts
    npm install --production --legacy-peer-deps
    
    print_success "Dependencies installed successfully"
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    cd $APP_DIR
    
    # Generate secure secrets
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Create production environment file
    cat > .env.production << EOF
# Database Configuration
MYSQL_HOST=localhost
MYSQL_USER=$DB_USER
MYSQL_PASSWORD=$DB_PASS
MYSQL_DATABASE=$DB_NAME
MYSQL_PORT=3306

# Application Configuration
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
PORT=3000

# Email Configuration (Update with your SMTP settings)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Google OAuth (Update with your credentials)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# File Upload Configuration
UPLOAD_DIR=$APP_DIR/public/uploads
MAX_FILE_SIZE=10485760

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=86400000

# Admin Configuration
ADMIN_EMAIL=admin@$DOMAIN
ADMIN_PASSWORD=Admin123!Change

# POS Configuration
POS_ENABLED=true
POS_PORT=3001
EOF
    
    # Set proper permissions
    chmod 600 .env.production
    chown www-data:www-data .env.production
    
    print_success "Environment variables configured"
    print_warning "Please update SMTP and OAuth credentials in .env.production"
}

# Initialize database schema
initialize_database() {
    print_status "Initializing database schema..."
    
    cd $APP_DIR
    
    # Wait for MySQL to be fully ready
    print_status "Waiting for MySQL to be ready..."
    sleep 5
    
    # Test MySQL connection first
    mysql -u $DB_USER -p$DB_PASS -e "SELECT 1;" $DB_NAME > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        print_error "Cannot connect to MySQL database. Checking service status..."
        systemctl status mysql
        return 1
    fi
    
    # Run database setup scripts if they exist
    if [ -f "setup-main-database.js" ]; then
        print_status "Running main database setup..."
        DB_HOST=127.0.0.1 DB_USER=$DB_USER DB_PASS=$DB_PASS DB_NAME=$DB_NAME node setup-main-database.js
    fi
    
    if [ -f "execute-mysql-schema.js" ]; then
        print_status "Executing MySQL schema..."
        DB_HOST=127.0.0.1 DB_USER=$DB_USER DB_PASS=$DB_PASS DB_NAME=$DB_NAME node execute-mysql-schema.js
    fi
    
    # Import SQL files if they exist
    if [ -f "database/mysql-setup.sql" ]; then
        print_status "Importing MySQL schema..."
        mysql -u $DB_USER -p$DB_PASS $DB_NAME < database/mysql-setup.sql
    fi
    
    if [ -f "gkicks.sql" ]; then
        print_status "Importing GKicks SQL data..."
        mysql -u $DB_USER -p$DB_PASS $DB_NAME < gkicks.sql
    fi
    
    print_success "Database schema initialized"
}

# Build application
build_application() {
    print_status "Building Next.js application..."
    
    cd $APP_DIR
    
    # Build the application
    npm run build
    
    print_success "Application built successfully"
}

# Configure Nginx
configure_nginx() {
    print_status "Configuring Nginx..."
    
    # Create Nginx configuration for direct deployment
    cat > /etc/nginx/sites-available/gkicks << 'EOF'
# GKicks Application Configuration

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name g-kicks.shop www.g-kicks.shop;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all HTTP traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name g-kicks.shop www.g-kicks.shop;
    
    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Client upload limit
    client_max_body_size 10M;
    
    # Proxy settings
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 86400;
    
    # Main application
    location / {
        proxy_pass http://localhost:3000;
    }
    
    # API routes with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
    }
    
    # Static files caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Public files
    location /public/ {
        alias /var/www/gkicks/public/;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
        try_files $uri $uri/ =404;
    }
    
    # Uploaded files
    location /uploads/ {
        alias /var/www/gkicks/public/uploads/;
        expires 7d;
        add_header Cache-Control "public";
        access_log off;
        
        # Security: prevent execution of uploaded files
        location ~* \.(php|pl|py|jsp|asp|sh|cgi)$ {
            deny all;
        }
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
    
    # Block access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
EOF
    
    # Add rate limiting to main nginx config
    if ! grep -q "limit_req_zone" /etc/nginx/nginx.conf; then
        sed -i '/http {/a\\tlimit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;' /etc/nginx/nginx.conf
    fi
    
    # Enable site
    ln -sf /etc/nginx/sites-available/gkicks /etc/nginx/sites-enabled/
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    nginx -t
    systemctl reload nginx
    
    print_success "Nginx configured successfully"
}

# Setup PM2 ecosystem
setup_pm2() {
    print_status "Setting up PM2 configuration..."
    
    cd $APP_DIR
    
    # Create PM2 ecosystem config
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'gkicks-app',
      script: 'npm',
      args: 'start',
      cwd: '$APP_DIR',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      log_file: '/var/log/gkicks/combined.log',
      out_file: '/var/log/gkicks/out.log',
      error_file: '/var/log/gkicks/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      min_uptime: '10s',
      max_restarts: 10,
      env_file: '.env.production',
    }
  ]
};
EOF
    
    print_success "PM2 ecosystem configured"
}

# Start application
start_application() {
    print_status "Starting GKicks application..."
    
    cd $APP_DIR
    
    # Start with PM2
    pm2 start ecosystem.config.js --env production
    pm2 startup
    pm2 save
    
    print_success "Application started with PM2"
}

# Setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    # Install Certbot
    apt install -y certbot python3-certbot-nginx
    
    # Create certbot directory
    mkdir -p /var/www/certbot
    
    # Check if domain resolves to this server
    if ping -c 1 $DOMAIN > /dev/null 2>&1; then
        print_status "Domain resolves, attempting SSL certificate generation..."
        
        # Get SSL certificate
        certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        
        print_success "SSL certificates installed successfully"
    else
        print_warning "Domain $DOMAIN does not resolve to this server yet"
        print_warning "Please configure DNS first, then run:"
        print_warning "certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    fi
}

# Configure firewall
configure_firewall() {
    print_status "Configuring UFW firewall..."
    
    # Install UFW if not present
    apt install -y ufw
    
    # Configure firewall rules
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw allow 3000
    ufw --force enable
    
    print_success "Firewall configured and enabled"
}

# Setup monitoring and maintenance
setup_monitoring() {
    print_status "Setting up monitoring and maintenance..."
    
    # Create backup script
    cat > /usr/local/bin/backup-gkicks.sh << EOF
#!/bin/bash
BACKUP_DIR="/var/backups/gkicks"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > \$BACKUP_DIR/gkicks_\$DATE.sql

# Backup uploads
tar -czf \$BACKUP_DIR/uploads_\$DATE.tar.gz -C $APP_DIR/public uploads

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "gkicks_*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "Backup completed: \$DATE"
EOF
    
    chmod +x /usr/local/bin/backup-gkicks.sh
    
    # Add to crontab for daily backups at 2 AM
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-gkicks.sh") | crontab -
    
    print_success "Backup system configured"
}

# Main deployment function
main() {
    echo "============================================="
    echo "   GKicks Complete VPS Deployment"
    echo "============================================="
    echo "Domain: $DOMAIN"
    echo "VPS: 72.60.198.110"
    echo "App Directory: $APP_DIR"
    echo "============================================="
    echo ""
    
    # Check if running as root
    check_root
    
    # Run all deployment steps
    print_status "Starting complete deployment process..."
    
    update_system
    install_nodejs
    install_mysql
    setup_database
    install_nginx
    setup_app_directory
    install_dependencies
    setup_environment
    initialize_database
    build_application
    configure_nginx
    setup_pm2
    start_application
    configure_firewall
    setup_monitoring
    setup_ssl
    
    echo ""
    print_success "============================================="
    print_success "   GKicks Deployment Completed!"
    print_success "============================================="
    echo ""
    echo "🎉 Your GKicks e-commerce application is now deployed!"
    echo ""
    echo "📋 Deployment Summary:"
    echo "• Domain: https://$DOMAIN"
    echo "• Admin Panel: https://$DOMAIN/admin"
    echo "• Application Directory: $APP_DIR"
    echo "• Database: $DB_NAME"
    echo "• SSL: $([ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ] && echo "✅ Configured" || echo "⚠️  Pending DNS")"
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Configure DNS: Point $DOMAIN to 72.60.198.110"
    echo "2. Wait for DNS propagation (5-30 minutes)"
    echo "3. Update SMTP settings in $APP_DIR/.env.production"
    echo "4. Configure Google OAuth credentials"
    echo "5. Create admin user via /admin/setup"
    echo ""
    echo "📊 Useful Commands:"
    echo "• Check app status: pm2 status"
    echo "• View app logs: pm2 logs gkicks-app"
    echo "• Restart app: pm2 restart gkicks-app"
    echo "• Check Nginx: systemctl status nginx"
    echo "• View Nginx logs: tail -f /var/log/nginx/error.log"
    echo "• Manual backup: /usr/local/bin/backup-gkicks.sh"
    echo ""
    echo "🔒 Security Notes:"
    echo "• Change default admin password after first login"
    echo "• Update database passwords in production"
    echo "• Configure proper SMTP credentials"
    echo "• Review firewall rules: ufw status"
    echo ""
    print_success "Deployment completed successfully! 🚀"
}

# Run main function
main "$@"