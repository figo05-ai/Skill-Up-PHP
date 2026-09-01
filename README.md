# Skill-Up HRMS 🏢

![Skill-Up HRMS](https://img.shields.io/badge/Version-1.0.0-blue)
![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=flat&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

A comprehensive Human Resources Management System built with the latest technologies to serve the **Skill-Up** organization. The system aims to facilitate the management of employees, attendance, clients, and daily tasks in a seamless and professional manner.

---

## 🌟 Core Features

1. **Employees Management:**
   - Add, edit, and delete employee records (supporting detailed data such as job titles, working hours, and hiring dates).
   - View a comprehensive profile for each employee.
2. **Attendance Tracking:**
   - Record employees' clock-in and clock-out times.
   - Customized reports for attendance status, working hours, and performance tracking.
3. **Task Management:**
   - Assign tasks to employees and track progress.
   - Interactive Task Board to monitor task statuses (Pending, In Progress, Completed).
4. **Clients Management:**
   - A dedicated database for company clients, commercial registration numbers, and contact files.
5. **Reporting & Analytics:**
   - A smart Dashboard displaying an overview of the company's performance.
   - Professional export of task and attendance reports.
6. **System Logs:**
   - Full tracking of all actions performed on the system to ensure security and transparency.

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Laravel (PHP)
- **Database:** MySQL
- **Authentication:** Laravel Sanctum (Token-based Auth)

### Frontend
- **Library:** React.js (18+)
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **State/API:** Axios & Context API
- **Build Tool:** Vite

---

## 🚀 Local Setup

### 1. Prerequisites
- Install PHP (8.1 or newer)
- Install Composer
- Install Node.js & npm
- Install MySQL Database

### 2. Installation Steps
```bash
# 1. Clone the repository
git clone https://github.com/figo05-ai/Skill-Up-PHP.git
cd Skill-Up-PHP

# 2. Install backend dependencies
composer install

# 3. Install frontend dependencies
npm install

# 4. Setup environment file
cp .env.example .env
# Update the database credentials in the .env file

# 5. Prepare the system
php artisan key:generate
php artisan migrate
php artisan storage:link

# 6. Run the server
php artisan serve

# 7. Run the frontend in a separate Terminal window
npm run dev
```

---

## 🌍 Deployment

1. Pull the project onto your hosting server (e.g., Hostinger).
2. Update the `.env` file with production settings:
   ```env
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://yourdomain.com
   ```
3. Run the following commands via SSH:
   ```bash
   composer install --optimize-autoloader --no-dev
   npm run build
   php artisan storage:link
   php artisan optimize
   ```
4. Ensure the domain's Document Root is pointed to the `public` directory.

---

## 🔐 Default Admin Accounts
Please refer to the system administrator to obtain the Admin Credentials.

---
*Developed with ❤️ for the Skill-Up organization.*