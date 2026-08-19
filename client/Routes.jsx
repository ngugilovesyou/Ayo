// routes/Routes.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import Shop from "./src/pages/Shop";
import ProductDetail from "./src/pages/ProductDetail";
import Login from "./src/pages/Login";
import ProtectedRoute from "./src/components/ProtectedRoute";
import Orders from "./src/pages/Orders";
import OrderDetail from "./src/pages/OrderDetail";
import Products from "./src/pages/Products";
import Layout from "./src/components/Layout";
import Checkout from "./src/pages/Checkout";
import ShopLayout from "./src/components/shop/ShopLayout";
import Contact from "./src/pages/ContactUs";



export const router = createBrowserRouter([
  // Public shop routes
  {
    element: <ShopLayout />,
    children: [
      {
        index: true,
        element: <Shop />,
      },
      {
        path: "shop",
        element: <Shop />,
      },
      {
        path: "shop/:slug",
        element: <ProductDetail />,
      },
      {
        path: "checkout",
        element: <Checkout />, 
      },
      {
        path:"contact-us",
        element:<Contact />
      }
    ],
  },

  
  {
    path: "login",
    element: <Login />,
  },

  // Protected admin routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: "admin",
            async lazy() {
        const module = await import("./src/pages/Dashboard");

        return {
            Component: module.default
        };
    }
          },
          {
            path: "orders",
            element: <Orders />,
          },
          {
            path: "orders/:id",
            element: <OrderDetail />,
          },
          {
            path: "products",
            element: <Products />,
          },
        ],
      },
    ],
  },

  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);