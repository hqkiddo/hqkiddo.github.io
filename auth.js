/**
 * HQ Kiddo - Authentication module
 * Handles login, signup, logout, and auth state.
 */
(function () {
  "use strict";

  window.HQAuth = {
    user: null,
    onAuthChange: null,

    init() {
      if (!window.FIREBASE_ENABLED || !window.firebase) return;
      const auth = firebase.auth();
      auth.onAuthStateChanged((user) => {
        this.user = user;
        if (this.onAuthChange) this.onAuthChange(user);
        this.updateUI();
      });
      this.bindUI();
    },

    bindUI() {
      const loginBtn = document.getElementById("authLoginBtn");
      const signupBtn = document.getElementById("authSignupBtn");
      const logoutBtn = document.getElementById("authLogoutBtn");
      const authSection = document.getElementById("authSection");
      const authModal = document.getElementById("authModal");
      const closeAuthBtn = document.getElementById("closeAuthBtn");
      const authForm = document.getElementById("authForm");
      const authToggle = document.getElementById("authToggle");

      if (!authSection) return;

      if (loginBtn) loginBtn.addEventListener("click", () => this.showAuth("login"));
      if (signupBtn) signupBtn.addEventListener("click", () => this.showAuth("signup"));
      if (logoutBtn) logoutBtn.addEventListener("click", () => this.logout());
      if (closeAuthBtn) closeAuthBtn.addEventListener("click", () => this.hideAuth());
      if (authForm) authForm.addEventListener("submit", (e) => this.handleSubmit(e));
      if (authToggle) authToggle.addEventListener("click", () => this.toggleMode());

      if (authSection) authSection.style.display = window.FIREBASE_ENABLED ? "block" : "none";
    },

    showAuth(mode) {
      const modal = document.getElementById("authModal");
      if (!modal) return;
      this.authMode = mode || "login";
      document.getElementById("authTitle").textContent =
        this.authMode === "signup" ? "Create account" : "Log in";
      document.getElementById("authSubmitBtn").textContent =
        this.authMode === "signup" ? "Sign up" : "Log in";
      document.getElementById("authToggle").innerHTML =
        this.authMode === "signup"
          ? 'Already have an account? <strong>Log in</strong>'
          : "Don't have an account? <strong>Sign up</strong>";
      document.getElementById("authError").textContent = "";
      modal.classList.add("show");
    },

    hideAuth() {
      const modal = document.getElementById("authModal");
      if (modal) modal.classList.remove("show");
    },

    toggleMode() {
      this.authMode = this.authMode === "login" ? "signup" : "login";
      this.showAuth(this.authMode);
    },

    async handleSubmit(e) {
      e.preventDefault();
      if (!window.FIREBASE_ENABLED || !firebase) return;
      const email = document.getElementById("authEmail")?.value?.trim();
      const password = document.getElementById("authPassword")?.value?.trim();
      const errEl = document.getElementById("authError");
      if (!email || !password) {
        errEl.textContent = "Please enter email and password.";
        return;
      }
      if (password.length < 6) {
        errEl.textContent = "Password must be at least 6 characters.";
        return;
      }
      errEl.textContent = "";
      try {
        if (this.authMode === "signup") {
          await firebase.auth().createUserWithEmailAndPassword(email, password);
        } else {
          await firebase.auth().signInWithEmailAndPassword(email, password);
        }
        this.hideAuth();
      } catch (err) {
        errEl.textContent = err.message || "Something went wrong.";
      }
    },

    async logout() {
      if (!window.FIREBASE_ENABLED || !firebase) return;
      await firebase.auth().signOut();
    },

    updateUI() {
      const loggedIn = document.getElementById("authLoggedIn");
      const loggedOut = document.getElementById("authLoggedOut");
      const userEmail = document.getElementById("authUserEmail");
      if (loggedIn) loggedIn.style.display = this.user ? "flex" : "none";
      if (loggedOut) loggedOut.style.display = this.user ? "none" : "flex";
      if (userEmail && this.user) userEmail.textContent = this.user.email;
    },

    getUserId() {
      return this.user ? this.user.uid : null;
    },

    isLoggedIn() {
      return !!this.user;
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => HQAuth.init());
  } else {
    HQAuth.init();
  }
})();
