interface User {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  roles?: string[];      // optionnel, ex: admin, user
}

// Déclare le type de réponse login de Laravel
interface LoginResponse {
  user: User;
  token: string;
}

// Déclare le type de store Zustand pour l'auth
interface AuthStore {
  user: User | null;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

interface Category {
  id: number | string;
  name: string;
  unsynced?: boolean;
  deleted?: boolean;
};

interface Customer {
  id: number | string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  unsynced?: boolean;
  deleted?: boolean;
};

interface Product {
  id: number | string;
  name: string;
  category_id: string;
  price: number;
  description?: string;
  quantity?: number;
  category_name?: string; // Pour afficher le nom de la catégorie
  total_supplied?: number;
  unsynced?: boolean;
  deleted?: boolean;
};

interface Supply {
  id: number | string;
  product_id: string;
  quantity: number;
  unsynced?: boolean;
  deleted?: boolean;
  created_at?: string;
}

interface OrderItem {
  product_id: string;
  name?: string;
  pu?: string
  quantity: string;
}

interface Order {
  id: number | string;
  customer_id: number | string;
  products: OrderItem[];
  amount?: number;
  client?: string;
  unsynced?: boolean;
  deleted?: boolean;
  created_at?: string
};