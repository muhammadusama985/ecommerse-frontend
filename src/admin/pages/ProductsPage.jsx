import { useEffect, useState } from "react";
import { mediaUrl } from "../api/client";
import { createProduct, deleteProduct, getCategories, getProducts, updateProduct, uploadAdminImage } from "../api/admin";
import { useAdmin } from "../context/AdminContext";
import { useLanguage } from "../context/LanguageContext";
import { useAdminNotifications } from "../context/AdminNotificationContext";

const initialForm = {
  name: "",
  categoryId: "",
  shortDescription: "",
  description: "",
  price: "",
  compareAtPrice: "",
  stock: "",
  badge: "",
  isFeatured: false,
  isBestSeller: false,
};

function ProductsPage() {
  const { accessToken } = useAdmin();
  const { t } = useLanguage();
  const { confirm, notify } = useAdminNotifications();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState("");

  useEffect(() => {
    getProducts(accessToken).then(setProducts).catch(() => setProducts([]));
    getCategories(accessToken).then(setCategories).catch(() => setCategories([]));
  }, [accessToken]);

  useEffect(() => {
    if (!selectedImages.length) {
      setPreviews((current) => current.filter((item) => item.persisted));
      return;
    }

    const nextPreviewItems = selectedImages.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      url: URL.createObjectURL(file),
      persisted: false,
      fileId: `${file.name}-${file.size}-${file.lastModified}`,
    }));

    setPreviews((current) => [...current.filter((item) => item.persisted), ...nextPreviewItems]);

    return () => {
      nextPreviewItems.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [selectedImages]);

  const resetForm = () => {
    setForm(initialForm);
    setSelectedImages([]);
    setExistingImages([]);
    setPreviews([]);
    setEditingProductId("");
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const removePreview = (previewItem) => {
    if (previewItem.persisted) {
      setExistingImages((current) => current.filter((image) => image !== previewItem.path));
      setPreviews((current) => current.filter((item) => item.id !== previewItem.id));
      return;
    }

    setSelectedImages((current) => current.filter((file) => `${file.name}-${file.size}-${file.lastModified}` !== previewItem.fileId));
    setPreviews((current) => current.filter((item) => item.id !== previewItem.id));
  };

  const handleDelete = async (productId) => {
    const accepted = await confirm({
      title: t("deleteProduct"),
      message: t("deleteProductConfirm"),
      confirmLabel: t("delete"),
      cancelLabel: t("cancel"),
      danger: true,
    });
    if (!accepted) {
      return;
    }

    await deleteProduct(accessToken, productId);
    setProducts((current) => current.filter((product) => product._id !== productId));
    notify({ type: "success", message: t("productDeletedSuccess") });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const uploadedImages = selectedImages.length
        ? await Promise.all(selectedImages.map((file) => uploadAdminImage(accessToken, "products", file).then((uploaded) => uploaded.path)))
        : [];

      const payload = {
        name: form.name,
        categoryId: form.categoryId,
        shortDescription: form.shortDescription,
        description: form.description,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        stock: form.stock ? Number(form.stock) : 0,
        badge: form.badge || undefined,
        images: [...existingImages, ...uploadedImages].filter(Boolean),
        isFeatured: form.isFeatured,
        isBestSeller: form.isBestSeller,
      };

      const product = editingProductId
        ? await updateProduct(accessToken, editingProductId, payload)
        : await createProduct(accessToken, payload);

      const category = categories.find((item) => item._id === form.categoryId);
      setProducts((current) =>
        editingProductId
          ? current.map((item) => (item._id === editingProductId ? { ...product, categoryId: category || product.categoryId } : item))
          : [{ ...product, categoryId: category || product.categoryId }, ...current],
      );
      notify({ type: "success", message: editingProductId ? t("productUpdatedSuccess") : t("productCreatedSuccess") });
      resetForm();
      setShowModal(false);
    } catch (error) {
      notify({ type: "error", message: error.message || t("saveProductError") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <div>
          <h2>{t("products")}</h2>
          <p>{t("manageProductCatalog")}</p>
        </div>
        <button type="button" className="admin-button" onClick={openCreateModal}>
          {t("addProduct")}
        </button>
      </div>

      <section className="admin-panel admin-table-card">
        <div className="admin-table">
          <div className="admin-table__head admin-table__row admin-table__row--products">
            <span>{t("image")}</span>
            <span>{t("product")}</span>
            <span>{t("categories")}</span>
            <span>{t("price")}</span>
            <span>{t("stock")}</span>
            <span>{t("actions")}</span>
          </div>
          {!products.length ? <div className="admin-table__empty">{t("noDataFound")}</div> : null}
          {products.map((product) => (
            <article key={product._id} className="admin-table__row admin-table__row--products">
              {product.images?.[0] ? (
                <img src={mediaUrl(product.images[0])} alt={product.name} className="admin-thumb" />
              ) : (
                <div className="admin-thumb admin-thumb--placeholder">{t("noImage")}</div>
              )}
              <div className="admin-row-copy">
                <strong>{product.name}</strong>
                <p>{product.shortDescription || product.description || t("noDescriptionAddedYet")}</p>
              </div>
              <span>{product.categoryId?.name || t("uncategorized")}</span>
              <span>AED {Number(product.price).toFixed(2)}</span>
              <span className={Number(product.stock || 0) <= 0 ? "admin-stock-pill admin-stock-pill--danger" : "admin-stock-pill"}>
                {Number(product.stock || 0) <= 0 ? t("outOfStockLabel") : t("stockCountLabel", { count: Number(product.stock || 0) })}
              </span>
              <div className="admin-actions">
                <button
                  type="button"
                  className="admin-button admin-button--ghost"
                  onClick={() => {
                    setEditingProductId(product._id);
                    setForm({
                      name: product.name || "",
                      categoryId: product.categoryId?._id || product.categoryId || "",
                      shortDescription: product.shortDescription || "",
                      description: product.description || "",
                      price: product.price ?? "",
                      compareAtPrice: product.compareAtPrice ?? "",
                      stock: product.stock ?? "",
                      badge: product.badge || "",
                      isFeatured: Boolean(product.isFeatured),
                      isBestSeller: Boolean(product.isBestSeller),
                    });
                    setSelectedImages([]);
                    setExistingImages(product.images || []);
                    setPreviews(
                      (product.images || []).map((image, index) => ({
                        id: `${product._id}-${index}`,
                        url: mediaUrl(image),
                        persisted: true,
                        path: image,
                      })),
                    );
                    setShowModal(true);
                  }}
                >
                  {t("edit")}
                </button>
                <button type="button" className="admin-button admin-button--ghost admin-button--danger" onClick={() => handleDelete(product._id)}>
                  {t("delete")}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {showModal ? (
        <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal__header">
              <div>
                <h3>{editingProductId ? t("editProduct") : t("addProductTitle")}</h3>
                <p>{editingProductId ? t("editProductCopy") : t("addProductCopy")}</p>
              </div>
              <button type="button" className="admin-modal__close" onClick={() => { resetForm(); setShowModal(false); }}>
                {t("close")}
              </button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-grid admin-grid--two">
                <label>
                  {t("productName")}
                  <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                </label>
                <label>
                  {t("categories")}
                  <select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required>
                    <option value="">{t("selectCategory")}</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                {t("shortDescription")}
                <input value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} />
              </label>

              <label>
                {t("fullDescription")}
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </label>

              <div className="admin-grid admin-grid--four">
                <label>
                  {t("price")}
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
                </label>
                <label>
                  {t("compareAtPrice")}
                  <input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={(event) => setForm({ ...form, compareAtPrice: event.target.value })} />
                </label>
                <label>
                  {t("stock")}
                  <input type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} />
                </label>
                <label>
                  {t("badge")}
                  <input value={form.badge} onChange={(event) => setForm({ ...form, badge: event.target.value })} />
                </label>
              </div>

              <div className="admin-upload">
                <label>
                  {t("productImages")}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      const files = Array.from(event.target.files || []);
                      setSelectedImages(files);
                    }}
                  />
                </label>
                {previews.length ? (
                  <div className="admin-upload__preview-grid">
                    {previews.map((previewItem) => (
                      <div key={previewItem.id} className="admin-upload__preview-card">
                        <img src={previewItem.url} alt={t("imagePreview")} className="admin-upload__preview" />
                        <button
                          type="button"
                          className="admin-button admin-button--ghost"
                          onClick={() => removePreview(previewItem)}
                        >
                          {t("remove")}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="admin-upload__preview admin-upload__preview--placeholder">{t("imagePreview")}</div>
                )}
              </div>

              <div className="admin-grid admin-grid--two">
                <label className="checkbox-row">
                  <input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })} />
                  {t("featuredProduct")}
                </label>
                <label className="checkbox-row">
                  <input type="checkbox" checked={form.isBestSeller} onChange={(event) => setForm({ ...form, isBestSeller: event.target.checked })} />
                  {t("bestSeller")}
                </label>
              </div>

              <div className="admin-form__actions">
                <button type="button" className="admin-button admin-button--ghost" onClick={() => { resetForm(); setShowModal(false); }}>
                  {t("cancel")}
                </button>
                <button type="submit" className="admin-button" disabled={isSubmitting}>
                  {isSubmitting ? t("saving") : editingProductId ? t("saveChanges") : t("createProductCta")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export { ProductsPage };
