# GKicks VPS Deployment Instructions

## 🚀 Quick Deployment Guide

### Prerequisites
- VPS: `72.60.198.110` (root access)
- Domain: `g-kicks.shop`
- SSH client (PuTTY, Terminal, or WSL)

### Step 1: Connect to Your VPS
```bash
ssh root@72.60.198.110
```

### Step 2: Upload and Run Deployment Script

#### Option A: Automated PowerShell Deployment (Windows)
```powershell
# Run from your project directory
.\deploy-to-vps.ps1
```

#### Option B: Manual Deployment
1. **Upload files to VPS:**
   ```bash
   # From your local machine
   scp -r . root@72.60.198.110:/tmp/gkicks-deployment/
   ```

2. **Connect to VPS and run deployment:**
   ```bash
   ssh root@72.60.198.110
   cd /tmp/gkicks-deployment
   chmod +x deploy-gkicks-complete.sh
   ./deploy-gkicks-complete.sh
   ```

### Step 3: Configure DNS Settings
Point your domain to your VPS IP:

**DNS Records for g-kicks.shop:**
- `A` record: `@` → `72.60.198.110`
- `A` record: `www` → `72.60.198.110`
- `A` record: `admin` → `72.60.198.110` (optional)

### Step 4: Wait for DNS Propagation
- Usually takes 5-30 minutes
- Check with: `nslookup g-kicks.shop`

### Step 5: Complete SSL Setup (if needed)
If SSL wasn't set up automatically:
```bash
ssh root@72.60.198.110
certbot --nginx -d g-kicks.shop -d www.g-kicks.shop
```

## 🔧 Post-Deployment Configuration

### 1. Update Environment Variables
```bash
ssh root@72.60.198.110
nano /var/www/gkicks/.env.production
```

**Update these settings:**
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Admin Configuration
ADMIN_EMAIL=admin@g-kicks.shop
ADMIN_PASSWORD=YourSecurePassword123!
```

### 2. Restart Application
```bash
pm2 restart gkicks-app
```

### 3. Create Admin User
Visit: `https://g-kicks.shop/admin/setup`

## 📊 Monitoring & Management

### Check Application Status
```bash
pm2 status
pm2 logs gkicks-app
```

### Check Nginx Status
```bash
systemctl status nginx
tail -f /var/log/nginx/error.log
```

### Check Database
```bash
mysql -u gkicks_user -p gkicks
```

### Manual Backup
```bash
/usr/local/bin/backup-gkicks.sh
```

## 🔒 Security Checklist

- [ ] Change default database passwords
- [ ] Update admin password after first login
- [ ] Configure proper SMTP credentials
- [ ] Review firewall rules: `ufw status`
- [ ] Enable automatic security updates
- [ ] Set up monitoring alerts

## 🌐 Application URLs

- **Main Site:** https://g-kicks.shop
- **Admin Panel:** https://g-kicks.shop/admin
- **API Endpoint:** https://g-kicks.shop/api
- **Health Check:** https://g-kicks.shop/health

## 🆘 Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   ```bash
   pm2 restart gkicks-app
   systemctl restart nginx
   ```

2. **Database Connection Error**
   ```bash
   systemctl status mysql
   mysql -u gkicks_user -p gkicks
   ```

3. **SSL Certificate Issues**
   ```bash
   certbot renew --dry-run
   systemctl reload nginx
   ```

4. **Permission Issues**
   ```bash
   chown -R www-data:www-data /var/www/gkicks
   chmod -R 755 /var/www/gkicks
   chmod -R 777 /var/www/gkicks/public/uploads
   ```

### Log Locations
- Application logs: `/var/log/gkicks/`
- Nginx logs: `/var/log/nginx/`
- PM2 logs: `pm2 logs`
- System logs: `journalctl -u nginx`

## 📞 Support Commands

### Update Application
```bash
cd /var/www/gkicks
git pull origin main
npm install
npm run build
pm2 restart gkicks-app
```

### Database Backup
```bash
mysqldump -u gkicks_user -p gkicks > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
mysql -u gkicks_user -p gkicks < backup_file.sql
```

## 🎯 Performance Optimization

### Enable Gzip Compression
Already configured in Nginx

### Database Optimization
```sql
-- Run these queries periodically
OPTIMIZE TABLE products;
OPTIMIZE TABLE orders;
OPTIMIZE TABLE users;
```

### Monitor Resource Usage
```bash
htop
df -h
free -h
```

---

## 📋 Deployment Checklist

- [ ] VPS accessible via SSH
- [ ] Domain DNS configured
- [ ] Deployment script executed successfully
- [ ] SSL certificates installed
- [ ] Environment variables updated
- [ ] Admin user created
- [ ] Email configuration tested
- [ ] Backup system verified
- [ ] Monitoring set up
- [ ] Security measures implemented

**🎉 Your GKicks e-commerce platform is now live at https://g-kicks.shop!**