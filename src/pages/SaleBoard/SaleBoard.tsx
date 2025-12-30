import { useEffect, useMemo, useState } from "react";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../config/endpoints";
import { useDispatch, useSelector } from "react-redux";
import {
  accessTokenFromStore,
  getAuthFromStore,
  getIsSuperUserFromStore,
  getUserFromStore,
} from "../../redux/selectors";
import type { Admin } from "../../../types/types";
import { CircularProgress, IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { type AppDispatch } from "../../redux/store";
import { setSales } from "../../redux/slices/sales/salesReducer";
import { toast } from "react-toastify";

type PaymentMethod = "cash" | "card" | "mobile" | "" | null;

interface Sale {
  id: number;
  sale_id: string;
  total_price: number;
  profit: number;
  payment_method: PaymentMethod;
  sale_time: string;
}

export default function SaleBoard() {
  const isSuperAdmin = useSelector(getIsSuperUserFromStore);
  const API_URL = !isSuperAdmin
    ? `${DEFAULT_ENDPOINT}${ENDPOINTS.sales.getAdminSales}`
    : `${DEFAULT_ENDPOINT}${ENDPOINTS.sales.getSales}`;

  const accessToken = useSelector(accessTokenFromStore);
  const authData = useSelector(getAuthFromStore);
  const user = useSelector(getUserFromStore);

  const REQUEST_BODY = !isSuperAdmin
    ? {
        shop_id: authData.user?.shop_id,
        admin_name: authData.isSuperAdmin ? (user as Admin | null)?.last_name : authData.user?.uuid,
      }
    : {
        shop_id: authData.user?.shop_id,
      };

  const [data, setData] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [sortKey, setSortKey] = useState<keyof Sale>("sale_time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // Additional sorting/filter menu state
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [extraSort, setExtraSort] = useState<"default" | "amount_asc" | "amount_desc" | "profit_asc" | "profit_desc">("default");
  const sortMenuOpen = Boolean(sortMenuAnchor);

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!isSuperAdmin && (!REQUEST_BODY.shop_id || !REQUEST_BODY.admin_name)) {
      toast.warning("Missing required information to load sales");
      return;
    }

    const fetchSales = async () => {
      setLoading(true);
      setError("");

      try {
        const options: RequestInit = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: accessToken ?? "",
          },
        };

        options.body = JSON.stringify(REQUEST_BODY);

        const res = await fetch(API_URL, options);

        const json: {
          success: boolean;
          data: Sale[];
          message?: string;
        } = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "Failed to fetch sales");
        }

        setData(json.data ?? []);
        dispatch(setSales(json.data));

        toast.success(`Successfully loaded ${json.data?.length || 0} sales`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        console.error(err);
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [API_URL, accessToken, REQUEST_BODY.shop_id, REQUEST_BODY.admin_name, isSuperAdmin, dispatch]);

  const handleSort = (key: keyof Sale) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
    setExtraSort("default");
  };

  // Extra sorting for amount/profit
  const handleExtraSort = (type: typeof extraSort) => {
    setExtraSort(type);
    setSortMenuAnchor(null);
  };

  const filteredData = useMemo(() => {
    let rows = [...data];

    if (paymentFilter !== "all") {
      rows = rows.filter((r) => (r.payment_method ?? "") === paymentFilter);
    }

    if (search) {
      rows = rows.filter((r) => r.sale_id.toLowerCase().includes(search.toLowerCase()));
    }

    // Extra sorting
    if (extraSort === "amount_asc") {
      rows.sort((a, b) => a.total_price - b.total_price);
    } else if (extraSort === "amount_desc") {
      rows.sort((a, b) => b.total_price - a.total_price);
    } else if (extraSort === "profit_asc") {
      rows.sort((a, b) => a.profit - b.profit);
    } else if (extraSort === "profit_desc") {
      rows.sort((a, b) => b.profit - a.profit);
    } else {
      // Default sorting by sortKey/sortOrder
      rows.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (aVal == null) return 1;
        if (bVal == null) return -1;

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }

        return sortOrder === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    return rows;
  }, [data, sortKey, sortOrder, paymentFilter, search, extraSort]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, sale) => {
        acc.totalPrice += Number(sale.total_price) ?? 0;
        acc.totalProfit += Number(sale.profit) ?? 0;
        return acc;
      },
      { totalPrice: 0, totalProfit: 0 }
    );
  }, [filteredData]);

  // Reset filters handler
  const handleResetFilters = () => {
    setSearch("");
    setPaymentFilter("all");
    setExtraSort("default");
    setSortKey("sale_time");
    setSortOrder("desc");
    toast.info("Filters cleared");
  };

  if (loading)
    return (
      <div className="absolute top-[50%] left-[50%] translate-x-[-50%]">
        <CircularProgress size={100} />
      </div>
    );

  if (error) return <div className="p-4 text-red-600">{error}</div>;

  const headers: { key: keyof Sale; label: string }[] = [
    { key: "sale_id", label: "Sale ID" },
    { key: "total_price", label: "Total" },
    { key: "profit", label: "Profit" },
    { key: "payment_method", label: "Payment" },
    { key: "sale_time", label: "Date" },
  ];

  const isFilterActive = search !== "" || paymentFilter !== "all" || extraSort !== "default";

  // MUI imports for menu
  // (If not already imported at top)
  // import { Menu, MenuItem, IconButton, Tooltip } from "@mui/material";
  // import { FilterList } from "@mui/icons-material";
  // (Assume already present in your project)

  return (
    <div className="p-4 bg-white rounded-xl shadow">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Search sale ID..."
          className="border px-3 py-2 rounded-md text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border px-3 py-2 rounded-md text-sm"
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="all">All payments</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="mobile">Mobile</option>
          <option value="">Unknown</option>
        </select>

        {/* Sorting/filter menu */}
        <Tooltip title="Sort by amount/profit">
          <IconButton onClick={(e) => setSortMenuAnchor(e.currentTarget)}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path d="M10 17l5-5-5-5v10z" fill="currentColor" />
            </svg>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={sortMenuAnchor}
          open={sortMenuOpen}
          onClose={() => setSortMenuAnchor(null)}
        >
          <MenuItem
            selected={extraSort === "default"}
            onClick={() => handleExtraSort("default")}
          >
            Default Sort
          </MenuItem>
          <MenuItem
            selected={extraSort === "amount_asc"}
            onClick={() => handleExtraSort("amount_asc")}
          >
            Amount: Low to High
          </MenuItem>
          <MenuItem
            selected={extraSort === "amount_desc"}
            onClick={() => handleExtraSort("amount_desc")}
          >
            Amount: High to Low
          </MenuItem>
          <MenuItem
            selected={extraSort === "profit_asc"}
            onClick={() => handleExtraSort("profit_asc")}
          >
            Profit: Low to High
          </MenuItem>
          <MenuItem
            selected={extraSort === "profit_desc"}
            onClick={() => handleExtraSort("profit_desc")}
          >
            Profit: High to Low
          </MenuItem>
        </Menu>

        {isFilterActive && (
          <button
            onClick={handleResetFilters}
            className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-md border border-red-200 transition"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Totals */}
      <div className="flex gap-6 mb-4 text-sm font-medium">
        <div>Total Sales: {filteredData.length}</div>
        <div>Total Amount: {totals.totalPrice.toFixed(2)}</div>
        <div className="text-green-600">Total Profit: {totals.totalProfit.toFixed(2)}</div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              {headers.map((h) => (
                <th
                  key={h.key}
                  onClick={() => handleSort(h.key)}
                  className="cursor-pointer px-3 py-2 border text-left hover:bg-gray-200"
                >
                  {h.label}
                  {sortKey === h.key && extraSort === "default" && (
                    <span className="ml-1">{sortOrder === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No data found
                </td>
              </tr>
            )}

            {filteredData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 border font-mono">{row.sale_id}</td>
                <td className="px-3 py-2 border">{row.total_price}</td>
                <td className="px-3 py-2 border text-green-600">{row.profit}</td>
                <td className="px-3 py-2 border">{row.payment_method || "—"}</td>
                <td className="px-3 py-2 border">{new Date(row.sale_time).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-3 text-xs text-gray-500">
        Showing {filteredData.length} of {data.length} sales
      </div>
    </div>
  );
}