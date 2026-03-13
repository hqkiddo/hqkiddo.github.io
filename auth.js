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
      const navLink = document.getElementById("authNavLink");
      if (navLink) {
        navLink.addEventListener("click", (e) => {
          if (this.user) {
            e.preventDefault();
            this.logout();
          }
        });
      }
    },

    async logout() {
      if (!window.FIREBASE_ENABLED || !firebase) return;
      await firebase.auth().signOut();
      if (window.location.pathname.endsWith("login.html")) {
        window.location.reload();
      }
    },

    updateUI() {
      const navLink = document.getElementById("authNavLink");
      if (!navLink) return;
      const onLoginPage = window.location.pathname.endsWith("login.html");
      if (window.FIREBASE_ENABLED) {
        navLink.style.display = "";
        if (this.user) {
          navLink.textContent = "Log out";
          navLink.href = "#";
        } else if (onLoginPage) {
          navLink.textContent = "← Menu";
          navLink.href = "index.html";
        } else {
          navLink.textContent = "Login";
          navLink.href = "login.html";
        }
      } else {
        navLink.style.display = "none";
      }
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
