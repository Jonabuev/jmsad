import axios from "axios";

const userData = {
  username: "john_doe",
  email: "john@example.com",
  phone_number: "1234567890",
  role: "tenant",
  type_entity: "individual",
  type_identify: "iin",
  identifier: "123456789012",
  password1: "password123",
  password2: "password123",
};

export const registerUser = async () => {
  const response = await axios.post(
    "http://127.0.0.1:8000/register/",
    userData,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  localStorage.setItem("access_token", response.data.access);
  localStorage.setItem("refresh_token", response.data.refresh);
  console.log("User registered successfully");
};

export const refreshToken = async () => {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    console.error("No refresh token found");
    return;
  }

  const response = await axios.post(
    "http://127.0.0.1:8000/api/token/refresh/",
    {
      refresh: refreshToken,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  localStorage.setItem("access_token", response.data.access);
  console.log("Access token refreshed");
};
