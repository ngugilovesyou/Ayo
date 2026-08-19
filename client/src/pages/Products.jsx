import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import {
  Search, Plus, Package, MoreVertical, Pencil, Trash2, RotateCcw,
  Upload, Download, ImageOff,FileText
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import Pagination from "../components/Pagination";
import ProductForm from "../components/ProductForm";
import ConfirmDialog from "../components/ConfirmDialog";
import { EmptyState } from "../components/States";
import { products as productsApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { formatKES, formatDate } from "../utils/format";

export default function Products() {
  const { push } = useToast();
  const [data, setData] = useState({ products: [], total: 0, page: 1, pages: 1, per_page: 12 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const gridRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    let res;
    if (query.trim()) {
      res = await productsApi.search(query.trim(), { page, perPage: 12 });
    } else {
      res = await productsApi.list({ page, perPage: 12, status: statusFilter });
    }
    setData(res.data);
    setLoading(false);
  }, [page, statusFilter, query]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!loading && gridRef.current) {
      gsap.fromTo(
        gridRef.current.children,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" }
      );
    }
  }, [loading]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (p) => { setEditing(p); setFormOpen(true); setMenuOpenId(null); };

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        await productsApi.update(editing.id, payload);
        push("Product updated.", "success");
      } else {
        await productsApi.create(payload);
        push("Product added to catalogue.", "success");
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      push(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirmTarget) return;
    try {
      await productsApi.remove(confirmTarget.id, true);
      push(`"${confirmTarget.name}" deactivated.`, "success");
      setConfirmTarget(null);
      await load();
    } catch (e) {
      push(e.message, "error");
    }
  };

  const handleRestore = async (p) => {
    try {
      await productsApi.restore(p.id);
      push(`"${p.name}" restored.`, "success");
      setMenuOpenId(null);
      await load();
    } catch (e) {
      push(e.message, "error");
    }
  };

  const handleExport = async () => {
  try {
    push("Preparing export...", "info");
    
    // Fetch export data
    const response = await productsApi.exportCSV();
    
    if (response.data && response.data.length > 0) {
      // Create CSV content
      const headers = ['name', 'description', 'price', 'quantity', 'is_active', 'images', 'videos'];
      const csvRows = [headers.join(',')];
      
      response.data.forEach(product => {
        const row = headers.map(header => {
          let value = product[header] || '';
          // Escape commas and quotes for CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvRows.push(row.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      push(`Exported ${response.data.length} products successfully!`, "success");
    } else {
      push("No products to export.", "warning");
    }
  } catch (e) {
    push(`Export failed: ${e.message}`, "error");
  }
};

// Replace the handleImport function
const handleImport = () => {
  // Create hidden file input
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,.xlsx,.xls';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
      push('Please upload a CSV or Excel file.', 'error');
      return;
    }
    
    try {
      push(`Importing ${file.name}...`, 'info');
      
      let response;
      if (fileExtension === 'csv') {
        response = await productsApi.importCSV(file);
      } else {
        response = await productsApi.importExcel(file);
      }
      
      const results = response.results;
      
      if (results.imported > 0) {
        push(`Successfully imported ${results.imported} products. ${results.failed.length} failed.`, 
              results.failed.length > 0 ? 'warning' : 'success');
        
        // Show detailed errors if any
        if (results.failed.length > 0) {
          const errorDetails = results.errors.slice(0, 5).join('\n');
          if (results.errors.length > 5) {
            push(`${results.errors.length} errors found. First few: ${errorDetails}`, 'info');
          } else {
            push(`Errors: ${errorDetails}`, 'error');
          }
        }
        
        // Reload products
        await load();
      } else {
        push(`Import failed: ${results.errors.join(', ')}`, 'error');
      }
      
    } catch (e) {
      push(`Import failed: ${e.message}`, 'error');
    } finally {
      // Clean up
      document.body.removeChild(input);
    }
  };
  
  document.body.appendChild(input);
  input.click();
};

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        subtitle={`${data.total} products · manage pricing, stock and media`}
        actions={
  <div className="flex items-center gap-2">
    
    <button 
      onClick={handleImport} 
      className="hidden sm:flex px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-[12.5px] font-semibold text-ink/60 border border-line hover:bg-line transition-all items-center gap-1 sm:gap-1.5"
    >
      <Upload size={13} className="sm:w-[14px] sm:h-[14px]" /> Import
    </button>
    <button 
      onClick={handleExport} 
      className="hidden sm:flex px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-[12.5px] font-semibold text-ink/60 border border-line hover:bg-line transition-all items-center gap-1 sm:gap-1.5"
    >
      <Download size={13} className="sm:w-[14px] sm:h-[14px]" /> Export
    </button>
    <button 
      onClick={openCreate} 
      className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-[12.5px] font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-all flex items-center gap-1 sm:gap-1.5 shadow-soft hover:shadow-lift"
    >
      <Plus size={14} className="sm:w-[15px] sm:h-[15px]" /> New product
    </button>
  </div>
}
      />

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-ink/35 sm:w-[16px] sm:h-[16px]" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search products…"
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-3.5 py-2 sm:py-2.5 rounded-lg border border-line bg-paper text-[12px] sm:text-[13px] text-ink placeholder:text-ink/35 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all outline-none font-sans"
          />
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          {[
            { key: "active", label: "Active" },
            { key: "inactive", label: "Inactive" },
            { key: "low_stock", label: "Low stock" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => { setStatusFilter(f.key); setQuery(""); setPage(1); }}
              className={
                "px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-[12.5px] font-semibold border transition-all whitespace-nowrap " +
                (statusFilter === f.key && !query
                  ? "bg-primary-500 border-primary-500 text-white shadow-soft"
                  : "border-line text-ink/60 hover:bg-line hover:shadow-soft")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-paper border border-line rounded-xl sm:rounded-2xl overflow-hidden animate-pulse shadow-soft">
              <div className="h-32 sm:h-36 lg:h-40 bg-line" />
              <div className="p-3 sm:p-4 space-y-2">
                <div className="h-4 w-3/4 bg-line rounded" />
                <div className="h-3 w-1/2 bg-line rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : data.products.length === 0 ? (
        <div className="bg-paper border border-line rounded-xl sm:rounded-2xl shadow-soft">
          <EmptyState
            icon={Package}
            title="No products found"
            subtitle="Try a different search, or add your first product to the catalogue."
            action={
              <button onClick={openCreate} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[12px] sm:text-[13px] font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-all shadow-soft hover:shadow-lift">
                Add a product
              </button>
            }
          />
        </div>
      ) : (
        <>
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {data.products.map((p) => {
              const primaryImage = p.images?.find((i) => i.is_primary) || p.images?.[0];
              const lowStock = p.is_active && p.quantity <= 5;
              return (
                <div key={p.id} className="bg-paper border border-line rounded-xl sm:rounded-2xl overflow-hidden shadow-soft hover:shadow-lift transition-all group relative">
                  <div className="h-32 sm:h-36 lg:h-40 bg-plum-50 relative overflow-hidden">
                    {primaryImage ? (
                      <img 
                        src={primaryImage.url} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" 
                        loading="lazy" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary-300">
                        <ImageOff size={22} className="sm:w-[26px] sm:h-[26px]" />
                      </div>
                    )}
                    <div className="absolute top-2 sm:top-2.5 left-2 sm:left-2.5 flex gap-1 sm:gap-1.5">
                      {!p.is_active && <Badge>Inactive</Badge>}
                      {lowStock && <Badge>Low stock</Badge>}
                    </div>
                    <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setMenuOpenId(menuOpenId === p.id ? null : p.id);
                        }}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-paper/95 hover:bg-paper flex items-center justify-center text-ink/60 shadow-soft hover:shadow-lift transition-all"
                      >
                        <MoreVertical size={13} className="sm:w-[14px] sm:h-[14px]" />
                      </button>
                      {menuOpenId === p.id && (
                        <div className="absolute right-0 mt-1 sm:mt-1.5 w-36 sm:w-40 bg-paper border border-line rounded-lg sm:rounded-xl shadow-lift overflow-hidden z-10">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              openEdit(p);
                            }} 
                            className="w-full flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 text-[11px] sm:text-[12.5px] text-ink/70 hover:bg-plum-50 hover:text-primary-600 transition-colors font-medium"
                          >
                            <Pencil size={12} className="sm:w-[13px] sm:h-[13px]" /> Edit
                          </button>
                          {p.is_active ? (
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                setConfirmTarget(p); 
                                setMenuOpenId(null);
                              }} 
                              className="w-full flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 text-[11px] sm:text-[12.5px] text-danger-500 hover:bg-danger-100 transition-colors font-medium"
                            >
                              <Trash2 size={12} className="sm:w-[13px] sm:h-[13px]" /> Deactivate
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                handleRestore(p);
                              }} 
                              className="w-full flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 text-[11px] sm:text-[12.5px] text-ok-500 hover:bg-ok-100 transition-colors font-medium"
                            >
                              <RotateCcw size={12} className="sm:w-[13px] sm:h-[13px]" /> Restore
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <p className="text-[12px] sm:text-[13.5px] font-semibold text-ink truncate mb-0.5 group-hover:text-primary-600 transition-colors">
                      {p.name}
                    </p>
                    <p className="text-[10.5px] sm:text-[11.5px] text-ink/45 line-clamp-2 mb-2.5 sm:mb-3 leading-relaxed">
                      {p.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-[13px] sm:text-[14px] text-ink">
                        {formatKES(p.price)}
                      </span>
                      <span className="text-[10.5px] sm:text-[11.5px] text-ink/45">
                        {p.quantity} in stock
                      </span>
                    </div>
                    <p className="text-[9.5px] sm:text-[10.5px] text-ink/30 mt-1.5 sm:mt-2 font-mono">
                      Added {formatDate(p.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 sm:mt-6">
            <Pagination page={data.page} pages={data.pages} total={data.total} perPage={data.per_page} onChange={setPage} />
          </div>
        </>
      )}

      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        saving={saving}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate product?"
        message={`"${confirmTarget?.name}" will be hidden from the storefront. You can restore it at any time.`}
        confirmLabel="Deactivate"
      />
    </div>
  );
}