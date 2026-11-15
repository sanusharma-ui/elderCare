export function getRoleHome(role: "ELDER" | "CARETAKER" | "FAMILY" | "DOCTOR"): string {
  switch (role) {
    case "ELDER":
      return "/elder/today";
    case "CARETAKER":
      return "/caretaker/today";
    case "FAMILY":
      return "/family/home";
    case "DOCTOR":
      return "/doctor/dashboard";
    default:
      return "/";
  }
}
