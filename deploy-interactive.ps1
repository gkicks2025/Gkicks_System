# GKicks Interactive VPS Deployment Script
# This script allows you to manually enter passwords and configure your domain

# Configuration
$VPS_IP = "72.60.198.110"
$DOMAIN = "g-kicks.shop"
$APP_NAME = "gkicks"
$APP_DIR = "/var/www/gkicks"
$USER = "root"

# Color functions
function Write-Status { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Test VPS Connection
function Test-VPSConnection {
    Write-Status "Testing connection to VPS at $VPS_IP..."
    
    try {
        $result = Test-NetConnection -ComputerName $VPS_IP -Port 22 -WarningAction SilentlyContinue
        if ($result.TcpTestSucceeded) {
            Write-Success "VPS is reachable via SSH (Port 22)"
            return $true
        } else {
            Write-Error "Cannot reach VPS SSH service at ${VPS_IP}:22"
            return $false
        }
    } catch {
        Write-Error "Connection test failed: $($_.Exception.Message)"
        return $false
    }
}

# Upload files to VPS
function Upload-FilesToVPS {
    Write-Status "Uploading deployment files to VPS..."
    Write-Host "You will be prompted to enter your VPS password for file upload." -ForegroundColor Yellow
    
    try {
        # Create deployment directory on VPS
        Write-Status "Creating deployment directory..."
        ssh $USER@$VPS_IP "mkdir -p /tmp/gkicks-deployment"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to create deployment directory"
            return $false
        }
        
        # Upload all files
        Write-Status "Uploading project files (this may take a few minutes)..."
        scp -r . $USER@${VPS_IP}:/tmp/gkicks-deployment/
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Files uploaded successfully!"
            return $true
        } else {
            Write-Error "File upload failed"
            return $false
        }
    } catch {
        Write-Error "Upload failed: $($_.Exception.Message)"
        return $false
    }
}

# Execute deployment on VPS
function Execute-DeploymentOnVPS {
    Write-Status "Executing deployment script on VPS..."
    Write-Host "You will be prompted to enter passwords during the deployment process." -ForegroundColor Yellow
    
    try {
        # Make deployment script executable and run it
        Write-Status "Running deployment script on VPS..."
        ssh -t $USER@$VPS_IP "cd /tmp/gkicks-deployment && chmod +x deploy-gkicks-complete.sh && ./deploy-gkicks-complete.sh"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Deployment completed successfully!"
            return $true
        } else {
            Write-Warning "Deployment script completed with warnings or errors"
            return $false
        }
    } catch {
        Write-Error "Deployment execution failed: $($_.Exception.Message)"
        return $false
    }
}

# Show DNS configuration instructions
function Show-DNSConfiguration {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Blue
    Write-Host "   DNS CONFIGURATION REQUIRED" -ForegroundColor Blue
    Write-Host "=========================================" -ForegroundColor Blue
    Write-Host ""
    Write-Host "To make your domain work, add these DNS records:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Domain: $DOMAIN" -ForegroundColor Cyan
    Write-Host "┌─────────────────────────────────────────┐" -ForegroundColor White
    Write-Host "│ Record Type │ Name  │ Value           │" -ForegroundColor White
    Write-Host "├─────────────────────────────────────────┤" -ForegroundColor White
    Write-Host "│ A           │ @     │ $VPS_IP    │" -ForegroundColor White
    Write-Host "│ A           │ www   │ $VPS_IP    │" -ForegroundColor White
    Write-Host "│ A           │ admin │ $VPS_IP    │" -ForegroundColor White
    Write-Host "└─────────────────────────────────────────┘" -ForegroundColor White
    Write-Host ""
    Write-Host "Steps to configure DNS:" -ForegroundColor Yellow
    Write-Host "1. Log into your domain registrar's control panel" -ForegroundColor White
    Write-Host "2. Find the DNS management section" -ForegroundColor White
    Write-Host "3. Add the A records shown above" -ForegroundColor White
    Write-Host "4. Wait 5-30 minutes for DNS propagation" -ForegroundColor White
    Write-Host ""
}

# Show SSL setup instructions
function Show-SSLSetup {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Blue
    Write-Host "   SSL CERTIFICATE SETUP" -ForegroundColor Blue
    Write-Host "=========================================" -ForegroundColor Blue
    Write-Host ""
    Write-Host "After DNS propagation, set up SSL certificates:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Connect to your VPS:" -ForegroundColor White
    Write-Host "   ssh `$USER@`$VPS_IP" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Generate SSL certificates:" -ForegroundColor White
    Write-Host "   certbot --nginx -d $DOMAIN -d www.$DOMAIN" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Test automatic renewal:" -ForegroundColor White
    Write-Host "   certbot renew --dry-run" -ForegroundColor Cyan
    Write-Host ""
}

