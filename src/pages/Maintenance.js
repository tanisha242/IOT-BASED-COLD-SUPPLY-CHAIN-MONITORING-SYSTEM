import React, {
  useCallback,
  useEffect,
  useState
} from "react";

import "./Maintenance.css";

const API_BASE = "http://localhost:5000";

export default function Maintenance() {
  const userRole = localStorage.getItem("userRole");

  const isQC =
    userRole === "qc" ||
    userRole === "QC" ||
    userRole === "quality_control";

  const [maintenanceData, setMaintenanceData] = useState([]);
  const [boxes, setBoxes] = useState([]);

  const [selectedBox, setSelectedBox] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const emptyForm = {
    deviceId: "",
    manufacturingDate: "",
    activationDate: "",
    warrantyExpiry: "",
    totalServicesRequired: "",
    nextServiceDate: "",

    serviceDate: "",
    serviceType: "Preventive Maintenance",
    technician: "",
    cost: "",
    remarks: ""
  };

  const [form, setForm] = useState(emptyForm);

  // --------------------------------------------------
  // Fetch maintenance records
  // --------------------------------------------------

  const fetchMaintenance = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/maintenance`
      );

      if (!res.ok) {
        throw new Error(
          "Failed to fetch maintenance data"
        );
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "Invalid maintenance data received"
        );
      }

      setMaintenanceData(data);

      if (data.length > 0) {
        setSelectedBox((currentSelectedBox) => {
          return (
            currentSelectedBox ||
            data[0].deviceId
          );
        });
      }
    } catch (err) {
      console.error(
        "Error fetching maintenance:",
        err
      );

      setError(
        "Unable to load maintenance data."
      );
    }
  }, []);

  // --------------------------------------------------
  // Fetch available boxes
  // --------------------------------------------------

  const fetchBoxes = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/boxes/details`
      );

      if (!res.ok) {
        throw new Error(
          "Failed to fetch boxes"
        );
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setBoxes(data);
      }
    } catch (err) {
      console.error(
        "Error fetching boxes:",
        err
      );

      /*
        This does not stop the maintenance page.
        Existing maintenance records can still be viewed.
      */
    }
  };

  // --------------------------------------------------
  // Delete maintenance record
  // --------------------------------------------------

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      const response = await fetch(
        `${API_BASE}/api/maintenance/${encodeURIComponent(
          deleteTarget
        )}`,
        {
          method: "DELETE"
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to delete maintenance record"
        );
      }

      const remainingData =
        maintenanceData.filter(
          (item) =>
            item.deviceId !== deleteTarget
        );

      setMaintenanceData(remainingData);

      /*
        If the deleted box was currently selected,
        select another available record.
      */
      if (selectedBox === deleteTarget) {
        setSelectedBox(
          remainingData.length > 0
            ? remainingData[0].deviceId
            : null
        );
      }

      setDeleteTarget(null);

    } catch (error) {
      console.error(
        "Delete maintenance error:",
        error
      );

      alert(
        error.message ||
          "Unable to delete maintenance record."
      );
    } finally {
      setDeleting(false);
    }
  };

  // --------------------------------------------------
  // Initial loading
  // --------------------------------------------------

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchMaintenance(),
        fetchBoxes()
      ]);

      setLoading(false);
    };

    loadData();
  }, [fetchMaintenance]);

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );
  };

  const inputDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate
      .toISOString()
      .split("T")[0];
  };

  const getDeviceId = (box) => {
    if (typeof box === "string") {
      return box;
    }

    return (
      box?.deviceId ||
      box?.device_id ||
      box?.boxId ||
      box?.box_id ||
      box?.name ||
      ""
    );
  };

  // --------------------------------------------------
  // Form handling
  // --------------------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // --------------------------------------------------
  // Add maintenance
  // --------------------------------------------------

  const openAddForm = () => {
    if (!isQC) return;

    setEditing(false);

    setForm({
      ...emptyForm
    });

    setShowForm(true);
  };

  // --------------------------------------------------
  // Edit maintenance
  // --------------------------------------------------

  const openEditForm = (record) => {
    if (!isQC) return;

    const services = Array.isArray(
      record.services
    )
      ? record.services
      : [];

    const lastService =
      services.length > 0
        ? [...services].sort(
            (a, b) =>
              new Date(b.serviceDate) -
              new Date(a.serviceDate)
          )[0]
        : null;

    setEditing(true);

    setForm({
      deviceId: record.deviceId || "",

      manufacturingDate:
        inputDate(
          record.manufacturingDate
        ),

      activationDate:
        inputDate(
          record.activationDate
        ),

      warrantyExpiry:
        inputDate(
          record.warrantyExpiry
        ),

      totalServicesRequired:
        record.totalServicesRequired ??
        "",

      nextServiceDate:
        inputDate(
          record.nextServiceDate
        ),

      serviceDate: lastService
        ? inputDate(
            lastService.serviceDate
          )
        : "",

      serviceType:
        lastService?.serviceType ||
        "Preventive Maintenance",

      technician:
        lastService?.technician || "",

      cost:
        lastService?.cost ?? "",

      remarks:
        lastService?.remarks || ""
    });

    setSelectedBox(record.deviceId);
    setShowForm(true);
  };

  const closeForm = () => {
    if (!saving) {
      setShowForm(false);
      setEditing(false);
      setForm(emptyForm);
    }
  };

  // --------------------------------------------------
  // Submit form
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isQC) {
      return;
    }

    if (!form.deviceId) {
      alert(
        "Please select a cold-storage box."
      );
      return;
    }

    try {
      setSaving(true);

      /*
        For a new record, start with the service
        entered in the form.

        For an edit, preserve the existing service
        records and append a new service only when
        QC entered a service date.
      */

      let services = [];

      if (editing) {
        const existingRecord =
          maintenanceData.find(
            (item) =>
              item.deviceId ===
              form.deviceId
          );

        services = Array.isArray(
          existingRecord?.services
        )
          ? [
              ...existingRecord.services
            ]
          : [];
      }

      if (form.serviceDate) {
        services.push({
          serviceDate:
            form.serviceDate,

          serviceType:
            form.serviceType ||
            "Preventive Maintenance",

          technician:
            form.technician || "",

          cost: Number(
            form.cost || 0
          ),

          remarks:
            form.remarks || ""
        });
      }

      const payload = {
        deviceId:
          form.deviceId,

        manufacturingDate:
          form.manufacturingDate,

        activationDate:
          form.activationDate,

        warrantyExpiry:
          form.warrantyExpiry,

        totalServicesRequired:
          Number(
            form.totalServicesRequired ||
              0
          ),

        nextServiceDate:
          form.nextServiceDate ||
          null,

        services
      };

      const url = editing
        ? `${API_BASE}/api/maintenance/${encodeURIComponent(
            form.deviceId
          )}`
        : `${API_BASE}/api/maintenance`;

      const method = editing
        ? "PUT"
        : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify(
          payload
        )
      });

      const result =
        await res.json();

      if (!res.ok) {
        throw new Error(
          result.message ||
            "Failed to save maintenance record"
        );
      }

      alert(
        editing
          ? "Maintenance record updated successfully."
          : "Maintenance record created successfully."
      );

      await fetchMaintenance();

      setSelectedBox(
        form.deviceId
      );

      closeForm();

    } catch (err) {
      console.error(
        "Error saving maintenance:",
        err
      );

      alert(
        err.message ||
          "Unable to save maintenance record."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="maintenance-page">
        <div className="maintenance-loading">
          <div className="maintenance-spinner"></div>

          <p>
            Loading maintenance data...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Error
  // --------------------------------------------------

  if (error) {
    return (
      <div className="maintenance-page">
        <div className="maintenance-error">

          <h3>
            Unable to Load Maintenance Data
          </h3>

          <p>{error}</p>

          <button
            className="maintenance-primary-button"
            onClick={fetchMaintenance}
          >
            Retry
          </button>

        </div>
      </div>
    );
  }

  const data =
    maintenanceData.find(
      (item) =>
        item.deviceId === selectedBox
    );

  // --------------------------------------------------
  // Empty state
  // --------------------------------------------------

  if (maintenanceData.length === 0) {
    return (
      <div className="maintenance-page">

        <div className="maintenance-header">

          <div>
            <span className="maintenance-eyebrow">
              ASSET MANAGEMENT
            </span>

            <h1>Maintenance</h1>

            <p>
              Monitor service history, warranty
              information and maintenance schedules
              for cold-storage boxes.
            </p>
          </div>

          {isQC && (
            <button
              className="maintenance-primary-button"
              onClick={openAddForm}
            >
              + Add Maintenance
            </button>
          )}

        </div>

        <div className="maintenance-empty">

          <div className="maintenance-empty-icon">
            🔧
          </div>

          <h2>
            No Maintenance Records
          </h2>

          <p>
            No maintenance records have been
            added yet.
          </p>

          {isQC && (
            <button
              className="maintenance-primary-button"
              onClick={openAddForm}
            >
              + Add First Record
            </button>
          )}

        </div>

        {showForm && (
          <MaintenanceForm
            form={form}
            boxes={boxes}
            maintenanceData={
              maintenanceData
            }
            editing={editing}
            saving={saving}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            closeForm={closeForm}
            getDeviceId={getDeviceId}
          />
        )}

      </div>
    );
  }

  if (!data) {
    return (
      <div className="maintenance-page">

        <div className="maintenance-empty">
          <h2>
            Select a maintenance record
          </h2>
        </div>

      </div>
    );
  }

  // --------------------------------------------------
  // Calculate service information
  // --------------------------------------------------

  const services =
    Array.isArray(data.services)
      ? data.services
      : [];

  const servicesCompleted =
    services.length;

  const totalServices =
    Number(
      data.totalServicesRequired || 0
    );

  const servicesRemaining =
    Math.max(
      0,
      totalServices -
        servicesCompleted
    );

  const serviceProgress =
    totalServices > 0
      ? Math.min(
          100,
          Math.round(
            (servicesCompleted /
              totalServices) *
              100
          )
        )
      : 0;

  const sortedServices =
    [...services].sort(
      (a, b) =>
        new Date(b.serviceDate) -
        new Date(a.serviceDate)
    );

  const lastService =
    sortedServices.length > 0
      ? sortedServices[0]
      : null;

  // --------------------------------------------------
  // Main UI
  // --------------------------------------------------

  return (
    <div className="maintenance-page">

      {/* Header */}

      <div className="maintenance-header">

        <div>
          <span className="maintenance-eyebrow">
            ASSET MANAGEMENT
          </span>

          <h1>
            Maintenance
          </h1>

          <p>
            Track service history, warranty status
            and maintenance schedules for your
            cold-storage boxes.
          </p>
        </div>

        {isQC && (
          <button
            className="maintenance-primary-button"
            onClick={openAddForm}
          >
            + Add Maintenance
          </button>
        )}

      </div>

      {/* Box selector */}

      <div className="maintenance-box-selector">

        <div className="maintenance-section-label">
          COLD STORAGE BOX
        </div>

        <div className="maintenance-box-list">

          {maintenanceData.map(
            (box) => (
              <button
                key={box.deviceId}
                className={`maintenance-box-button ${
                  selectedBox ===
                  box.deviceId
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setSelectedBox(
                    box.deviceId
                  )
                }
              >

                <span className="maintenance-box-icon">
                  ❄️
                </span>

                <span>
                  {box.deviceId}
                </span>

              </button>
            )
          )}

        </div>

      </div>

      {/* Record header */}

      <div className="maintenance-box-header">

        <div>

          <span className="maintenance-eyebrow">
            MAINTENANCE RECORD
          </span>

          <h2>
            {data.deviceId}
          </h2>

          <p>
            Cold-storage equipment maintenance
            information
          </p>

        </div>

        <div className="maintenance-header-actions">

          <div className="maintenance-status">
            <span className="maintenance-status-dot"></span>
            Active Record
          </div>

          {isQC && (
            <>
              <button
                className="maintenance-secondary-button"
                onClick={() =>
                  openEditForm(data)
                }
              >
                ✏ Edit Record
              </button>

              <button
                className="maintenance-delete-button"
                onClick={() =>
                  setDeleteTarget(
                    data.deviceId
                  )
                }
              >
                🗑 Delete Record
              </button>
            </>
          )}

        </div>

      </div>

      {/* Summary cards */}

      <div className="maintenance-summary-grid">

        <div className="maintenance-card">

          <div className="maintenance-card-icon">
            🏭
          </div>

          <div>
            <span className="maintenance-card-label">
              Manufacturing Date
            </span>

            <strong>
              {formatDate(
                data.manufacturingDate
              )}
            </strong>
          </div>

        </div>

        <div className="maintenance-card">

          <div className="maintenance-card-icon">
            📅
          </div>

          <div>
            <span className="maintenance-card-label">
              Activation Date
            </span>

            <strong>
              {formatDate(
                data.activationDate
              )}
            </strong>
          </div>

        </div>

        <div className="maintenance-card">

          <div className="maintenance-card-icon">
            🛡
          </div>

          <div>
            <span className="maintenance-card-label">
              Warranty Expiry
            </span>

            <strong>
              {formatDate(
                data.warrantyExpiry
              )}
            </strong>
          </div>

        </div>

        <div className="maintenance-card">

          <div className="maintenance-card-icon">
            ✓
          </div>

          <div>
            <span className="maintenance-card-label">
              Services Completed
            </span>

            <strong>
              {servicesCompleted}
            </strong>
          </div>

        </div>

        <div className="maintenance-card">

          <div className="maintenance-card-icon">
            🔧
          </div>

          <div>
            <span className="maintenance-card-label">
              Services Remaining
            </span>

            <strong>
              {servicesRemaining}
            </strong>
          </div>

        </div>

        <div className="maintenance-card">

          <div className="maintenance-card-icon">
            🕒
          </div>

          <div>
            <span className="maintenance-card-label">
              Last Service
            </span>

            <strong>
              {lastService
                ? formatDate(
                    lastService.serviceDate
                  )
                : "No service yet"}
            </strong>
          </div>

        </div>

        <div className="maintenance-card">

          <div className="maintenance-card-icon">
            📆
          </div>

          <div>
            <span className="maintenance-card-label">
              Next Service
            </span>

            <strong>
              {formatDate(
                data.nextServiceDate
              )}
            </strong>
          </div>

        </div>

      </div>

      {/* Progress */}

      <div className="maintenance-panel">

        <div className="maintenance-panel-header">

          <div>

            <span className="maintenance-eyebrow">
              SERVICE LIFECYCLE
            </span>

            <h3>
              Maintenance Progress
            </h3>

          </div>

          <strong>
            {servicesCompleted} /{" "}
            {totalServices}
          </strong>

        </div>

        <div className="maintenance-progress-container">

          <div className="maintenance-progress-bar">

            <div
              className="maintenance-progress-fill"
              style={{
                width: `${serviceProgress}%`
              }}
            ></div>

          </div>

          <div className="maintenance-progress-labels">

            <span>
              {serviceProgress}%
              {" "}completed
            </span>

            <span>
              {servicesRemaining}{" "}
              services remaining
            </span>

          </div>

        </div>

      </div>

      {/* Upcoming maintenance */}

      <div className="maintenance-panel">

        <div className="maintenance-panel-header">

          <div>

            <span className="maintenance-eyebrow">
              UPCOMING
            </span>

            <h3>
              Next Scheduled Maintenance
            </h3>

          </div>

        </div>

        <div className="maintenance-upcoming">

          <div className="maintenance-upcoming-icon">
            🔧
          </div>

          <div>

            <span className="maintenance-card-label">
              Scheduled Service Date
            </span>

            <strong>
              {formatDate(
                data.nextServiceDate
              )}
            </strong>

          </div>

        </div>

      </div>

      {/* Service history */}

      <div className="maintenance-panel">

        <div className="maintenance-panel-header">

          <div>

            <span className="maintenance-eyebrow">
              SERVICE HISTORY
            </span>

            <h3>
              Completed Services
            </h3>

          </div>

          <span className="maintenance-service-count">
            {servicesCompleted} Records
          </span>

        </div>

        {services.length === 0 ? (

          <div className="maintenance-no-services">

            <div className="maintenance-empty-icon">
              📋
            </div>

            <p>
              No completed services have been
              recorded yet.
            </p>

          </div>

        ) : (

          <div className="maintenance-service-list">

            {sortedServices.map(
              (service, index) => (

                <div
                  className="maintenance-service-item"
                  key={
                    service._id ||
                    `${service.serviceDate}-${index}`
                  }
                >

                  <div className="maintenance-service-date">

                    <span>
                      {formatDate(
                        service.serviceDate
                      )}
                    </span>

                  </div>

                  <div className="maintenance-service-info">

                    <strong>
                      {service.serviceType ||
                        "Preventive Maintenance"}
                    </strong>

                    <span>
                      Technician:{" "}
                      {service.technician ||
                        "—"}
                    </span>

                    {service.remarks && (
                      <p>
                        {service.remarks}
                      </p>
                    )}

                  </div>

                  <div className="maintenance-service-cost">

                    <span>
                      Cost
                    </span>

                    <strong>
                      ₹
                      {Number(
                        service.cost || 0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* QC form */}

      {showForm && (
        <MaintenanceForm
          form={form}
          boxes={boxes}
          maintenanceData={
            maintenanceData
          }
          editing={editing}
          saving={saving}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          closeForm={closeForm}
          getDeviceId={getDeviceId}
        />
      )}

      {/* Delete confirmation dialog */}

      {deleteTarget && (
        <div className="maintenance-delete-overlay">

          <div className="maintenance-delete-dialog">

            <div className="maintenance-delete-icon">
              🗑
            </div>

            <h3>
              Delete Maintenance Record?
            </h3>

            <p>
              Are you sure you want to delete
              the maintenance record for:
            </p>

            <strong className="maintenance-delete-device">
              {deleteTarget}
            </strong>

            <p className="maintenance-delete-warning">
              This will permanently remove the
              maintenance record and its service
              history.
            </p>

            <div className="maintenance-delete-actions">

              <button
                className="maintenance-cancel-button"
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                className="maintenance-confirm-delete-button"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Record"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}


/*
=====================================================
QC MAINTENANCE FORM
=====================================================
*/

function MaintenanceForm({
  form,
  boxes,
  maintenanceData,
  editing,
  saving,
  handleChange,
  handleSubmit,
  closeForm,
  getDeviceId
}) {
  return (
    <div className="maintenance-form-overlay">

      <div className="maintenance-form-modal">

        <div className="maintenance-form-header">

          <div>

            <span className="maintenance-eyebrow">
              QC MANAGEMENT
            </span>

            <h2>
              {editing
                ? "Edit Maintenance Record"
                : "Add Maintenance Record"}
            </h2>

            <p>
              Enter maintenance and service
              information for the cold-storage box.
            </p>

          </div>

          <button
            type="button"
            className="maintenance-form-close"
            onClick={closeForm}
            disabled={saving}
          >
            ×
          </button>

        </div>

        <form
          className="maintenance-form"
          onSubmit={handleSubmit}
        >

          {/* Device */}

          <div className="maintenance-form-section">

            <h3>
              Equipment Information
            </h3>

            <div className="maintenance-form-grid">

              <div className="maintenance-form-field">

                <label>
                  Cold Storage Box *
                </label>

                {editing ? (

                  <input
                    type="text"
                    value={form.deviceId}
                    disabled
                  />

                ) : (

                  <select
                    name="deviceId"
                    value={form.deviceId}
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Select a box
                    </option>

                    {boxes.map(
                      (box, index) => {

                        const deviceId =
                          getDeviceId(box);

                        if (!deviceId) {
                          return null;
                        }

                        return (
                          <option
                            key={`${deviceId}-${index}`}
                            value={deviceId}
                          >
                            {deviceId}
                          </option>
                        );
                      }
                    )}

                    {/* Existing maintenance IDs are
                        also shown if the boxes API
                        doesn't contain them. */}

                    {maintenanceData.map(
                      (record) => {

                        const exists =
                          boxes.some(
                            (box) =>
                              getDeviceId(
                                box
                              ) ===
                              record.deviceId
                          );

                        if (exists) {
                          return null;
                        }

                        return (
                          <option
                            key={
                              record.deviceId
                            }
                            value={
                              record.deviceId
                            }
                          >
                            {record.deviceId}
                          </option>
                        );
                      }
                    )}

                  </select>

                )}

              </div>

              <div className="maintenance-form-field">

                <label>
                  Total Services Required *
                </label>

                <input
                  type="number"
                  name="totalServicesRequired"
                  min="0"
                  value={
                    form.totalServicesRequired
                  }
                  onChange={handleChange}
                  required
                />

              </div>

            </div>

          </div>

          {/* Dates */}

          <div className="maintenance-form-section">

            <h3>
              Dates & Warranty
            </h3>

            <div className="maintenance-form-grid">

              <div className="maintenance-form-field">

                <label>
                  Manufacturing Date *
                </label>

                <input
                  type="date"
                  name="manufacturingDate"
                  value={
                    form.manufacturingDate
                  }
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="maintenance-form-field">

                <label>
                  Activation Date *
                </label>

                <input
                  type="date"
                  name="activationDate"
                  value={
                    form.activationDate
                  }
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="maintenance-form-field">

                <label>
                  Warranty Expiry *
                </label>

                <input
                  type="date"
                  name="warrantyExpiry"
                  value={
                    form.warrantyExpiry
                  }
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="maintenance-form-field">

                <label>
                  Next Service Date
                </label>

                <input
                  type="date"
                  name="nextServiceDate"
                  value={
                    form.nextServiceDate
                  }
                  onChange={handleChange}
                />

              </div>

            </div>

          </div>

          {/* Service */}

          <div className="maintenance-form-section">

            <h3>
              Service Details
            </h3>

            <p className="maintenance-form-help">
              Enter service information when a
              maintenance service has been completed.
            </p>

            <div className="maintenance-form-grid">

              <div className="maintenance-form-field">

                <label>
                  Service Date
                </label>

                <input
                  type="date"
                  name="serviceDate"
                  value={
                    form.serviceDate
                  }
                  onChange={handleChange}
                />

              </div>

              <div className="maintenance-form-field">

                <label>
                  Service Type
                </label>

                <select
                  name="serviceType"
                  value={
                    form.serviceType
                  }
                  onChange={handleChange}
                >

                  <option>
                    Preventive Maintenance
                  </option>

                  <option>
                    Corrective Maintenance
                  </option>

                  <option>
                    Inspection
                  </option>

                  <option>
                    Sensor Calibration
                  </option>

                  <option>
                    Other
                  </option>

                </select>

              </div>

              <div className="maintenance-form-field">

                <label>
                  Technician
                </label>

                <input
                  type="text"
                  name="technician"
                  placeholder="Technician name"
                  value={
                    form.technician
                  }
                  onChange={handleChange}
                />

              </div>

              <div className="maintenance-form-field">

                <label>
                  Cost (₹)
                </label>

                <input
                  type="number"
                  name="cost"
                  min="0"
                  placeholder="0"
                  value={
                    form.cost
                  }
                  onChange={handleChange}
                />

              </div>

            </div>

            <div className="maintenance-form-field">

              <label>
                Remarks
              </label>

              <textarea
                name="remarks"
                rows="4"
                placeholder="Enter service observations, repairs, sensor checks, etc."
                value={
                  form.remarks
                }
                onChange={handleChange}
              />

            </div>

          </div>

          {/* Buttons */}

          <div className="maintenance-form-actions">

            <button
              type="button"
              className="maintenance-cancel-button"
              onClick={closeForm}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="maintenance-primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editing
                ? "Update Record"
                : "Save Record"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}