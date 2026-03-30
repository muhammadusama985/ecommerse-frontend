import { useEffect, useState } from "react";
import { getSettings, updateSetting } from "../api/admin";
import { useAdmin } from "../context/AdminContext";
import { useLanguage } from "../context/LanguageContext";

function SettingsPage() {
  const { accessToken } = useAdmin();
  const { t } = useLanguage();
  const [settings, setSettings] = useState([]);

  useEffect(() => {
    getSettings(accessToken).then(setSettings).catch(() => setSettings([]));
  }, [accessToken]);

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2>{t("settings")}</h2>
          <p>{t("settingsPageCopy")}</p>
        </div>
      </div>

      <section className="admin-panel admin-table-card">
        <div className="admin-table">
        <div className="admin-table__head admin-table__row admin-table__row--setting">
          <span>{t("key")}</span>
          <span>{t("value")}</span>
          <span>{t("actions")}</span>
        </div>
        {!settings.length ? <div className="admin-table__empty">{t("noDataFound")}</div> : null}
        {settings.map((setting) => (
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
            <span></span>
            <button
              type="button"
              className="admin-button"
              onClick={async () => {
                const updated = await updateSetting(accessToken, setting.key, setting.value);
                setSettings((current) => current.map((item) => (item._id === setting._id ? updated : item)));
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