# Show deployment summary
function Show-DeploymentSummary {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "   DEPLOYMENT COMPLETED!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your GKicks e-commerce platform has been deployed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Server Details:" -ForegroundColor Cyan
    Write-Host "• VPS IP: $VPS_IP" -ForegroundColor White
    Write-Host "• Domain: $DOMAIN" -ForegroundColor White
    Write-Host "• Application Directory: $APP_DIR" -ForegroundColor White
    Write-Host ""
    Write-Host "Your URLs (after DNS configuration):" -ForegroundColor Cyan
    Write-Host "• Main Website: https://$DOMAIN" -ForegroundColor White
    Write-Host "• Admin Panel: https://$DOMAIN/admin" -ForegroundColor White
    Write-Host "• API Endpoints: https://$DOMAIN/api" -ForegroundColor White
    Write-Host "• Health Check: https://$DOMAIN/health" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Configure DNS records (see instructions above)" -ForegroundColor White
    Write-Host "2. Wait for DNS propagation (5-30 minutes)" -ForegroundColor White
    Write-Host "3. Set up SSL certificates" -ForegroundColor White
    Write-Host "4. Test your website" -ForegroundColor White
    Write-Host "5. Create your admin account at https://$DOMAIN/admin/setup" -ForegroundColor White
    Write-Host ""
}

# Show monitoring commands
function Show-MonitoringCommands {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Blue
    Write-Host "   MONITORING & MANAGEMENT" -ForegroundColor Blue
    Write-Host "=========================================" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Useful commands to manage your deployment:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Check application status:" -ForegroundColor Cyan
    Write-Host "ssh `$USER@`$VPS_IP 'pm2 status'" -ForegroundColor White
    Write-Host ""
    Write-Host "View application logs:" -ForegroundColor Cyan
    Write-Host "ssh `$USER@`$VPS_IP 'pm2 logs gkicks-app'" -ForegroundColor White
    Write-Host ""
    Write-Host "Restart application:" -ForegroundColor Cyan
    Write-Host "ssh `$USER@`$VPS_IP 'pm2 restart gkicks-app'" -ForegroundColor White
    Write-Host ""
    Write-Host "Check Nginx status:" -ForegroundColor Cyan
    Write-Host "ssh `$USER@`$VPS_IP 'systemctl status nginx'" -ForegroundColor White
    Write-Host ""
    Write-Host "Check MySQL status:" -ForegroundColor Cyan
    Write-Host "ssh `$USER@`$VPS_IP 'systemctl status mysql'" -ForegroundColor White
    Write-Host ""
}

# Main execution function
function Main {
    Write-Host "=========================================" -ForegroundColor Blue
    Write-Host "   GKicks Interactive VPS Deployment" -ForegroundColor Blue
    Write-Host "=========================================" -ForegroundColor Blue
    Write-Host ""
    Write-Host "VPS IP: $VPS_IP" -ForegroundColor Cyan
    Write-Host "Domain: $DOMAIN" -ForegroundColor Cyan
    Write-Host "User: $USER" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This script will:" -ForegroundColor Yellow
    Write-Host "• Test connection to your VPS" -ForegroundColor White
    Write-Host "• Upload all deployment files" -ForegroundColor White
    Write-Host "• Run the complete deployment script" -ForegroundColor White
    Write-Host "• Configure your domain and SSL" -ForegroundColor White
    Write-Host ""
    
    # Confirm before proceeding
    $confirm = Read-Host "Do you want to proceed with the deployment? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Warning "Deployment cancelled by user."
        return
    }
    
    Write-Host ""
    Write-Status "Starting interactive deployment process..."
    
    # Step 1: Test VPS connection
    if (-not (Test-VPSConnection)) {
        Write-Error "Cannot connect to VPS. Please check your VPS status and network connection."
        return
    }
    
    # Step 2: Upload files
    Write-Host ""
    if (-not (Upload-FilesToVPS)) {
        Write-Error "File upload failed. Please check your SSH access and try again."
        return
    }
    
    # Step 3: Execute deployment
    Write-Host ""
    Write-Status "Now executing the deployment script on your VPS..."
    Write-Host "You may be prompted for passwords during MySQL setup and other configurations." -ForegroundColor Yellow
    Write-Host ""
    
    $deployResult = Execute-DeploymentOnVPS
    
    # Step 4: Show results and next steps
    Write-Host ""
    if ($deployResult) {
        Show-DeploymentSummary
        Show-DNSConfiguration
        Show-SSLSetup
        Show-MonitoringCommands
        
        Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
        Write-Host "Your GKicks platform is now running on your VPS!" -ForegroundColor Green
    } else {
        Write-Warning "Deployment completed with some issues."
        Write-Host "Please check the output above for any errors." -ForegroundColor Yellow
        Write-Host "You can try running the deployment script manually on your VPS:" -ForegroundColor Yellow
        Write-Host "ssh `$USER@`$VPS_IP" -ForegroundColor Cyan
        Write-Host "cd /tmp/gkicks-deployment" -ForegroundColor Cyan
        Write-Host "./deploy-gkicks-complete.sh" -ForegroundColor Cyan
    }
}

# Run the main function
Main