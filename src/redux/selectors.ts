import type { Admin, Permission } from "../../types/types";
import type { RootState } from "./store";

export const getUserFromStore=(state:RootState)=>state.auth.user
export const getAuthFromStore=(state:RootState)=>state.auth
export const accessTokenFromStore=(state:RootState)=>state.auth.accessToken
export const refresgTokenFromStore=(state:RootState)=>state.auth.refreshToken
export const getshopidfromstrore=(state:RootState)=>state.auth.user?.shop_id
export const getProductsFromStore=(state:RootState)=>state.products.products
export const getSingleProductFromStore=(state:RootState)=>state.products.product
export const getCategoriesFromStore=(state:RootState)=>state.category.categories
export const getBrandsFromStore=(state:RootState)=>state.brand.brands
export const getSalesCartFromStore=(state:RootState)=>state.sales.cart
export const getSalesFromStore=(state:RootState)=>state.sales.sales
export const getSalesLoadingFromStore=(state:RootState)=>state.sales.loading
export const getSalesErrorFromStore=(state:RootState)=>state.sales.error
export const getLastSaleFromStore=(state:RootState)=>state.sales.lastSale
export const getAdminsFromStore=(state:RootState)=>state.admin.admins
export const getAdminModalsFromStore=(state:RootState)=>state.admin.modals
export const getIsSingleProductOpenFromStore=(state:RootState)=>state.products.isSingleProductOpen
export const getProductsStatusFromStore=(state:RootState)=>state.products.status
export const getAdminPermissionsFromStore=(state:RootState)=>state.auth.permissions;
export const getIsSuperUserFromStore=(state:RootState)=>state.auth.isSuperAdmin
// statuses
export const getIsProductPending=(state:RootState)=>state.products.status
export const getIsBrandPending=(state:RootState)=>state.brand.status
export const getICategoryPending=(state:RootState)=>state.category.status
export const getIsStatisticsPending=(state:RootState)=>state.statistics.status;
export const getIsCheckoutPending=(state:RootState)=>state.sales.status;
// isloadin
export const getIsloadingDashboard=(state:RootState)=>state.statistics.isLoading;

// get selectors
export const getBranchesFromStore=(state:RootState)=>state.branch;


