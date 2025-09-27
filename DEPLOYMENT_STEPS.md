# 🚀 GKicks VPS Deployment - Step by Step Guide

## Your VPS Details
- **IP Address:** `72.60.198.110`
- **Domain:** `g-kicks.shop`
- **SSH Access:** `ssh root@72.60.198.110`

## 📋 Deployment Steps

### Step 1: Connect to Your VPS
```bash
ssh root@72.60.198.110
```

### Step 2: Upload Your Project Files

#### Option A: Using SCP (Recommended)
From your local machine (Windows PowerShell or Git Bash):
```bash
# Navigate to your project directory
cd "C:\Users\ASUS STRIX\GKICKS-SHOP-2.0000 (3)\Gkicks_System"

# Upload all files to VPS
scp -r . root@72.60.198.110:/tmp/gkicks-deployment/
```

#### Option B: Using Git (Alternative)
On your VPS:
```bash
cd /tmp
git clone https://github.com/yourusername/gkicks-repo.git gkicks-deployment
# Or upload via FTP/SFTP client like FileZilla
```

### Step 3: Run the Complete Deployment Script
On your VPS:
```bash
cd /tmp/gkicks-deployment
chmod +x deploy-gkicks-complete.sh
./deploy-gkicks-complete.sh
```

### Step 4: Configure DNS Settings
In your domain registrar's control panel, add these DNS records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 72.60.198.110 | 300 |
| A | www | 72.60.198.110 | 300 |
| A | admin | 72.60.198.110 | 300 |

### Step 5: Wait for DNS Propagation (5-30 minutes)
Check DNS propagation:
```bash
nslookup g-kicks.shop
# Should return 72.60.198.110
```

### Step 6: Complete SSL Setup
Once DNS is propagated:
```bash
ssh root@72.60.198.110
certbot --nginx -d g-kicks.shop -d www.g-kicks.shop
```

## 🔧 What the Deployment Script Does

The `deploy-gkicks-complete.sh` script will automatically:

1. ✅ Update system packages
2. ✅ Install Node.js 18 and PM2
3. ✅ Install and configure MySQL
4. ✅ Create database and user
5. ✅ Install and configure Nginx
6. ✅ Set up application directory
7. ✅ Install dependencies
8. ✅ Configure environment variables
9. ✅ Initialize database schema
10. ✅ Build the Next.js application
11. ✅ Configure Nginx with proper settings
12. ✅ Start application with PM2
13. ✅ Configure firewall
14. ✅ Set up automated backups
15. ✅ Install SSL certificates (if DNS is ready)

## 📊 After Deployment

### 1. Check Application Status
```bash
ssh root@72.60.198.110
pm2 status
pm2 logs gkicks-app
```

### 2. Update Environment Variables
```bash
nano /var/www/gkicks/.env.production
```

Update these critical settings:
```env
# Email Configuration (Required for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Google OAuth (Required for social login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Restart Application
```bash
pm2 restart gkicks-app
```

### 4. Create Admin User
Visit: `https://g-kicks.shop/admin/setup`

## 🌐 Your Application URLs

After successful deployment:
- **Main Website:** https://g-kicks.shop
- **Admin Panel:** https://g-kicks.shop/admin
- **API Endpoints:** https://g-kicks.shop/api
- **Health Check:** https://g-kicks.shop/health

## 🔒 Security Configuration

### Database Credentials
- **Database:** `gkicks`
- **Username:** `gkicks_user`
- **Password:** `GKicks2024!SecurePass`
- **MySQL Root:** `root123`

**⚠️ Important:** Change these passwords in production!

### Firewall Status
The script configures UFW firewall with these rules:
- SSH (22) - Allowed
- HTTP (80) - Allowed
- HTTPS (443) - Allowed
- Application (3000) - Allowed

## 🆘 Troubleshooting

### If Deployment Fails
1. Check the error message
2. Ensure you have root access
3. Verify internet connection on VPS
4. Check available disk space: `df -h`
5. Check memory: `free -h`

### Common Issues

**502 Bad Gateway:**
```bash
pm2 restart gkicks-app
systemctl restart nginx
```

**Database Connection Error:**
```bash
systemctl status mysql
mysql -u gkicks_user -p
```

**SSL Certificate Issues:**
```bash
certbot certificates
certbot renew --dry-run
```

## 📞 Support Commands

### View Logs
```bash
# Application logs
pm2 logs gkicks-app

# Nginx logs
tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx
```

### Restart Services
```bash
# Restart application
pm2 restart gkicks-app

# Restart Nginx
systemctl restart nginx

# Restart MySQL
systemctl restart mysql
```

### Manual Backup
```bash
/usr/local/bin/backup-gkicks.sh
```

## 🎯 Performance Monitoring

### Check Resource Usage
```bash
htop          # CPU and memory usage
df -h         # Disk usage
pm2 monit     # PM2 monitoring
```

### Database Performance
```bash
mysql -u gkicks_user -p
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Threads_connected';
```

---

## 📋 Quick Deployment Checklist

- [ ] Connect to VPS via SSH
- [ ] Upload project files to `/tmp/gkicks-deployment/`
- [ ] Run deployment script: `./deploy-gkicks-complete.sh`
- [ ] Configure DNS records
- [ ] Wait for DNS propagation
- [ ] Set up SSL certificates
- [ ] Update environment variables
- [ ] Create admin user
- [ ] Test all functionality

**🎉 Your GKicks e-commerce platform will be live at https://g-kicks.shop!**

---

## 📧 Need Help?

If you encounter any issues during deployment:
1. Check the deployment logs
2. Verify all prerequisites are met
3. Ensure proper file permissions
4. Contact your hosting provider if needed

The deployment script includes comprehensive error handling and logging to help identify any issues.