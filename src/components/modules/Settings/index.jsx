import { useState } from "react";
import { Icon, Toast } from "../../common";
import { useAuth } from "../../../context/AuthContext";

/**
 * Settings Module
 * User preferences + account info (read-only profile from AuthContext)
 * Theme toggle is handled in the Sidebar; this is the long-form view.
 */
const SettingsModule = ({ setActiveNav }) => {
  const { user } = useAuth();
  const [toast, setToast] = useState(null);

  const safeUser = user || {};
  const displayName =
    safeUser.displayName || safeUser.email?.split("@")[0] || "Usuario";
  const role = safeUser.role || "USER";
  const email = safeUser.email || "—";
  const areaId = safeUser.areaId || "—";
  const departmentId = safeUser.departmentId || "—";

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopy = (value, label) => {
    if (!value || value === "—") return;
    navigator.clipboard?.writeText(String(value));
    showToast(`${label} copied to clipboard`, "success");
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <div className="module-title-section">
          <h1 className="module-title">Settings</h1>
          <p className="module-subtitle">
            Account preferences and application settings
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Profile card */}
        <div className="card settings-card">
          <div className="card-header">
            <Icon name="person" />
            <h3>Profile</h3>
          </div>
          <div className="card-body">
            <div className="settings-row">
              <label>Display name</label>
              <div className="settings-value">{displayName}</div>
            </div>
            <div className="settings-row">
              <label>Email</label>
              <div
                className="settings-value clickable"
                onClick={() => handleCopy(email, "Email")}
                title="Click to copy"
              >
                {email}
              </div>
            </div>
            <div className="settings-row">
              <label>Role</label>
              <div className="settings-value">
                <span
                  className={`role-badge role-${String(role).toLowerCase()}`}
                >
                  {role}
                </span>
              </div>
            </div>
            <div className="settings-row">
              <label>Area</label>
              <div className="settings-value">{areaId}</div>
            </div>
            <div className="settings-row">
              <label>Department</label>
              <div className="settings-value">{departmentId}</div>
            </div>
            <p className="settings-hint">
              To update your profile contact an administrator.
            </p>
          </div>
        </div>

        {/* Appearance card */}
        <div className="card settings-card">
          <div className="card-header">
            <Icon name="palette" />
            <h3>Appearance</h3>
          </div>
          <div className="card-body">
            <p className="settings-hint">
              Toggle light/dark mode from the sidebar theme switch.
            </p>
          </div>
        </div>

        {/* Integrations card */}
        <div className="card settings-card">
          <div className="card-header">
            <Icon name="hub" />
            <h3>Integrations</h3>
          </div>
          <div className="card-body">
            <div className="settings-row">
              <label>QuickBooks</label>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveNav && setActiveNav("qb-health")}
              >
                Open QB Health
              </button>
            </div>
          </div>
        </div>

        {/* Security card */}
        <div className="card settings-card">
          <div className="card-header">
            <Icon name="lock" />
            <h3>Security</h3>
          </div>
          <div className="card-body">
            <p className="settings-hint">
              Password reset is handled through the login screen "Forgot
              password" link.
            </p>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SettingsModule;
