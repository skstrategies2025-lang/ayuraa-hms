// English-only UI text. (Other languages were removed: the whole portal is now English.)
export const TRANSLATIONS = {
  app_title: "AyurSutra HMS",
  dashboard: "Hospital Dashboard",
  patients: "Patient Records & EMR",
  prescriptions: "Rx & Clinical Templates",
  panchakarma: "Panchakarma Department",
  pharmacy: "Ayurvedic Pharmacy & Stock",
  billing: "Billing & TPA Insurance",
  clinic_crm: "Clinic Patient CRM",
  medical_camps: "Medical Camps & Outreach",
  pamphlets: "Pamphlet & Brochure Studio",
  appointments: "Appointments & SMS Alerts",
  staff_payroll: "Staff Attendance & Payroll",
  financial_analytics: "Financial Analytics",
  settings: "Clinic Customizer & Backup",
  prakriti: "Prakriti (Constitution)",
  expiring_soon: "Expiring Soon Alert",
  low_stock: "Low Stock Alert",
  print_rx: "Print Branded Prescription",
};

export function t(key) {
  return TRANSLATIONS[key] ?? key;
}
