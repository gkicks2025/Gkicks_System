# Interactive VPS Deployment Script for GKicks System
# This script will prompt for passwords and deploy to g-kicks.shop domain

param(
    [string]$VPS_IP = "72.60.198.110",
    [string]$DOMAIN = "g-kicks.shop"
)

# Global variables
$USER = ""
$DEPLOYMENT_DIR = "/tmp/gkicks-deployment"

# Test VPS connection
function Test-VPSConnection {
    param([string]$ip)
    
    Write-Host "Testing connection to VPS ($ip)..." -ForegroundColor Yellow
    
    try {
        $result = Test-NetConnection -ComputerName $ip -Port 22 -WarningAction SilentlyContinue
        if ($result.TcpTestSucceeded) {
            Write-Host "✓ VPS is reachable on port 22 (SSH)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "✗ Cannot reach VPS on port 22" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "✗ Connection test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Upload deployment files to VPS
function Upload-DeploymentFiles {
    param([string]$vpsIP, [string]$username)
    
    Write-Host "Uploading deployment files to VPS..." -ForegroundColor Yellow
    
    # Create deployment directory on VPS
    Write-Host "Creating deployment directory on VPS..." -ForegroundColor Cyan
    ssh "$username@$vpsIP" "mkdir -p $DEPLOYMENT_DIR"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create deployment directory"
        return $false
    }
    
    # Upload deployment script
    Write-Host "Uploading deployment script..." -ForegroundColor Cyan
    scp "deploy-to-vps.sh" "$username@$vpsIP`:$DEPLOYMENT_DIR/deploy-gkicks-complete.sh"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to upload deployment script"
        return $false
    }
    
    # Make script executable
    ssh "$username@$vpsIP" "chmod +x $DEPLOYMENT_DIR/deploy-gkicks-complete.sh"
    
    Write-Host "✓ Deployment files uploaded successfully" -ForegroundColor Green
    return $true
}

# Execute deployment on VPS
function Invoke-VPSDeployment {
    param([string]$vpsIP, [string]$username, [string]$domain)
    
    Write-Host "Executing deployment on VPS..." -ForegroundColor Yellow
    Write-Host "This will install and configure GKicks system with domain: $domain" -ForegroundColor Cyan
    
    try {
        # Execute deployment script with domain parameter
        ssh "$username@$vpsIP" "cd $DEPLOYMENT_DIR && DOMAIN=$domain ./deploy-gkicks-complete.sh"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Deployment completed successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "✗ Deployment failed with exit code: $LASTEXITCODE" -ForegroundColor Red
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
    Write-Host "VPS IP: $VPS_IP" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "DNS Records to add:" -ForegroundColor White
    Write-Host "Type: A" -ForegroundColor Green
    Write-Host "Name: @" -ForegroundColor Green
    Write-Host "Value: $VPS_IP" -ForegroundColor Green
    Write-Host "TTL: 300 (or default)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Type: A" -ForegroundColor Green
    Write-Host "Name: www" -ForegroundColor Green
    Write-Host "Value: $VPS_IP" -ForegroundColor Green
    Write-Host "TTL: 300 (or default)" -ForegroundColor Green
    Write-Host ""
    Write-Host "After adding DNS records, wait 5-30 minutes for propagation." -ForegroundColor Yellow
    Write-Host ""
}

# Show SSL setup instructions
function Show-SSLInstructions {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Blue
    Write-Host "   SSL CERTIFICATE SETUP" -ForegroundColor Blue
    Write-Host "=========================================" -ForegroundColor Blue
    Write-Host ""
    Write-Host "After DNS propagation, set up SSL certificates:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Connect to your VPS:" -ForegroundColor Cyan
    Write-Host "   ssh $USER@$VPS_IP" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Install SSL certificate:" -ForegroundColor Cyan
    Write-Host "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Follow the prompts to complete SSL setup" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "4. Test automatic renewal:" -ForegroundColor Cyan
    Write-Host "   sudo certbot renew --dry-run" -ForegroundColor White
    Write-Host ""
}

# Show deployment summary
function Show-DeploymentSummary {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "   DEPLOYMENT SUMMARY" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "GKicks system has been deployed to your VPS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Server Details:" -ForegroundColor Yellow
    Write-Host "• VPS IP: $VPS_IP" -ForegroundColor White
    Write-Host "• Domain: $DOMAIN" -ForegroundColor White
    Write-Host "• SSH Access: ssh $USER@$VPS_IP" -ForegroundColor White
    Write-Host ""
    Write-Host "Application URLs (after DNS + SSL setup):" -ForegroundColor Yellow
    Write-Host "• Main Site: https://$DOMAIN" -ForegroundColor White
    Write-Host "• Admin Panel: https://$DOMAIN/admin" -ForegroundColor White
    Write-Host "• API Endpoint: https://$DOMAIN/api" -ForegroundColor White
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
    Write-Host "   MONITORING `& MANAGEMENT" -ForegroundColor Blue
    Write-Host "=========================================" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Useful commands to manage your deployment:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Check application status:" -ForegroundColor Cyan
    Write-Host "ssh $USER@$VPS_IP `"pm2 status`"" -ForegroundColor White
    Write-Host ""
    Write-Host "View application logs:" -ForegroundColor Cyan
    Write-Host "ssh $USER@$VPS_IP `"pm2 logs gkicks`"" -ForegroundColor White
    Write-Host ""
    Write-Host "Restart application:" -ForegroundColor Cyan
    Write-Host "ssh $USER@$VPS_IP `"pm2 restart gkicks`"" -ForegroundColor White
    Write-Host ""
    Write-Host "Check database status:" -ForegroundColor Cyan
    Write-Host "ssh $USER@$VPS_IP `"sudo systemctl status mysql`"" -ForegroundColor White
    Write-Host ""
    Write-Host "Check web server status:" -ForegroundColor Cyan
    Write-Host "ssh $USER@$VPS_IP `"sudo systemctl status nginx`"" -ForegroundColor White
    Write-Host ""
    Write-Host "View web server logs:" -ForegroundColor Cyan
    Write-Host "ssh $USER@$VPS_IP `"sudo tail -f /var/log/nginx/error.log`"" -ForegroundColor White
    Write-Host ""
}

# Main deployment function
function Main {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Magenta
    Write-Host "   GKICKS INTERACTIVE VPS DEPLOYMENT" -ForegroundColor Magenta
    Write-Host "=========================================" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "This script will deploy GKicks to your VPS with interactive authentication." -ForegroundColor White
    Write-Host "Domain: $DOMAIN" -ForegroundColor Cyan
    Write-Host "VPS IP: $VPS_IP" -ForegroundColor Cyan
    Write-Host ""
    
    # Test VPS connection
    if (-not (Test-VPSConnection -ip $VPS_IP)) {
        Write-Error "Cannot connect to VPS. Please check the IP address and network connection."
        return
    }
    
    # Get username
    $script:USER = Read-Host "Enter your VPS username"
    if ([string]::IsNullOrWhiteSpace($USER)) {
        Write-Error "Username is required"
        return
    }
    
    Write-Host ""
    Write-Host "Starting deployment process..." -ForegroundColor Green
    Write-Host "You will be prompted for your VPS password during SSH connections." -ForegroundColor Yellow
    Write-Host ""
    
    # Upload deployment files
    if (-not (Upload-DeploymentFiles -vpsIP $VPS_IP -username $USER)) {
        Write-Error "Failed to upload deployment files"
        return
    }
    
    # Execute deployment
    if (Invoke-VPSDeployment -vpsIP $VPS_IP -username $USER -domain $DOMAIN) {
        Write-Host ""
        Write-Host "🎉 DEPLOYMENT SUCCESSFUL! 🎉" -ForegroundColor Green
        
        Show-DeploymentSummary
        Show-DNSConfiguration
        Show-SSLInstructions
        Show-MonitoringCommands
        
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host "Deployment completed successfully!" -ForegroundColor Green
        Write-Host "Follow the DNS and SSL setup instructions above." -ForegroundColor Green
        Write-Host "=========================================" -ForegroundColor Green
    } else {
        Write-Warning "Deployment completed with some issues."
        Write-Host "Please check the output above for any errors." -ForegroundColor Yellow
        Write-Host "You can try running the deployment script manually on your VPS:" -ForegroundColor Yellow
        Write-Host "ssh $USER@$VPS_IP" -ForegroundColor Cyan
        Write-Host "cd /tmp/gkicks-deployment" -ForegroundColor Cyan
        Write-Host "./deploy-gkicks-complete.sh" -ForegroundColor Cyan
    }
}

# Run the main function
Main