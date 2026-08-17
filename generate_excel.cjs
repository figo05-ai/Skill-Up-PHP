const XLSX = require('xlsx');

const headers = [
  'الاسم',
  'الشركة',
  'رقم الهوية',
  'رقم الهاتف',
  'المسمى الوظيفي',
  'الجنسية',
  'البريد الإلكتروني',
  'تاريخ الالتحاق',
  'حالة الموظف',
  'كلمة المرور',
  'الحضور (%)',
  'أيام العطلات',
  'ساعات العمل',
  'رقم العقد'
];

const sampleData = [
  'أحمد محمد',
  'شركة التقنية الحديثة',
  '1023456789',
  '0501234567',
  'مهندس برمجيات',
  'سعودي',
  'ahmed@example.com',
  '2024-01-01',
  'نشط',
  '123456',
  '100',
  '0',
  '176',
  'CONT-2024-01'
];

const wsData = [headers, sampleData];
const ws = XLSX.utils.aoa_to_sheet(wsData);

// Set column widths for better readability
const wscols = headers.map(h => ({ wch: 20 }));
ws['!cols'] = wscols;

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "الموظفين");

const path = require('path');
const outputPath = path.join(__dirname, 'public', 'employee_template.xlsx');

XLSX.writeFile(wb, outputPath);
console.log('File created successfully at:', outputPath);
