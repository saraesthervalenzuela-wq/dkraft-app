import { useState, useEffect, useRef, useCallback } from "react";
import {
  Icon,
  SearchBox,
  Modal,
  SkeletonStatsRow,
  Skeleton,
  Toast,
  InfiniteScrollSentinel,
} from "../../common";
import { useInfiniteScroll } from "../../../hooks";
import {
  materialsService,
  suppliersService,
  categoriesService,
  unitsService,
} from "../../../firebase";
import {
  isApiEnabled,
  materialsApi,
  suppliersApi,
  categoriesApi,
  unitsApi,
} from "../../../services/api";

// Polling interval for QB sync status (30 seconds)
const QB_SYNC_POLL_INTERVAL = 30000;

// No local data - all data comes from Supabase

/**
 * Empty material template matching MySQL schema
 */
const emptyMaterial = {
  code_qb: "",
  qbSyncStatus: "pending",
  name: "",
  description: "",
  categoryId: "",
  unitId: "",
  supplierId: "",
  status: "ACTIVE",
  stock: 0,
  minStock: 0,
  price: 0,
};

/**
 * Status options matching MySQL ENUM
 */
const statusOptions = [
  { value: "ACTIVE", label: "Active", color: "green" },
  { value: "LOW_STOCK", label: "Low Stock", color: "orange" },
  { value: "INACTIVE", label: "Inactive", color: "gray" },
];

/**
 * Materials Skeleton - Sexy loading state
 */
