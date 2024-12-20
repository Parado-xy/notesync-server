// Constants for API endpoints
const API_ENDPOINTS = {
  SIGNUP: "/api/auth/signup",
  SIGNIN: "/api/auth/signin",
};

// Constants for UI text
const UI_TEXT = {
  SIGNUP_LOADING: "Creating Account...",
  SIGNIN_LOADING: "Signing In...",
  SIGNUP: "Create Account",
  SIGNIN: "Sign In",
  GOOGLE_REDIRECT: "Redirecting to Google...",
};

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate password strength
const isValidPassword = (password) => password.length >= 8;

// Helper function to validate full name format
const isValidFullName = (fullName) => {
  const nameRegex = /^[a-zA-Z\s]+$/;
  return nameRegex.test(fullName);
};

// Helper function to handle API errors
const handleApiError = (error) => {
  return error.message || "An unexpected error occurred. Please try again.";
};

const handleAuthentication = async (formData, isSignup) => {
  const endpoint = isSignup ? API_ENDPOINTS.SIGNUP : API_ENDPOINTS.SIGNIN;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      // Backend returned an error
      throw new Error(data.message || "Authentication failed");
    }

    if (data.redirectUrl) {
      window.location.href = data.redirectUrl;
    }
  } catch (error) {
    // Display error message
    errorMessage.textContent = error.message;
    throw error; // Re-throw to stop processing
  }
};

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMessage.textContent = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const isSignup = signupTab.classList.contains("active");

  try {
    // Validate email
    if (!isValidEmail(email)) {
      throw new Error("Please enter a valid email address");
    }

    // Validate password
    if (!isValidPassword(password)) {
      throw new Error("Password must be at least 8 characters long");
    }

    // Show loading state
    authSubmitBtn.disabled = true;
    authButtonText.textContent = isSignup
      ? UI_TEXT.SIGNUP_LOADING
      : UI_TEXT.SIGNIN_LOADING;

    if (isSignup) {
      const fullName = document.getElementById("fullName").value.trim();
      const termsChecked = document.getElementById("termsCheck").checked;

      if (!isValidFullName(fullName)) {
        throw new Error(
          "Please enter a valid full name (letters and spaces only)"
        );
      }

      if (!termsChecked) {
        throw new Error("Please agree to the terms of service");
      }

      const signupData = { fullName, email, password };
      await handleAuthentication(signupData, true);
    } else {
      const signinData = { email, password };
      await handleAuthentication(signinData, false);
    }
  } catch (error) {
    errorMessage.textContent = error.message;
  } finally {
    authSubmitBtn.disabled = false;
    authButtonText.textContent = isSignup ? UI_TEXT.SIGNUP : UI_TEXT.SIGNIN;
  }
});

// Handle forgot password link
document.getElementById("forgotPasswordLink").addEventListener("click", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();

  if (!email) {
    errorMessage.textContent = "Please enter your email address first";
    return;
  }

  // Redirect to forgot password page with email
  window.location.href = `/forgot-password?email=${encodeURIComponent(email)}`;
});
