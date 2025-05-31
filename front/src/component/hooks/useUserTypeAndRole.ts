import { useState } from "react";

export function useUserTypeAndRole() {
  const [userType, setUserType] = useState<"individual" | "legal_entity" | "">(
    ""
  );
  const [role, setRole] = useState<"tenant" | "landlord" | "">("");

  const handleUserTypeChange = (value: "individual" | "legal_entity") => {
    setUserType(value);
  };

  const handleRoleChange = (value: "tenant" | "landlord") => {
    setRole(value);
  };

  return {
    userType,
    role,
    handleUserTypeChange,
    handleRoleChange,
  };
}
