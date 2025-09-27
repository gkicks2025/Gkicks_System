# Automated VPS Deployment Script for GKicks
param(
    [string]$VPS_IP = "72.60.198.110",
    [string]$DOMAIN = "g-kicks.shop",
    [Parameter(Mandatory=$true)]
    [string]$USERNAME
)

Write-Host ""
Write-Host "=========================================" -ForegroundColor Magenta
Write-Host "   GKICKS AUTOMATED VPS DEPLOYMENT" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Domain: $DOMAIN" -ForegroundColor Cyan
Write-Host "VPS IP: $VPS_IP" -ForegroundColor Cyan
Write-Host "Username: $USERNAME" -ForegroundColor Cyan
Write-Host ""

# Test VPS connection
Write-Host "Testing connection to VPS..." -ForegroundColor Yellow
try {
    $result = Test-NetConnection -ComputerName $VPS_IP -Port 22 -WarningAction SilentlyContinue
    if ($result.TcpTestSucceeded) {
        Write-Host "VPS is reachable on port 22 (SSH)" -ForegroundColor Green
    } else {
        Write-Host "Cannot reach VPS on port 22" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Connection test failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting deployment process..." -ForegroundColor Green
Write-Host "You will be prompted for your VPS password during SSH connections." -ForegroundColor Yellow
Write-Host ""

# Create deployment directory on VPS
Write-Host "Creating deployment directory on VPS..." -ForegroundColor Cyan
ssh "$USERNAME@$VPS_IP" "mkdir -p /tmp/gkicks-deployment"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create deployment directory" -ForegroundColor Red
    exit 1
}

# Upload deployment script
Write-Host "Uploading deployment script..." -ForegroundColor Cyan
scp ".\deploy-gkicks-complete.sh" "${USERNAME}@${VPS_IP}:/tmp/gkicks-deployment/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to upload deployment script" -ForegroundColor Red
    exit 1
}

# Make script executable
Write-Host "Making script executable..." -ForegroundColor Cyan
ssh "$USERNAME@$VPS_IP" "chmod +x /tmp/gkicks-deployment/deploy-gkicks-complete.sh"

# Execute deployment
Write-Host "Executing deployment on VPS..." -ForegroundColor Yellow
Write-Host "This will install and configure GKicks system with domain: $DOMAIN" -ForegroundColor Cyan
Write-Host ""

ssh "$USERNAME@$VPS_IP" "cd /tmp/gkicks-deployment; DOMAIN=$DOMAIN ./deploy-gkicks-complete.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "   DEPLOYMENT SUMMARY" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "GKicks system has been deployed to your VPS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Server Details:" -ForegroundColor Yellow
    Write-Host "VPS IP: $VPS_IP" -ForegroundColor White
    Write-Host "Domain: $DOMAIN" -ForegroundColor White
    Write-Host "SSH Access: ssh $USERNAME@$VPS_IP" -ForegroundColor White
    Write-Host ""
    Write-Host "Application URLs (after DNS + SSL setup):" -ForegroundColor Yellow
    Write-Host "Main Site: https://$DOMAIN" -ForegroundColor White
    Write-Host "Admin Panel: https://$DOMAIN/admin" -ForegroundColor White
    Write-Host "API Endpoint: https://$DOMAIN/api" -ForegroundColor White
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Blue
    Write-Host "   DNS CONFIGURATION REQUIRED" -ForegroundColor Blue
    Write-Host "=========================================" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Add these DNS records to your domain:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Type: A" -ForegroundColor Green
    Write-Host "Name: @ (root domain)" -ForegroundColor Green
    Write-Host "Value: $VPS_IP" -ForegroundColor Green
    Write-Host ""
    Write-Host "Type: A" -ForegroundColor Green
    Write-Host "Name: www" -ForegroundColor Green
    Write-Host "Value: $VPS_IP" -ForegroundColor Green
    Write-Host ""
    Write-Host "Wait 5-30 minutes for DNS propagation." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Blue
    Write-Host "   SSL CERTIFICATE SETUP" -ForegroundColor Blue
    Write-Host "=========================================" -ForegroundColor Blue
    Write-Host ""
    Write-Host "After DNS propagation, set up SSL:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Connect to VPS:" -ForegroundColor Cyan
    Write-Host "   ssh $USERNAME@$VPS_IP" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Install SSL certificate:" -ForegroundColor Cyan
    Write-Host "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN" -ForegroundColor White
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
    Write-Host "Follow the DNS and SSL setup instructions above." -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Deployment completed with issues." -ForegroundColor Yellow
    Write-Host "Check the output above for errors." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can try running manually:" -ForegroundColor Yellow
    Write-Host "ssh $USERNAME@$VPS_IP" -ForegroundColor Cyan
    Write-Host "cd /tmp/gkicks-deployment" -ForegroundColor Cyan
    Write-Host "deploy-gkicks-complete.sh" -ForegroundColor Cyan
}