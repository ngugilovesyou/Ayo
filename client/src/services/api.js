import axios from "axios";

const API_BASE_URL = "https://ayo.co.ke/api";

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get cookie
function getCookie(name) {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}


client.interceptors.request.use((config) => {
  if ((config.method || "get").toLowerCase() !== "get") {
    const csrfToken = getCookie("csrf_access_token");
    if (csrfToken) {
      config.headers["X-CSRF-TOKEN"] = csrfToken;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for auth errors
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("royal-session");
    }
    return Promise.reject(error);
  }
);

function asError(err) {
  const message = err.response?.data?.error || err.message || "Something went wrong";
  const wrapped = new Error(message);
  wrapped.status = err.response?.status;
  wrapped.details = err.response?.data?.details;
  return wrapped;
}

let sessionActive = sessionStorage.getItem("royal-session") === "1";

function setSession(active) {
  sessionActive = active;
  if (active) {
    sessionStorage.setItem("royal-session", "1");
  } else {
    sessionStorage.removeItem("royal-session");
  }
}

// Auth API functions
export const auth = {
  async login(email, password) {
    try {
      const { data } = await client.post("/api/admin/login", { email, password });
      setSession(true);
      
      
      return data;
    } catch (err) {
      setSession(false);
      throw asError(err);
    }
  },
  
  async verify() {
    try {
      const { data } = await client.get("/api/admin/verify");
      setSession(true);
      return data;
    } catch (err) {
      setSession(false);
      throw asError(err);
    }
  },
  
  async logout() {
    try {
      const { data } = await client.post("/api/admin/logout");
      
      document.cookie = 'csrf_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      return data;
    } catch (err) {
      throw asError(err);
    } finally {
      setSession(false);
    }
  },
  
  isAuthenticated() {
    return sessionActive;
  },
};



// Products — /api/products*
export const products = {
  async list({ page = 1, perPage = 20, activeOnly = false, status } = {}) {
    try {
      if (status === "inactive" || status === "low_stock") {
        const { data } = await client.get("/api/products", {
          params: { page: 1, per_page: 500, active_only: false },
        });
        let list = data.data.products;
        list = status === "inactive"
          ? list.filter((p) => !p.is_active)
          : list.filter((p) => p.is_active && p.quantity <= 5);

        const total = list.length;
        const pages = Math.max(1, Math.ceil(total / perPage));
        const start = (page - 1) * perPage;
        const pageItems = list.slice(start, start + perPage);
        return {
          data: {
            products: pageItems,
            total,
            page,
            pages,
            per_page: perPage,
            has_next: page < pages,
            has_prev: page > 1,
          },
        };
      }

      const params = { page, per_page: perPage, active_only: status === "active" ? true : activeOnly };
      const { data } = await client.get("/api/products", { params });
      return data;
    } catch (err) {
      throw asError(err);
    }
  },

  async search(q, { page = 1, perPage = 20 } = {}) {
    try {
      const { data } = await client.get("/api/products/search", { 
        params: { q, page, per_page: perPage } 
      });
      return data;
    } catch (err) {
      throw asError(err);
    }
  },

  // Updated to accept either ID or slug
  async get(identifier) {
    try {
      const { data } = await client.get(`/api/products/${identifier}`);
      return data;
    } catch (err) {
      throw asError(err);
    }
  },

  // Get product by slug specifically (optional, but cleaner)
  async getBySlug(slug) {
    try {
      const { data } = await client.get(`/api/products/${slug}`);
      return data;
    } catch (err) {
      throw asError(err);
    }
  },

  async create(payload) {
    try {
      const { data } = await client.post("/api/products", payload);
      return data;
    } catch (err) {
      throw asError(err);
    }
  },

  async update(id, payload) {
    try {
      const { data } = await client.put(`/api/products/${id}`, payload);
      return data;
    } catch (err) {
      throw asError(err);
    }
  },

  async remove(id, soft = true) {
    try {
      const { data } = await client.delete(`/api/products/${id}`, { params: { soft } });
      return data;
    } catch (err) {
      throw asError(err);
    }
  },

  async restore(id) {
    try {
      const { data } = await client.post(`/api/products/${id}/restore`);
      return data;
    } catch (err) {
      throw asError(err);
    }
  },

  async exportCSV() {
    try {
      const { data } = await client.get("/api/products/export/csv");
      return data;
    } catch (err) {
      throw asError(err);
    }
  },

  async exportExcel() {
    try {
      const { data } = await client.get("/api/products/export/excel");
      return data;
    } catch (err) {
      throw asError(err);
    }
  },

  async importCSV(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data } = await client.post("/api/products/import/csv", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    } catch (err) {
      throw asError(err);
    }
  },

  async importExcel(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data } = await client.post("/api/products/import/excel", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    } catch (err) {
      throw asError(err);
    }
  },
};


// Orders — /api/orders*
export const orders = {
  async list({ page = 1, perPage = 20, status, paymentStatus } = {}) {
    try {
      const params = { page, per_page: perPage };
      if (status) params.status = status;
      if (paymentStatus) params.payment_status = paymentStatus;
      const { data } = await client.get("/api/orders", { params });
      return data;
    } catch (err) {
      throw asError(err);
    }
  },
  async create(orderData) {
    try {
      const { data } = await client.post("/api/orders", orderData);
      return data;
    } catch (err) {
      throw asError(err);
    }
  },
  
  async get(id) {
    try {
      const { data } = await client.get(`/api/orders/${id}`);
      return data;
    } catch (err) {
      throw asError(err);
    }
  },
  async updateStatus(id, order_status) {
    try {
      const { data } = await client.put(`/api/orders/${id}/status`, { order_status });
      return data;
    } catch (err) {
      throw asError(err);
    }
  },
  async updatePayment(id, payment_status) {
    try {
      const { data } = await client.put(`/api/orders/${id}/payment`, { payment_status });
      return data;
    } catch (err) {
      throw asError(err);
    }
  },
  async cancel(id) {
    try {
      const { data } = await client.post(`/api/orders/${id}/cancel`);
      return data;
    } catch (err) {
      throw asError(err);
    }
  },
  async audit(id) {
    try {
      const { data } = await client.get(`/api/orders/${id}/audit`);
      return data;
    } catch (err) {
      throw asError(err);
    }
  },
  async stats() {
    try {
      const { data } = await client.get("/api/orders/stats");
      return data;
    } catch (err) {
      throw asError(err);
    }
  },
};



export const contact = {
  async sendMessage(formData) {
    try {
      const { data } = await client.post("/api/contact", formData);
      return data;
    } catch (err) {
      throw asError(err);
    }
  },
  
  async getStatus() {
    try {
      const { data } = await client.get("/api/contact/status");
      return data;
    } catch (err) {
      throw asError(err);
    }
  },
};