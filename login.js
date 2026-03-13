(function () {
  "use strict";

  if (!window.FIREBASE_ENABLED || typeof firebase === "undefined") {
    document.getElementById("loginFlow").innerHTML =
      '<p class="login-error">Firebase is not configured yet. <a href="firebase-setup.html" class="nav-link">Follow the setup guide</a> to enable login and cloud sync.</p>';
    return;
  }

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      const flow = document.getElementById("loginFlow");
      flow.innerHTML = '<p class="step-desc">You\'re already logged in. <a href="index.html" class="nav-link">Go to menu</a></p>';
    }
  });

  let currentStep = 1;
  let mode = "signup";
  let email = "";
  let username = "";

  const stepPanels = document.querySelectorAll(".step-panel");
  const stepDots = document.querySelectorAll(".step-dot");
  const step2Form = document.getElementById("step2Form");
  const step3Form = document.getElementById("step3Form");
  const step4Form = document.getElementById("step4Form");
  const step2Email = document.getElementById("step2Email");
  const step3Username = document.getElementById("step3Username");
  const step4Password = document.getElementById("step4Password");
  const loginError = document.getElementById("loginError");

  function showStep(step) {
    currentStep = step;
    stepPanels.forEach((p) => p.classList.remove("active"));
    const panel = document.getElementById("step" + step);
    if (panel) panel.classList.add("active");

    stepDots.forEach((dot, i) => {
      const n = i + 1;
      dot.classList.remove("active", "completed");
      if (n < step) dot.classList.add("completed");
      else if (n === step) dot.classList.add("active");
    });

    const step3Panel = document.getElementById("step3");
    const step3Login = document.getElementById("step3Login");
    const step3ConfirmEmail = document.getElementById("step3ConfirmEmail");
    if (mode === "login") {
      step3Panel.querySelector(".step-desc").textContent = "Confirm your email";
      step3Login.style.display = "grid";
      step3Form.style.display = "none";
      if (step3ConfirmEmail) step3ConfirmEmail.textContent = email;
    } else {
      step3Panel.querySelector(".step-desc").textContent = "Username";
      step3Login.style.display = "none";
      step3Form.style.display = "grid";
    }

    loginError.textContent = "";
  }

  function setError(msg) {
    loginError.textContent = msg || "";
  }

  document.querySelectorAll(".choice-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      email = "";
      username = "";
      step2Email.value = "";
      step3Username.value = "";
      step4Password.value = "";
      if (mode === "login") {
        showStep(2);
      } else {
        showStep(2);
      }
    });
  });

  step2Form.addEventListener("submit", (e) => {
    e.preventDefault();
    email = step2Email.value.trim();
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    showStep(3);
  });

  document.getElementById("step3NextBtn").addEventListener("click", () => {
    if (mode === "login") showStep(4);
  });

  step3Form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (mode === "signup") {
      username = step3Username.value.trim();
      if (!username) {
        setError("Please enter a username.");
        return;
      }
    }
    showStep(4);
    if (mode === "login") {
      step4Form.querySelector("button").textContent = "Log in";
    } else {
      step4Form.querySelector("button").textContent = "Sign up";
    }
  });

  step4Form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = step4Password.value;
    if (password.length < 8) {
      setError("Password must have at least 8 characters.");
      return;
    }
    setError("");
    try {
      if (mode === "signup") {
        const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
        if (username && cred.user) {
          await cred.user.updateProfile({ displayName: username });
          const db = firebase.firestore();
          await db.collection("users").doc(cred.user.uid).collection("data").doc("profile").set({ username });
        }
        window.location.href = "index.html";
      } else {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        window.location.href = "index.html";
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
  });

  showStep(1);
})();