const MaterialsSkeleton = () => (
  <div className="module-page materials-module">
    <div className="page-header">
      <div className="header-content">
        <Skeleton width="48px" height="48px" radius="12px" />
        <div className="header-text">
          <Skeleton width="140px" height="1.5rem" />
          <Skeleton width="200px" height="0.875rem" />
        </div>
      </div>
      <div
        className="header-actions"
        style={{ display: "flex", gap: "0.75rem" }}
      >
        <Skeleton width="120px" height="40px" radius="8px" />
        <Skeleton width="150px" height="40px" radius="8px" />
      </div>
    </div>

    <SkeletonStatsRow count={4} />

    <div className="materials-toolbar">
      <Skeleton width="280px" height="44px" radius="8px" />
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Skeleton width="100px" height="40px" radius="8px" />
        <Skeleton width="80px" height="40px" radius="8px" />
      </div>
    </div>

    <div className="skeleton-table skeleton-glow">
      <div className="skeleton-table-header">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} width="80%" height="0.75rem" />
        ))}
      </div>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="skeleton-table-row">
          {[1, 2, 3, 4, 5, 6, 7].map((j) => (
            <Skeleton key={j} width={j === 1 ? "24px" : "70%"} height="1rem" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const MaterialsModule = () => {
  // Data state
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [toast, setToast] = useState(null);

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  // (Pagination removed — replaced with client-side infinite scroll, see useInfiniteScroll below)
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  }); // Newest first
  const [activeTab, setActiveTab] = useState("materials");
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentMaterial, setCurrentMaterial] = useState(emptyMaterial);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);

  // QB Sync polling ref
  const pollIntervalRef = useRef(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Check if any materials have pending QB sync and need polling
   */
  const _hasPendingQBSync = useCallback((materialsList) => {
    return materialsList.some((m) => !m.qbListId && m.qbSyncStatus !== "error");
  }, []);

  /**
   * Start polling for QB sync status updates
   */
  useEffect(() => {
    const useApi = isApiEnabled();
    if (!useApi) return;

    // Check if we have pending syncs
    const pendingMaterials = materials.filter(
      (m) => !m.qbListId && m.qbSyncStatus !== "error",
    );
    setPendingSyncCount(pendingMaterials.length);

    if (pendingMaterials.length > 0) {
      console.log(
        `[Materials] ${pendingMaterials.length} materials pending QB sync, starting polling...`,
      );

      // Clear existing interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      // Start polling
      pollIntervalRef.current = setInterval(async () => {
        console.log("[Materials] Polling for QB sync updates...");
        try {
          const updatedMaterials = await materialsApi.getAll();
          if (updatedMaterials?.length > 0) {
            const normalizedMaterials = updatedMaterials.map(normalizeMaterial);

            // Check for newly synced materials
            const newlySynced = normalizedMaterials.filter((updated) => {
              const original = materials.find((m) => m.id === updated.id);
              return original && !original.qbListId && updated.qbListId;
            });

            if (newlySynced.length > 0) {
              console.log(
                `[Materials] ${newlySynced.length} materials synced with QB:`,
                newlySynced.map((m) => m.name),
              );
            }

            setMaterials(normalizedMaterials);

            // Update pending count
            const stillPending = normalizedMaterials.filter(
              (m) => !m.qbListId && m.qbSyncStatus !== "error",
            );
            setPendingSyncCount(stillPending.length);

            // Stop polling if no more pending
            if (stillPending.length === 0) {
              console.log("[Materials] All materials synced, stopping polling");
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        } catch (error) {
          console.error("[Materials] Polling error:", error);
        }
      }, QB_SYNC_POLL_INTERVAL);
    }

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [materials.length]); // Re-run when materials count changes

  /**
   * Load materials and related data from Firebase or API
   */
  const loadData = async () => {
    setIsLoading(true);
    try {
      const useApi = isApiEnabled();

      // Load all data in parallel
      const [materialsData, suppliersData, categoriesData, unitsData] =
        await Promise.all([
          useApi ? materialsApi.getAll() : materialsService.getAll(),
          useApi ? suppliersApi.getAll() : suppliersService.getAll(),
          useApi ? categoriesApi.getAll() : categoriesService.getAll(),
          useApi ? unitsApi.getAll() : unitsService.getAll(),
        ]);

      // Update state with fetched data or keep defaults
      if (materialsData?.length > 0) {
        // Normalize field names if coming from old Firebase structure
        const normalizedMaterials = materialsData.map(normalizeMaterial);
        setMaterials(normalizedMaterials);
      }
      if (suppliersData?.length > 0) setSuppliers(suppliersData);
      if (categoriesData?.length > 0) setCategories(categoriesData);
      if (unitsData?.length > 0) setUnits(unitsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Determine QB sync status based on qbListId presence
   * - If qbListId exists -> 'synced'
   * - If no qbListId and qbSyncStatus is 'error' -> 'error'
   * - Otherwise -> 'pending'
   */
  const getQBSyncStatusFromData = (material) => {
    if (material.qbListId) {
      return "synced";
    }
    if (material.qbSyncStatus === "error") {
      return "error";
    }
    return "pending";
  };

  /**
   * Normalize material data from different sources to match MySQL schema
   */
  const normalizeMaterial = (m) => {
    // Determine qbSyncStatus based on qbListId
    const qbSyncStatus = getQBSyncStatusFromData(m);

    // If data already has new field names, just update qbSyncStatus
    if (m.code_qb !== undefined) {
      return {
        ...m,
        qbSyncStatus,
      };
    }

    // Convert from old Firebase structure to new MySQL structure
    return {
      id: m.id,
      code_qb: m.codeQB || m.code_qb || "",
      qbSyncStatus,
      name: m.material || m.name || "",
      description: m.description || "",
      categoryId: findCategoryId(m.category) || m.categoryId || "",
      unitId: findUnitId(m.unit) || m.unitId || "",
      supplierId: findSupplierId(m.supplier) || m.supplierId || "",
      status: normalizeStatus(m.status),
      stock: m.stockTotal || m.stock || 0,
      minStock: m.minStock || 0,
      price: m.unitPrice || m.price || 0,
      qbListId: m.qbListId || null,
    };
  };

  /**
   * Helper functions to find IDs from names (for backward compatibility)
   */
  const findCategoryId = (categoryName) => {
    if (!categoryName) return "";
    const cat = categories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
    );
    return cat?.id || "";
  };

  const findSupplierId = (supplierName) => {
    if (!supplierName) return "";
    const sup = suppliers.find(
      (s) => s.name.toLowerCase() === supplierName.toLowerCase(),
    );
    return sup?.id || "";
  };

  const findUnitId = (unitName) => {
    if (!unitName) return "";
    const unit = units.find(
      (u) => u.name.toLowerCase() === unitName.toLowerCase(),
    );
    return unit?.id || "";
  };

  /**
   * Normalize status to MySQL ENUM format
   */
  const normalizeStatus = (status) => {
    if (!status) return "ACTIVE";
    const statusUpper = status.toUpperCase().replace(" ", "_");
    if (["ACTIVE", "LOW_STOCK", "INACTIVE"].includes(statusUpper)) {
      return statusUpper;
    }
    // Map old status names
    if (status.toLowerCase() === "low stock") return "LOW_STOCK";
    return "ACTIVE";
  };

  /**
   * Get display values for IDs
   */
  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || "-";
  };

  const getSupplierName = (supplierId) => {
    const sup = suppliers.find((s) => s.id === supplierId);
    return sup?.name || "-";
  };

  const getUnitName = (unitId) => {
    const unit = units.find((u) => u.id === unitId);
    return unit?.name || "-";
  };

  /**
   * QuickBooks sync status icon
   */
  const getQBStatusIcon = (status) => {
    switch (status) {
      case "synced":
        return { icon: "check_circle", color: "#10b981", label: "Synced" };
      case "pending":
        return { icon: "schedule", color: "#f59e0b", label: "Pending" };
      case "error":
        return { icon: "error", color: "#ef4444", label: "Error" };
      default:
        return { icon: "help", color: "#64748b", label: "Unknown" };
    }
  };

  /**
   * Material status styling
   */
  const getStatusStyle = (status) => {
    const statusOpt = statusOptions.find((s) => s.value === status);
    return statusOpt || { value: status, label: status, color: "gray" };
  };

  // Filter materials
  const filteredMaterials = materials.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCategoryName(m.categoryId)
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      getSupplierName(m.supplierId)
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      m.code_qb?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Sort materials - default newest first
  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    // Default: newest first by created_at
    if (!sortConfig.key) {
      const aDate = new Date(a.created_at || 0);
      const bDate = new Date(b.created_at || 0);
      return bDate - aDate;
    }

    // Handle date fields
    if (sortConfig.key === "created_at" || sortConfig.key === "updated_at") {
      const aDate = new Date(a[sortConfig.key] || 0);
      const bDate = new Date(b[sortConfig.key] || 0);
      return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
    }

    let aVal, bVal;

    // Handle special cases for ID fields
    if (sortConfig.key === "categoryId") {
      aVal = getCategoryName(a.categoryId).toLowerCase();
      bVal = getCategoryName(b.categoryId).toLowerCase();
    } else if (sortConfig.key === "supplierId") {
      aVal = getSupplierName(a.supplierId).toLowerCase();
      bVal = getSupplierName(b.supplierId).toLowerCase();
    } else if (sortConfig.key === "unitId") {
      aVal = getUnitName(a.unitId).toLowerCase();
      bVal = getUnitName(b.unitId).toLowerCase();
    } else {
      aVal = String(a[sortConfig.key] || "").toLowerCase();
      bVal = String(b[sortConfig.key] || "").toLowerCase();
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Infinite scroll — replaces previous pagination block
  const {
    visibleItems: visibleMaterials,
    visibleCount: visibleMaterialsCount,
    hasMore: hasMoreMaterials,
    sentinelRef: materialsSentinelRef,
  } = useInfiniteScroll(sortedMaterials, {
    initialCount: 12,
    step: 12,
    resetKey: `${searchTerm}|${sortConfig.key}|${sortConfig.direction}|${activeTab}|${viewMode}`,
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedMaterials(visibleMaterials.map((m) => m.id));
    } else {
      setSelectedMaterials([]);
    }
  };

  const handleSelectMaterial = (id) => {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  /**
   * Sync with QuickBooks
   */
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // In production, this would call the QuickBooks sync API
      if (isApiEnabled()) {
        // await quickbooksApi.syncMaterials();
      }
      // Simulate sync delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await loadData(); // Reload data after sync
    } catch (error) {
      console.error("Error syncing with QB:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Modal handlers
  const handleAdd = () => {
    const newCode = `MAT-${String(materials.length + 1).padStart(3, "0")}`;
    setCurrentMaterial({ ...emptyMaterial, code_qb: newCode });
    setModalMode("add");
    setShowModal(true);
  };

  const handleEdit = (material) => {
    setCurrentMaterial({ ...material });
    setModalMode("edit");
    setShowModal(true);
  };

  const handleView = (material) => {
    setCurrentMaterial({ ...material });
    setModalMode("view");
    setShowModal(true);
  };

  const handleDelete = (material) => {
    setMaterialToDelete(material);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (materialToDelete) {
      try {
        const useApi = isApiEnabled();
        if (useApi) {
          await materialsApi.delete(materialToDelete.id);
        } else {
          await materialsService.delete(materialToDelete.id);
        }
        setMaterials((prev) =>
          prev.filter((m) => m.id !== materialToDelete.id),
        );
      } catch (error) {
        console.error("Error deleting material:", error);
      }
    }
    setShowDeleteConfirm(false);
    setMaterialToDelete(null);
  };

  const handleSave = async () => {
    try {
      const useApi = isApiEnabled();
      console.log("[Materials] Saving material, useApi:", useApi);
      console.log("[Materials] Mode:", modalMode);
      console.log("[Materials] Data to save:", currentMaterial);

      // Auto-calculate status based on stock vs minStock
      let finalStatus = currentMaterial.status;
      if (currentMaterial.stock <= 0) {
        finalStatus = "INACTIVE";
      } else if (currentMaterial.stock <= currentMaterial.minStock) {
        finalStatus = "LOW_STOCK";
      }

      // Map camelCase to snake_case for Supabase
      const materialToSave = {
        code_qb: currentMaterial.code_qb || currentMaterial.codeQb || "",
        name: currentMaterial.name || "",
        description: currentMaterial.description || "",
        category_id:
          currentMaterial.categoryId || currentMaterial.category_id || null,
        unit_id: currentMaterial.unitId || currentMaterial.unit_id || null,
        supplier_id:
          currentMaterial.supplierId || currentMaterial.supplier_id || null,
        stock: parseFloat(currentMaterial.stock) || 0,
        min_stock:
          parseFloat(currentMaterial.minStock || currentMaterial.min_stock) ||
          0,
        price: parseFloat(currentMaterial.price) || 0,
        status: finalStatus,
        sync_status: "pending",
      };

      // Include id for edit mode
      if (modalMode === "edit" && currentMaterial.id) {
        materialToSave.id = currentMaterial.id;
      }

      console.log("[Materials] Final data:", materialToSave);

      if (modalMode === "add") {
        let newMaterial;
        if (useApi) {
          console.log("[Materials] Calling materialsApi.create...");
          newMaterial = await materialsApi.create(materialToSave);
          console.log("[Materials] API response:", newMaterial);
        } else {
          newMaterial = await materialsService.create(materialToSave);
        }
        setMaterials((prev) => [
          ...prev,
          { ...materialToSave, id: newMaterial?.id || newMaterial },
        ]);
      } else if (modalMode === "edit") {
        if (useApi) {
          console.log("[Materials] Calling materialsApi.update...");
          await materialsApi.update(currentMaterial.id, materialToSave);
        } else {
          await materialsService.update(currentMaterial.id, materialToSave);
        }
        setMaterials((prev) =>
          prev.map((m) => (m.id === currentMaterial.id ? materialToSave : m)),
        );
      }

      console.log("[Materials] Save successful!");
      setToast({
        message:
          modalMode === "add"
            ? "Material created successfully!"
            : "Material updated successfully!",
        type: "success",
      });
      setShowModal(false);
      setCurrentMaterial(emptyMaterial);
      // Reload data to get fresh data from server
      await loadData();
    } catch (error) {
      console.error("[Materials] Error saving material:", error);
      setToast({ message: "Error: " + error.message, type: "error" });
    }
  };

  const handleInputChange = (field, value) => {
    setCurrentMaterial((prev) => ({ ...prev, [field]: value }));
  };

  // Calculate stats
  const totalMaterials = materials.length;
  const totalStock = materials.reduce((sum, m) => sum + (m.stock || 0), 0);
  const lowStockCount = materials.filter(
    (m) => m.status === "LOW_STOCK",
  ).length;
  const totalValue = materials.reduce(
    (sum, m) => sum + (m.stock || 0) * (m.price || 0),
    0,
  );

  // Show skeleton while loading
  if (isLoading) {
    return <MaterialsSkeleton />;
  }

  return (
    <div className="module-page materials-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <span className="material-symbols-rounded">inventory_2</span>
          </div>
          <div className="header-text">
            <h1>Materials</h1>
            <p>Manage your inventory materials</p>
          </div>
        </div>
        <div className="header-actions">
          {pendingSyncCount > 0 && (
            <div
              className="qb-sync-indicator pending"
              title={`${pendingSyncCount} materials pending QB sync`}
            >
              <span className="material-symbols-rounded spinning">sync</span>
              <span className="sync-count">{pendingSyncCount} pending</span>
            </div>
          )}
          <button
            className={`btn-sync ${isSyncing ? "syncing" : ""}`}
            onClick={handleSync}
            disabled={isSyncing}
          >
            <span className="material-symbols-rounded">sync</span>
            {isSyncing ? "Syncing..." : "Sync with QB"}
          </button>
          <button className="btn-primary-action" onClick={handleAdd}>
            <span className="material-symbols-rounded">add</span>
            Add material
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="module-stats-row">
        <div className="module-stat-card">
          <div className="stat-icon purple">
            <Icon name="inventory_2" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalMaterials}</span>
            <span className="stat-label">Total Materials</span>
          </div>
        </div>
        <div className="module-stat-card">
          <div className="stat-icon blue">
            <Icon name="inventory" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalStock.toLocaleString()}</span>
            <span className="stat-label">Total Stock</span>
          </div>
        </div>
        <div className="module-stat-card">
          <div className="stat-icon orange">
            <Icon name="warning" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{lowStockCount}</span>
            <span className="stat-label">Low Stock</span>
          </div>
        </div>
        <div className="module-stat-card">
          <div className="stat-icon green">
            <Icon name="attach_money" />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              $
              {totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="stat-label">Total Value</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="materials-tabs-grid">
        {[
          {
            key: "materials",
            label: "Materials",
            icon: "inventory_2",
            desc: "Inventory items",
            color: "purple",
            stat: `${totalMaterials} Items`,
          },
          {
            key: "requisitions",
            label: "Requisitions",
            icon: "request_quote",
            desc: "Purchase requests",
            color: "blue",
            stat: "0 Pending",
          },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`materials-tab-card ${activeTab === tab.key ? "active" : ""} ${tab.color}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <div className="materials-tab-top">
              <div className={`materials-tab-icon ${tab.color}`}>
                <Icon name={tab.icon} />
              </div>
              <div className={`materials-tab-arrow ${tab.color}`}>
                <Icon name="arrow_forward" />
              </div>
            </div>
            <div className="materials-tab-content">
              <span className="materials-tab-label">{tab.label}</span>
              <span className="materials-tab-desc">{tab.desc}</span>
            </div>
            <div className="materials-tab-stat">{tab.stat}</div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="materials-toolbar">
        <SearchBox
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search materials..."
          className="materials-search"
        />
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            <Icon name="grid_view" />
          </button>
          <button
            className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            title="Table view"
          >
            <Icon name="view_list" />
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        /* Cards View */
        <div className="materials-cards-grid">
          {visibleMaterials.map((material) => {
            const qbStatus = getQBStatusIcon(material.qbSyncStatus);
            const statusStyle = getStatusStyle(material.status);
            return (
              <div key={material.id} className="material-card">
                <div className="material-card-header">
                  <div className="material-card-icon">
                    <Icon name="inventory_2" />
                  </div>
                  <div className="material-card-badges">
                    <span className={`status-badge ${statusStyle.color}`}>
                      <span className="status-dot"></span>
                      {statusStyle.label}
                    </span>
                    <span
                      className="qb-status-badge"
                      style={{ color: qbStatus.color }}
                      title={qbStatus.label}
                    >
                      <Icon name={qbStatus.icon} />
                    </span>
                  </div>
                </div>
                <div className="material-card-body">
                  <h3 className="material-card-name">{material.name}</h3>
                  <span className="material-card-code">{material.code_qb}</span>
                  <div className="material-card-details">
                    <div className="material-detail">
                      <Icon name="category" />
                      <span>{getCategoryName(material.categoryId)}</span>
                    </div>
                    <div className="material-detail">
                      <Icon name="local_shipping" />
                      <span>{getSupplierName(material.supplierId)}</span>
                    </div>
                    <div className="material-detail">
                      <Icon name="straighten" />
                      <span>{getUnitName(material.unitId)}</span>
                    </div>
                    <div className="material-detail">
                      <Icon name="attach_money" />
                      <span>${material.price?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="material-card-footer">
                  <div className="material-stock">
                    <span className="stock-label">Stock</span>
                    <span className="stock-value">
                      {material.stock} {getUnitName(material.unitId)}
                      {material.stock <= material.minStock &&
                        material.stock > 0 && (
                          <Icon
                            name="warning"
                            style={{
                              color: "#f59e0b",
                              marginLeft: "4px",
                              fontSize: "16px",
                            }}
                          />
                        )}
                    </span>
                  </div>
                  <div className="material-actions">
                    <button
                      className="btn-icon"
                      onClick={() => handleView(material)}
                      title="View"
                    >
                      <Icon name="visibility" />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleEdit(material)}
                      title="Edit"
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => handleDelete(material)}
                      title="Delete"
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {visibleMaterials.length === 0 && (
            <div className="materials-empty">
              <Icon name="inventory_2" />
              <p>No materials found</p>
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="materials-table">
          <div className="materials-table-header">
            <span className="col-checkbox">
              <input
                type="checkbox"
                checked={
                  visibleMaterials.length > 0 &&
                  selectedMaterials.length === visibleMaterials.length
                }
                onChange={handleSelectAll}
              />
            </span>
            <span
              className="col-code sortable"
              onClick={() => handleSort("code_qb")}
            >
              Code QB
              <Icon
                name={
                  sortConfig.key === "code_qb"
                    ? sortConfig.direction === "asc"
                      ? "arrow_upward"
                      : "arrow_downward"
                    : "unfold_more"
                }
              />
            </span>
            <span className="col-status-qb">QB Status</span>
            <span
              className="col-material sortable"
              onClick={() => handleSort("name")}
            >
              Material
              <Icon
                name={
                  sortConfig.key === "name"
                    ? sortConfig.direction === "asc"
                      ? "arrow_upward"
                      : "arrow_downward"
                    : "unfold_more"
                }
              />
            </span>
            <span
              className="col-category sortable"
              onClick={() => handleSort("categoryId")}
            >
              Category
              <Icon
                name={
                  sortConfig.key === "categoryId"
                    ? sortConfig.direction === "asc"
                      ? "arrow_upward"
                      : "arrow_downward"
                    : "unfold_more"
                }
              />
            </span>
            <span className="col-unit">Unit</span>
            <span
              className="col-supplier sortable"
              onClick={() => handleSort("supplierId")}
            >
              Supplier
              <Icon
                name={
                  sortConfig.key === "supplierId"
                    ? sortConfig.direction === "asc"
                      ? "arrow_upward"
                      : "arrow_downward"
                    : "unfold_more"
                }
              />
            </span>
            <span
              className="col-status sortable"
              onClick={() => handleSort("status")}
            >
              Status
              <Icon
                name={
                  sortConfig.key === "status"
                    ? sortConfig.direction === "asc"
                      ? "arrow_upward"
                      : "arrow_downward"
                    : "unfold_more"
                }
              />
            </span>
            <span
              className="col-stock sortable"
              onClick={() => handleSort("stock")}
            >
              Stock
              <Icon
                name={
                  sortConfig.key === "stock"
                    ? sortConfig.direction === "asc"
                      ? "arrow_upward"
                      : "arrow_downward"
                    : "unfold_more"
                }
              />
            </span>
            <span className="col-min-stock">Min</span>
            <span
              className="col-price sortable"
              onClick={() => handleSort("price")}
            >
              Price
              <Icon
                name={
                  sortConfig.key === "price"
                    ? sortConfig.direction === "asc"
                      ? "arrow_upward"
                      : "arrow_downward"
                    : "unfold_more"
                }
              />
            </span>
            <span className="col-actions">Actions</span>
          </div>

          {visibleMaterials.map((material) => {
            const qbStatus = getQBStatusIcon(material.qbSyncStatus);
            const statusStyle = getStatusStyle(material.status);
            const isLowStock =
              material.stock <= material.minStock && material.stock > 0;

            return (
              <div key={material.id} className="materials-table-row">
                <span className="col-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedMaterials.includes(material.id)}
                    onChange={() => handleSelectMaterial(material.id)}
                  />
                </span>
                <span className="col-code">{material.code_qb}</span>
                <span className="col-status-qb" title={qbStatus.label}>
                  <Icon
                    name={qbStatus.icon}
                    style={{ color: qbStatus.color, fontSize: "20px" }}
                  />
                </span>
                <span className="col-material">
                  <div className="material-info">
                    <span className="material-name">{material.name}</span>
                    {material.description && (
                      <span className="material-desc">
                        {material.description}
                      </span>
                    )}
                  </div>
                </span>
                <span className="col-category">
                  {getCategoryName(material.categoryId)}
                </span>
                <span className="col-unit">{getUnitName(material.unitId)}</span>
                <span className="col-supplier">
                  {getSupplierName(material.supplierId)}
                </span>
                <span
                  className={`col-status status-badge ${statusStyle.color}`}
                >
                  <span className="status-dot"></span>
                  {statusStyle.label}
                </span>
                <span className={`col-stock ${isLowStock ? "low-stock" : ""}`}>
                  {material.stock}
                  {isLowStock && (
                    <Icon
                      name="warning"
                      style={{
                        color: "#f59e0b",
                        marginLeft: "4px",
                        fontSize: "14px",
                      }}
                    />
                  )}
                </span>
                <span className="col-min-stock">{material.minStock}</span>
                <span className="col-price">${material.price?.toFixed(2)}</span>
                <span className="col-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleView(material)}
                    title="View"
                  >
                    <Icon name="visibility" />
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(material)}
                    title="Edit"
                  >
                    <Icon name="edit" />
                  </button>
                  <button
                    className="btn-icon danger"
                    onClick={() => handleDelete(material)}
                    title="Delete"
                  >
                    <Icon name="delete" />
                  </button>
                </span>
              </div>
            );
          })}

          {visibleMaterials.length === 0 && (
            <div className="materials-empty">
              <Icon name="inventory_2" />
              <p>No materials found</p>
            </div>
          )}
        </div>
      )}

      {/* Infinite scroll sentinel (replaces previous pagination footer) */}
      <InfiniteScrollSentinel
        sentinelRef={materialsSentinelRef}
        hasMore={hasMoreMaterials}
        total={sortedMaterials.length}
        visibleCount={visibleMaterialsCount}
        label="Loading more materials..."
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        title={
          modalMode === "add"
            ? "New Material"
            : modalMode === "edit"
              ? "Edit Material"
              : "Material Details"
        }
        onClose={() => setShowModal(false)}
        icon={
          modalMode === "add"
            ? "add_box"
            : modalMode === "edit"
              ? "edit"
              : "visibility"
        }
        size="large"
        onSave={modalMode !== "view" ? handleSave : undefined}
        saveText={modalMode === "add" ? "Add Material" : "Save Changes"}
        saveDisabled={
          !currentMaterial.name ||
          !currentMaterial.categoryId ||
          !currentMaterial.unitId ||
          !currentMaterial.supplierId
        }
        isViewMode={modalMode === "view"}
      >
        <div
          className="material-form"
          style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "8px" }}
        >
          <div className="form-row">
            <div className="form-group">
              <label>Code QB</label>
              <input
                type="text"
                value={currentMaterial.code_qb}
                onChange={(e) => handleInputChange("code_qb", e.target.value)}
                placeholder="MAT-001"
                disabled={modalMode === "view"}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <div className="status-toggle">
                <button
                  type="button"
                  className={`status-toggle-btn status-active ${currentMaterial.status === "ACTIVE" ? "active" : ""}`}
                  onClick={() =>
                    modalMode !== "view" &&
                    handleInputChange("status", "ACTIVE")
                  }
                  disabled={modalMode === "view"}
                >
                  <span className="status-indicator"></span>
                  <Icon name="check_circle" />
                  Active
                </button>
                <button
                  type="button"
                  className={`status-toggle-btn status-inactive ${currentMaterial.status === "INACTIVE" ? "active" : ""}`}
                  onClick={() =>
                    modalMode !== "view" &&
                    handleInputChange("status", "INACTIVE")
                  }
                  disabled={modalMode === "view"}
                >
                  <span className="status-indicator"></span>
                  <Icon name="cancel" />
                  Inactive
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Material Name *</label>
            <input
              type="text"
              value={currentMaterial.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Material name"
              disabled={modalMode === "view"}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={currentMaterial.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Material description..."
              rows={2}
              disabled={modalMode === "view"}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                value={currentMaterial.categoryId}
                onChange={(e) =>
                  handleInputChange("categoryId", e.target.value)
                }
                disabled={modalMode === "view"}
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Unit *</label>
              <select
                value={currentMaterial.unitId}
                onChange={(e) => handleInputChange("unitId", e.target.value)}
                disabled={modalMode === "view"}
                required
              >
                <option value="">Select unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Supplier *</label>
            <select
              value={currentMaterial.supplierId}
              onChange={(e) => handleInputChange("supplierId", e.target.value)}
              disabled={modalMode === "view"}
              required
            >
              <option value="">Select supplier</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Current Stock</label>
              <input
                type="number"
                value={currentMaterial.stock}
                onChange={(e) =>
                  handleInputChange("stock", Number(e.target.value))
                }
                placeholder="0"
                min="0"
                disabled={modalMode === "view"}
              />
            </div>
            <div className="form-group">
              <label>Minimum Stock</label>
              <input
                type="number"
                value={currentMaterial.minStock}
                onChange={(e) =>
                  handleInputChange("minStock", Number(e.target.value))
                }
                placeholder="0"
                min="0"
                disabled={modalMode === "view"}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Unit Price ($)</label>
            <input
              type="number"
              value={currentMaterial.price}
              onChange={(e) =>
                handleInputChange("price", Number(e.target.value))
              }
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={modalMode === "view"}
            />
          </div>

          {modalMode === "view" && currentMaterial.qbSyncStatus && (
            <div className="form-group">
              <label>QuickBooks Status</label>
              <div className="qb-status-display">
                <Icon
                  name={getQBStatusIcon(currentMaterial.qbSyncStatus).icon}
                  style={{
                    color: getQBStatusIcon(currentMaterial.qbSyncStatus).color,
                  }}
                />
                <span>
                  {getQBStatusIcon(currentMaterial.qbSyncStatus).label}
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        title="Delete Material"
        onClose={() => setShowDeleteConfirm(false)}
        icon="warning"
        size="small"
        variant="danger"
        onSave={confirmDelete}
        saveText="Delete"
        confirmOnClose={false}
      >
        <div className="delete-confirm">
          <p>
            Are you sure you want to delete{" "}
            <strong>{materialToDelete?.name}</strong>?
          </p>
          <p className="text-muted">This action cannot be undone.</p>
        </div>
      </Modal>

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

export default MaterialsModule;
