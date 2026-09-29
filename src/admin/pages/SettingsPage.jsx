import { useEffect, useState } from "react";
import { getSettings, updateSetting } from "../api/admin";
import { AdminLoading } from "../components/LoadingState";
import { useAdmin } from "../context/AdminContext";
import { useLanguage } from "../context/LanguageContext";
import { useAdminNotifications } from "../context/AdminNotificationContext";

function SettingsPage() {
  const { accessToken } = useAdmin();
  const { t } = useLanguage();
  const { notify } = useAdminNotifications();
  const [settings, setSettings] = useState([]);
  const [aramexSettings, setAramexSettings] = useState({
    ARAMEX_USERNAME: "",
    ARAMEX_PASSWORD: "",
    ARAMEX_ACCOUNT_NUMBER: "",
    ARAMEX_ACCOUNT_PIN: "",
    ARAMEX_ACCOUNT_ENTITY: "",
    ARAMEX_ACCOUNT_COUNTRY_CODE: "AE",
    ARAMEX_SHIPPER_NAME: "Nature Republic",
    ARAMEX_SHIPPER_COMPANY: "Nature Republic",
    ARAMEX_SHIPPER_PHONE: "",
    ARAMEX_SHIPPER_EMAIL: "",
    ARAMEX_SHIPPER_ADDRESS_LINE1: "",
    ARAMEX_SHIPPER_CITY: "",
    ARAMEX_SHIPPER_COUNTRY_CODE: "AE",
    ARAMEX_SHIPPER_POSTAL_CODE: "",
    ARAMEX_BASE_URL: "https://ws.uat.aramex.net",
  });
  const [isSavingAramex, setIsSavingAramex] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getSettings(accessToken)
      .then(setSettings)
      .catch(() => setSettings([]))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  // Map backend env keys to the form state
  useEffect(() => {
    const map = {};
    settings.forEach((setting) => {
      if (setting.key.startsWith("ARAMEX_")) {
        map[setting.key] = typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value);
      }
    });
    if (Object.keys(map).length > 0) {
      setAramexSettings((prev) => ({ ...prev, ...map }));
    }
  }, [settings]);

  const handleSaveAramexSetting = async (key, value) => {
    try {
      await updateSetting(accessToken, key, value);
      notify({ type: "success", message: `${key} saved successfully.` });
    } catch {
      notify({ type: "error", message: `Failed to save ${key}.` });
    }
  };

  const handleSaveAllAramex = async () => {
    setIsSavingAramex(true);
    try {
      for (const [key, value] of Object.entries(aramexSettings)) {
        await updateSetting(accessToken, key, value);
      }
      notify({ type: "success", message: "All Aramex settings saved successfully." });
    } catch (error) {
      notify({ type: "error", message: error.message || "Failed to save Aramex settings." });
    } finally {
      setIsSavingAramex(false);
    }
  };

  const handleAramexInputChange = (key, value) => {
    setAramexSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2>{t("settings")}</h2>
          <p>{t("settingsPageCopy")}</p>
        </div>
      </div>

      {/* Aramex Shipping Settings */}
      <section className="admin-panel admin-table-card">
        <div className="admin-panel__header">
          <h3>Aramex Shipping Configuration</h3>
          <p>Configure your Aramex account credentials and shipper details. These are used for rate calculation, shipment creation, and tracking.</p>
        </div>
        <div className="aramex-settings-grid">
          <div className="aramex-settings-section">
            <h4>Account Credentials</h4>
            <div className="aramex-settings-field">
              <label>Base URL</label>
              <select
                value={aramexSettings.ARAMEX_BASE_URL}
                onChange={(e) => handleAramexInputChange("ARAMEX_BASE_URL", e.target.value)}
              >
                <option value="https://ws.uat.aramex.net">UAT (Testing) - ws.uat.aramex.net</option>
                <option value="https://ws.aramex.net">Production - ws.aramex.net</option>
              </select>
            </div>
            <div className="aramex-settings-field">
              <label>Username</label>
              <input
                type="text"
                value={aramexSettings.ARAMEX_USERNAME}
                onChange={(e) => handleAramexInputChange("ARAMEX_USERNAME", e.target.value)}
                placeholder="Your Aramex API username"
              />
            </div>
            <div className="aramex-settings-field">
              <label>Password</label>
              <input
                type="password"
                value={aramexSettings.ARAMEX_PASSWORD}
                onChange={(e) => handleAramexInputChange("ARAMEX_PASSWORD", e.target.value)}
                placeholder="Your Aramex API password"
              />
            </div>
            <div className="aramex-settings-field">
              <label>Account Number</label>
              <input
                type="text"
                value={aramexSettings.ARAMEX_ACCOUNT_NUMBER}
                onChange={(e) => handleAramexInputChange("ARAMEX_ACCOUNT_NUMBER", e.target.value)}
                placeholder="e.g., 12345678"
              />
            </div>
            <div className="aramex-settings-field">
              <label>Account PIN</label>
              <input
                type="password"
                value={aramexSettings.ARAMEX_ACCOUNT_PIN}
                onChange={(e) => handleAramexInputChange("ARAMEX_ACCOUNT_PIN", e.target.value)}
                placeholder="Your Aramex account PIN"
              />
            </div>
            <div className="aramex-settings-field">
              <label>Account Entity</label>
              <input
                type="text"
                value={aramexSettings.ARAMEX_ACCOUNT_ENTITY}
                onChange={(e) => handleAramexInputChange("ARAMEX_ACCOUNT_ENTITY", e.target.value)}
                placeholder="e.g., DXB"
              />
            </div>
            <div className="aramex-settings-field">
              <label>Account Country Code</label>
              <input
                type="text"
                value={aramexSettings.ARAMEX_ACCOUNT_COUNTRY_CODE}
                onChange={(e) => handleAramexInputChange("ARAMEX_ACCOUNT_COUNTRY_CODE", e.target.value)}
                placeholder="e.g., AE"
                maxLength={2}
              />
            </div>
          </div>

          <div className="aramex-settings-section">
            <h4>Shipper Details (Warehouse/Origin Address)</h4>
            <div className="aramex-settings-field">
              <label>Shipper Name</label>
              <input
                type="text"
                value={aramexSettings.ARAMEX_SHIPPER_NAME}
                onChange={(e) => handleAramexInputChange("ARAMEX_SHIPPER_NAME", e.target.value)}
                placeholder="Contact name or company name"
              />
            </div>
            <div className="aramex-settings-field">
              <label>Shipper Company</label>
              <input
                type="text"
                value={aramexSettings.ARAMEX_SHIPPER_COMPANY}
                onChange={(e) => handleAramexInputChange("ARAMEX_SHIPPER_COMPANY", e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div className="aramex-settings-field">
              <label>Shipper Phone</label>
              <input
                type="text"
                value={aramexSettings.ARAMEX_SHIPPER_PHONE}
                onChange={(e) => handleAramexInputChange("ARAMEX_SHIPPER_PHONE", e.target.value)}
                placeholder="e.g., 971501234567"
              />
            </div>
            <div className="aramex-settings-field">
              <label>Shipper Email</label>
              <input
                type="email"
                value={aramexSettings.ARAMEX_SHIPPER_EMAIL}
                onChange={(e) => handleAramexInputChange("ARAMEX_SHIPPER_EMAIL", e.target.value)}
                placeholder="shipper@example.com"
              />
            </div>
            <div className="aramex-settings-field">
              <label>Shipper Address Line 1</label>
              <input
                type="text"
                value={aramexSettings.ARAMEX_SHIPPER_ADDRESS_LINE1}
                onChange={(e) => handleAramexInputChange("ARAMEX_SHIPPER_ADDRESS_LINE1", e.target.value)}
                placeholder="Street address"
              />
            </div>
            <div className="aramex-settings-field">
              <label>Shipper City</label>
              <input
                type="text"
                value={aramexSettings.ARAMEX_SHIPPER_CITY}
                onChange={(e) => handleAramexInputChange("ARAMEX_SHIPPER_CITY", e.target.value)}
                placeholder="e.g., Dubai"
              />
            </div>
            <div className="aramex-settings-field">
              <label>Shipper Country Code</label>
              <input
                type="text"
                value={aramexSettings.ARAMEX_SHIPPER_COUNTRY_CODE}
                onChange={(e) => handleAramexInputChange("ARAMEX_SHIPPER_COUNTRY_CODE", e.target.value)}
                placeholder="e.g., AE"
                maxLength={2}
              />
            </div>
            <div className="aramex-settings-field">
              <label>Shipper Postal Code</label>
              <input
                type="text"
                value={aramexSettings.ARAMEX_SHIPPER_POSTAL_CODE}
                onChange={(e) => handleAramexInputChange("ARAMEX_SHIPPER_POSTAL_CODE", e.target.value)}
                placeholder="Postal/ZIP code"
              />
            </div>
          </div>
        </div>
        <div className="aramex-settings-actions">
          <button
            type="button"
            className="admin-button admin-button--primary"
            onClick={handleSaveAllAramex}
            disabled={isSavingAramex}
          >
            {isSavingAramex ? "Saving..." : "Save All Aramex Settings"}
          </button>
        </div>
      </section>

      {/* General Settings */}
      <section className="admin-panel admin-table-card">
        <div className="admin-panel__header">
          <h3>General Settings</h3>
          <p>Configure other application settings.</p>
        </div>
        <div className="admin-table">
          <div className="admin-table__head admin-table__row admin-table__row--setting">
            <span>{t("key")}</span>
            <span>{t("value")}</span>
            <span>{t("actions")}</span>
          </div>
          {isLoading ? (
            <AdminLoading variant="table" label={t("loadingSettings")} count={5} />
          ) : !settings.length ? (
            <div className="admin-table__empty">{t("noDataFound")}</div>
          ) : null}
          {settings
            .filter((setting) => !setting.key.startsWith("ARAMEX_"))
            .map((setting) => (
              <article key={setting._id} className="admin-table__row admin-table__row--setting">
                <span>{setting.key}</span>
                <input
                  value={typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value)}
                  onChange={(event) =>
                    setSettings((current) =>
                      current.map((item) => (item._id === setting._id ? { ...item, value: event.target.value } : item)),
                    )
                  }
                />
                <button
                  type="button"
                  className="admin-button"
                  onClick={async () => {
                    try {
                      const updated = await updateSetting(accessToken, setting.key, setting.value);
                      setSettings((current) => current.map((item) => (item._id === setting._id ? updated : item)));
                      notify({ type: "success", message: `${setting.key} saved successfully.` });
                    } catch {
                      notify({ type: "error", message: `Failed to save ${setting.key}.` });
                    }
                  }}
                >
                  {t("save")}
                </button>
              </article>
            ))}
        </div>
      </section>
    </section>
  );
}

export { SettingsPage };