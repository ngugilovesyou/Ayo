import { useEffect, useState } from "react";
import Modal from "./Modal";
import { Image as ImageIcon, Video as VideoIcon, Plus, X } from "lucide-react";

const EMPTY = {
  name: "",
  description: "",
  price: "",
  quantity: "",
  is_active: true,
  images: [""],
  videos: [""],
};

export default function ProductForm({ open, onClose, onSubmit, initial, saving }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (open) {
      setErrors([]);
      if (initial) {
        setForm({
          name: initial.name,
          description: initial.description,
          price: String(initial.price),
          quantity: String(initial.quantity),
          is_active: initial.is_active,
          images: initial.images?.length ? initial.images.map((i) => i.url) : [""],
          videos: initial.videos?.length
  ? initial.videos.map((v) => v.video_url ?? v.url ?? "")
  : [""],
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, initial]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const setImage = (idx, value) => {
    setForm((f) => {
      const images = [...f.images];
      images[idx] = value;
      return { ...f, images };
    });
  };
  const addImage = () => setForm((f) => ({ ...f, images: [...f.images, ""] }));
  const removeImage = (idx) => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  const setVideo = (idx, value) => {
  setForm((f) => {
    const videos = [...f.videos];
    videos[idx] = value;
    return { ...f, videos };
  });
};
  const addVideo = () => setForm((f) => ({ ...f, videos: [...f.videos, ""] }));
const removeVideo = (idx) => setForm((f) => ({ ...f, videos: f.videos.filter((_, i) => i !== idx) }));

  const validate = () => {
    const errs = [];
    if (!form.name.trim()) errs.push("Name is required");
    if (!form.description.trim()) errs.push("Description is required");
    if (!form.price || Number(form.price) < 0) errs.push("Price must be a valid non-negative number");
    if (form.quantity !== "" && Number(form.quantity) < 0) errs.push("Quantity cannot be negative");
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity || 0),
      is_active: form.is_active,
      images: form.images.map((i) => i.trim()).filter(Boolean),
     videos: form.videos.map((v) => v.trim()).filter(Boolean),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit product" : "New product"}
      subtitle={initial ? `Updating "${initial.name}"` : "Add a product to the catalogue"}
      width="620px"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errors.length > 0 && (
          <div className="rounded-lg bg-danger-100 text-danger-500 text-[12.5px] px-3.5 py-2.5">
            <ul className="list-disc pl-4 space-y-0.5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
        )}
        <label className="block">
          <span className="text-[12.5px] font-medium text-ink/70 mb-1.5 block">Product name</span>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-porcelain text-[13.5px] outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-shadow"
            placeholder="e.g. Nairobi Weave Tote"
          />
        </label>
        <label className="block">
          <span className="text-[12.5px] font-medium text-ink/70 mb-1.5 block">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-porcelain text-[13.5px] outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-shadow resize-none"
            placeholder="Short, honest description of the product"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[12.5px] font-medium text-ink/70 mb-1.5 block">Price (KES)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-porcelain text-[13.5px] font-mono outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-shadow"
              placeholder="0.00"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-medium text-ink/70 mb-1.5 block">Stock quantity</span>
            <input
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-line bg-porcelain text-[13.5px] font-mono outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-shadow"
              placeholder="0"
            />
          </label>
        </div>

        <div>
          <span className="text-[12.5px] font-medium text-ink/70 mb-1.5 flex items-center gap-1.5"><ImageIcon size={13} /> Image URLs</span>
          <div className="flex flex-col gap-2">
            {form.images.map((url, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={url}
                  onChange={(e) => setImage(idx, e.target.value)}
                  placeholder="https://…"
                  className="flex-1 px-3.5 py-2 rounded-lg border border-line bg-porcelain text-[13px] outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-shadow"
                />
                {form.images.length > 1 && (
                  <button type="button" onClick={() => removeImage(idx)} className="text-ink/35 hover:text-danger-500 px-2">
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addImage}
              className="self-start flex items-center gap-1.5 text-[12.5px] font-medium text-primary-600 hover:text-primary-700 mt-1"
            >
              <Plus size={14} /> Add another image
            </button>
          </div>
        </div>

        <div>
  <span className="text-[12.5px] font-medium text-ink/70 mb-1.5 flex items-center gap-1.5"><VideoIcon size={13} /> Videos</span>
  <div className="flex flex-col gap-2">
    {form.videos.map((url, idx) => (
      <div key={idx} className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setVideo(idx, e.target.value)}
          placeholder="https://…"
          className="flex-1 px-3.5 py-2 rounded-lg border border-line bg-porcelain text-[13px] outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-shadow"
        />
        {form.videos.length > 1 && (
          <button type="button" onClick={() => removeVideo(idx)} className="text-ink/35 hover:text-danger-500 px-2">
            <X size={15} />
          </button>
        )}
      </div>
    ))}
    <button type="button" onClick={addVideo} className="self-start flex items-center gap-1.5 text-[12.5px] font-medium text-primary-600 hover:text-primary-700 mt-1">
      <Plus size={14} /> Add another video
    </button>
  </div>
</div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
            className="w-4 h-4 rounded border-line accent-[--color-primary-500]"
          />
          <span className="text-[13px] text-ink/70">Visible in the storefront</span>
        </label>
        <div className="flex justify-end gap-2.5 pt-2 border-t border-line mt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium text-ink/60 hover:bg-line transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors disabled:opacity-60">
            {saving ? "Saving…" : initial ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}