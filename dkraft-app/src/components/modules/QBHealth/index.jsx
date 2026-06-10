import { Icon } from "../../common";

/**
 * QBHealth Module
 * QuickBooks integration health check placeholder.
 * Backend endpoints pending (see BACKEND_ENDPOINTS_PENDING.md).
 */
const QBHealthModule = () => {
  return (
    <div className="module-container">
      <div className="module-header">
        <div className="module-title-section">
          <h1 className="module-title">QuickBooks Health</h1>
          <p className="module-subtitle">
            Integration status and sync diagnostics
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <Icon name="favorite" />
          <h3>Connection status</h3>
        </div>
        <div className="card-body">
          <p className="settings-hint">
            QuickBooks health endpoints are not yet wired in this build. Sync
            status per entity is shown inline in Clients, Suppliers, Materials,
            Products and Quotations modules.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QBHealthModule;
