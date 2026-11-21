const departmentByCategory = {
  Roads: "Public Works Department",
  Waste: "Sanitation Department",
  Water: "Water Supply Department",
  Electricity: "Electricity Department",
  Drainage: "Drainage Department",
  Trees: "Horticulture Department",
  "Public Safety": "Municipal Safety Department",
  Other: "Municipal Grievance Department",
};

module.exports = {
  departmentByCategory,
  getDepartmentForCategory: (category) =>
    departmentByCategory[category] || departmentByCategory.Other,
};
