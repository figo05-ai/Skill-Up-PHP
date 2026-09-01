# Skill-Up HRMS 🏢

![Skill-Up HRMS](https://img.shields.io/badge/Version-1.0.0-blue)
![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=flat&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

A comprehensive HR Management System built with cutting-edge technologies to serve the **Skill-Up** organization. The system aims to streamline the management of employees, attendance, clients, and daily tasks in a seamless and professional manner.

---

## 🌟 Core Features

1. **Employees Management:**
   - Add, edit, and delete employee records (supporting detailed information such as job title, working hours, and hiring date).
   - View a comprehensive profile for each employee.
2. **Attendance Tracking:**
   - Log employee check-in and check-out times.
   - Custom reports for attendance status, working hours, and performance tracking.
3. **Task Management:**
   - Assign tasks to employees and track their progress.
   - An interactive Task Board to monitor task statuses (Pending, In Progress, Completed).
4. **Clients Management:**
   - A dedicated database for the company's clients, including commercial register numbers and contact details.
5. **Reporting & Analytics:**
   - A smart Dashboard providing an overview of the company's performance.
   - Professional export of task and attendance reports.
6. **System Logs:**
   - Complete tracking of all system actions to ensure security and transparency.

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
git clone [https://github.com/figo05-ai/Skill-Up-PHP.git](https://github.com/figo05-ai/Skill-Up-PHP.git)
cd Skill-Up-PHP

# 2. Install backend dependencies
composer install

# 3. Install frontend dependencies
npm install

# 4. Setup environment file
cp .env.example .env
# Update the database credentials in the .env file

# 5. System setup
php artisan key:generate
php artisan migrate
php artisan storage:link

# 6. Start the backend server
php artisan serve

# 7. Start the frontend server in a new Terminal window
npm run dev
