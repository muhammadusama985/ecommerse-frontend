import { useState } from "react";
import { Link } from "react-router-dom";
import { addAddress, removeAddress, updateProfile } from "../api/users";
import { useLanguage } from "../context/LanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { useShop } from "../context/ShopContext";

function ProfilePage() {
  const { t } = useLanguage();
  const { accessToken, user, isAuthenticated, setUser, refreshSessionData } = useShop();
  const { notify } = useNotifications();
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
  });
  const [addressForm, setAddressForm] = useState({
    label: "",
    fullName: user ? `${user.firstName} ${user.lastName}` : "",
    phone: user?.phone || "",
    country: "UAE",
    city: "",
    area: "",
    addressLine1: "",
    addressLine2: "",
    postalCode: "",
    isDefault: false,
  });
  const [message, setMessage] = useState("");

  if (!isAuthenticated) {
    return (
      <section className="empty-panel">
        <h1>{t("loginRequired")}</h1>
        <p>{t("manageProfileCopy")}</p>
        <Link to="/login" className="solid-button">{t("goToLogin")}</Link>
      </section>
    );
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    try {
      const nextUser = await updateProfile(accessToken, profileForm);
      setUser(nextUser);
      setMessage(t("profileUpdatedSuccess"));
      notify({ type: "success", message: t("profileUpdatedSuccess") });
    } catch (error) {
      setMessage(error.message);
      notify({ type: "error", message: error.message || t("couldNotUpdateProfile") });
    }
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    try {
      await addAddress(accessToken, addressForm);
      await refreshSessionData();
      setMessage(t("addressAddedSuccess"));
      notify({ type: "success", message: t("addressAddedSuccess") });
      setAddressForm({
        label: "",
        fullName: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
        phone: profileForm.phone,
        country: "UAE",
        city: "",
        area: "",
        addressLine1: "",
        addressLine2: "",
        postalCode: "",
        isDefault: false,
      });
    } catch (error) {
      setMessage(error.message);
      notify({ type: "error", message: error.message || t("couldNotAddAddress") });
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await removeAddress(accessToken, addressId);
      await refreshSessionData();
      notify({ type: "success", message: t("addressRemovedSuccess") });
    } catch (error) {
      notify({ type: "error", message: error.message || t("couldNotRemoveAddress") });
    }
  };

  return (
    <div className="profile-layout">
      <section className="profile-panel profile-panel--primary">
        <div className="section-header section-header--left">
          <span className="section-eyebrow">{t("profile")}</span>
          <h1>{t("yourAccount")}</h1>
          <p>{t("manageProfileCopy")}</p>
        </div>
        <form className="auth-form auth-form--two-col auth-form--nested" onSubmit={handleProfileSubmit}>
          <label>
            {t("firstName")}
            <input value={profileForm.firstName} onChange={(event) => setProfileForm({ ...profileForm, firstName: event.target.value })} />
          </label>
          <label>
            {t("lastName")}
            <input value={profileForm.lastName} onChange={(event) => setProfileForm({ ...profileForm, lastName: event.target.value })} />
          </label>
          <label className="auth-form__wide">
            {t("phone")}
            <input value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} />
          </label>
          <button type="submit" className="solid-button auth-form__wide">{t("saveProfile")}</button>
        </form>
      </section>

      <section className="profile-panel profile-panel--secondary">
        <div className="section-header section-header--left">
          <span className="section-eyebrow">{t("addresses")}</span>
          <h2>{t("savedAddresses")}</h2>
        </div>
        <div className="address-list">
          {(user?.addresses || []).map((address) => (
            <article key={address._id} className="address-card address-card--static">
              <div>
                <strong>{address.fullName} {address.isDefault ? t("defaultAddress") : ""}</strong>
                <p>{address.addressLine1}, {address.city}, {address.country}</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => handleDeleteAddress(address._id)}>{t("remove")}</button>
            </article>
          ))}
        </div>
        <form className="auth-form auth-form--two-col auth-form--nested" onSubmit={handleAddressSubmit}>
          <label>
            {t("label")}
            <input value={addressForm.label} onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })} />
          </label>
          <label>
            {t("fullName")}
            <input value={addressForm.fullName} onChange={(event) => setAddressForm({ ...addressForm, fullName: event.target.value })} required />
          </label>
          <label>
            {t("phone")}
            <input value={addressForm.phone} onChange={(event) => setAddressForm({ ...addressForm, phone: event.target.value })} required />
          </label>
          <label>
            {t("city")}
            <input value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })} required />
          </label>
          <label className="auth-form__wide">
            {t("addressLine1")}
            <input value={addressForm.addressLine1} onChange={(event) => setAddressForm({ ...addressForm, addressLine1: event.target.value })} required />
          </label>
          <label>
            {t("area")}
            <input value={addressForm.area} onChange={(event) => setAddressForm({ ...addressForm, area: event.target.value })} />
          </label>
          <label>
            {t("postalCode")}
            <input value={addressForm.postalCode} onChange={(event) => setAddressForm({ ...addressForm, postalCode: event.target.value })} />
          </label>
          <label className="auth-form__wide checkbox-row">
            <input type="checkbox" checked={addressForm.isDefault} onChange={(event) => setAddressForm({ ...addressForm, isDefault: event.target.checked })} />
            <span>{t("makeDefaultAddress")}</span>
          </label>
          {message ? <p className="feedback-note auth-form__wide">{message}</p> : null}
          <button type="submit" className="solid-button auth-form__wide">{t("addAddress")}</button>
        </form>
      </section>
    </div>
  );
}

export { ProfilePage };
