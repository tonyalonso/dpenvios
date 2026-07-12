'use client';

import { useState, useEffect, useCallback, useRef, Fragment, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingCart,
  Settings,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  Star,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Loader2,
  Download,
  Code2,
  CheckCircle2,
  Truck,
  ImagePlus,
  X,
  Eye,
  Users,
  Heart,
  Mail,
  Phone,
  MapPin,
  GripVertical,
  Tags,
  Layers,
  Pause,
  Play,
  CalendarClock,
  Clock,
  Percent,
  Save,
  Search,
  Store,
  Barcode,
  ToggleLeft,
  Upload,
  Lock,
  Info,
} from 'lucide-react';
import { OrderTicket } from '@/components/ecommerce/OrderTicket';
import { CountryFlag, COUNTRY_INFO } from '@/components/ecommerce/CountryFlag';
import { optimizeImage } from '@/lib/image-upload';

const ADMIN_TOKEN_KEY = 'diaz-admin-token';

// Types
interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image?: string;
  order: number;
  _count?: { products: number };
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  shortName?: string;
  description: string;
  sku?: string;
  price: number;
  image: string;
  images: string;
  tags?: string;
  categoryId: string;
  category: { id: string; name: string; slug: string };
  rating: number;
  reviewCount: number;
  stock: number;
  featured: boolean;
  order: number;
  // SIGECOS: unidad y código
  saleUnit?: string;
  barcode?: string;
  // SIGECOS: tipo y estado
  productType?: string;
  status?: string;
  // SIGECOS: disponibilidad
  posAvailable?: boolean;
  tiendaAvailable?: boolean;
  // SIGECOS: anticipo
  advanceType?: string;
  advanceValue?: number;
  minHours?: number;
  minHoursUnit?: string;
  // SIGECOS: costos (admin only)
  costPrice?: number;
  marginPercent?: number;
  offerEnabled?: boolean;
  offerType?: string;
  offerPrice?: number;
  offerStart?: string | null;
  offerEnd?: string | null;
  wholesaleEnabled?: boolean;
  wholesalePrice?: number;
  wholesaleMinQty?: number;
  reservationEnabled?: boolean;
  maxReservations?: number;
  reservationDays?: number;
  reservationDeposit?: number;
  promoEnabled?: boolean;
  promoType?: string;
  promoValue?: number;
  promoBuyQty?: number;
  promoGetQty?: number;
  promoStart?: string | null;
  promoEnd?: string | null;
  createdAt: string;
}

interface VariantOption {
  id: string;
  groupId: string;
  name: string;
  priceMod: number;
  image: string;
  stock: number;
  available: boolean;
  sortOrder: number;
}

interface VariantGroup {
  id: string;
  productId: string;
  name: string;
  required: boolean;
  maxSelect: number;
  isImageGroup: boolean;
  isDominant?: boolean;
  sortOrder: number;
  options?: VariantOption[];
}

interface Combination {
  id: string;
  productId: string;
  optionIds: string;
  sku: string;
  stock: number;
  price: number | null;
  image: string;
  available: boolean;
  sortOrder: number;
}

interface ProductExtra {
  id: string;
  productId: string;
  name: string;
  description: string;
  priceMod: number;
  required: boolean;
  sortOrder: number;
}

interface WholesaleTier {
  id: string;
  productId: string;
  name: string;
  minQty: number;
  maxQty: number;
  price: number;
  sortOrder: number;
}

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientNotes: string;
  deliveryZoneId: string | null;
  deliveryZoneName: string | null;
  deliveryZonePrice: number;
  deliveryDate: string | null;
  deliveryTimeSlot: string;
  deliverySurcharge: number;
  shippingCost: number;
  total: number;
  status: string;
  isPaid: boolean;
  zelleRef: string | null;
  paymentProof: string | null;
  items: OrderItem[];
  createdAt: string;
}

interface SiteConfig {
  id: string;
  storeName: string;
  tagline: string;
  logo: string;
  cover: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  zelleEmail: string;
  zelleName: string;
  primaryColor: string;
  freeShippingMin: number;
  shippingCost: number;
  scheduleLunes: string;
  scheduleMartes: string;
  scheduleMiercoles: string;
  scheduleJueves: string;
  scheduleViernes: string;
  scheduleSabado: string;
  scheduleDomingo: string;
  asapSurchargeType: string;
  asapSurchargeValue: number;
  normalSchedule: string;
  activeCountries: string;
  tickerItems: string;
  horarioSectionTitle: string;
  horarioSectionDesc: string;
  horarioCards: string;
}

// Status badge helper
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };
  return (
    <Badge variant="outline" className={colors[status] || 'bg-gray-100 text-gray-800'}>
      {labels[status] || status}
    </Badge>
  );
}

// Sidebar navigation items
type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'delivery' | 'customers' | 'reviews' | 'settings';

const navItems: { tab: AdminTab; label: string; icon: React.ReactNode }[] = [
  { tab: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { tab: 'products', label: 'Productos', icon: <Package className="h-5 w-5" /> },
  { tab: 'categories', label: 'Categorías', icon: <FolderOpen className="h-5 w-5" /> },
  { tab: 'orders', label: 'Pedidos', icon: <ShoppingCart className="h-5 w-5" /> },
  { tab: 'delivery', label: 'Delivery', icon: <Truck className="h-5 w-5" /> },
  { tab: 'customers', label: 'Clientes', icon: <Users className="h-5 w-5" /> },
  { tab: 'reviews', label: 'Reseñas', icon: <Star className="h-5 w-5" /> },
  { tab: 'settings', label: 'Ajustes', icon: <Settings className="h-5 w-5" /> },
];

// ─── DASHBOARD TAB ──────────────────────────────────────────────────────────

function DashboardTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, oRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/orders'),
      ]);
      setProducts(await pRes.json());
      setOrders(await oRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  const lowStock = products.filter((p) => p.stock <= 5);
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Productos</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100 text-green-600">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pedidos</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ingresos</p>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Pedidos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-400 py-6">
                      No hay pedidos
                    </TableCell>
                  </TableRow>
                )}
                {recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm">#{o.orderNumber}</TableCell>
                    <TableCell>{o.customerName}</TableCell>
                    <TableCell className="font-semibold">${o.total.toFixed(2)}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-400 py-6">
                      Todo el stock está bien
                    </TableCell>
                  </TableRow>
                )}
                {lowStock.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="flex items-center gap-2">
                      <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover" />
                      {p.name}
                    </TableCell>
                    <TableCell>{p.category?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}>
                        {p.stock}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── PRODUCTS TAB ───────────────────────────────────────────────────────────

const QUICK_TAG_PRESETS = [
  { name: 'DESTACADO', color: '#F59E0B' },
  { name: 'NUEVO', color: '#22C55E' },
  { name: 'OFERTA', color: '#EF4444' },
  { name: 'POPULAR', color: '#F97316' },
  { name: 'VEGANO', color: '#16A34A' },
  { name: 'SIN GLUTEN', color: '#EAB308' },
  { name: 'ARTESANAL', color: '#8B5CF6' },
  { name: 'PREMIUM', color: '#002A8F' },
  { name: 'TEMPORADA', color: '#06B6D4' },
];
const TAG_COLOR_SWATCHES = ['#EF4444','#F97316','#EAB308','#22C55E','#06B6D4','#3B82F6','#8B5CF6','#EC4899','#6B7280','#F59E0B'];

function genLocalId(prefix = 'tmp'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

interface ProductFormState {
  name: string;
  shortName: string;
  sku: string;
  description: string;
  price: number;
  image: string;
  images: string;
  tags: string;
  categoryId: string;
  stock: number;
  featured: boolean;
  order: number;
  // SIGECOS: unidad y código
  saleUnit: string;
  barcode: string;
  // SIGECOS: tipo y estado
  productType: string;
  status: string;
  // SIGECOS: disponibilidad
  posAvailable: boolean;
  tiendaAvailable: boolean;
  // SIGECOS: anticipo
  advanceType: string;
  advanceValue: number;
  minHours: number;
  minHoursUnit: string;
  // SIGECOS: costos (admin only)
  costPrice: number;
  marginPercent: number;
  offerEnabled: boolean;
  offerType: string;
  offerPrice: number;
  offerStart: string | null;
  offerEnd: string | null;
  // Wholesale (Por mayor) — legacy fields kept for backward compat
  wholesaleEnabled: boolean;
  wholesalePrice: number;
  wholesaleMinQty: number;
  // Wholesale tiers (rangos)
  wholesaleTiers: {
    id: string;
    name: string;
    minQty: number;
    maxQty: number;
    price: number;
    sortOrder: number;
  }[];
  // Reservation
  reservationEnabled: boolean;
  maxReservations: number;
  reservationDays: number;
  reservationDeposit: number;
  // Promo
  promoEnabled: boolean;
  promoType: string;
  promoValue: number;
  promoBuyQty: number;
  promoGetQty: number;
  promoStart: string | null;
  promoEnd: string | null;
  variantGroups: {
    id: string;
    name: string;
    required: boolean;
    maxSelect: number;
    isImageGroup: boolean;
    isDominant: boolean;
    sortOrder: number;
    options: {
      id: string;
      name: string;
      priceMod: number;
      image: string;
      stock: number;
      available: boolean;
      sortOrder: number;
    }[];
  }[];
  combinations: {
    id: string;
    optionIds: string[];
    sku: string;
    stock: number;
    price: number | null;
    image: string;
    available: boolean;
    sortOrder: number;
  }[];
  productExtras: {
    id: string;
    name: string;
    description: string;
    priceMod: number;
    required: boolean;
    sortOrder: number;
  }[];
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  shortName: '',
  sku: '',
  description: '',
  price: 0,
  image: '',
  images: '[]',
  tags: '[]',
  categoryId: '',
  stock: 10,
  featured: false,
  order: 0,
  // SIGECOS defaults
  saleUnit: 'unidad',
  barcode: '',
  productType: 'elaborado',
  status: 'active',
  posAvailable: true,
  tiendaAvailable: true,
  advanceType: 'sin',
  advanceValue: 0,
  minHours: 24,
  minHoursUnit: 'horas',
  costPrice: 0,
  marginPercent: 0,
  offerEnabled: false,
  offerType: 'permanente',
  offerPrice: 0,
  offerStart: null,
  offerEnd: null,
  wholesaleEnabled: false,
  wholesalePrice: 0,
  wholesaleMinQty: 10,
  wholesaleTiers: [],
  reservationEnabled: false,
  maxReservations: 50,
  reservationDays: 7,
  reservationDeposit: 0,
  promoEnabled: false,
  promoType: 'discount',
  promoValue: 0,
  promoBuyQty: 0,
  promoGetQty: 0,
  promoStart: null,
  promoEnd: null,
  variantGroups: [],
  combinations: [],
  productExtras: [],
};

/** Genera combinaciones cartesianas a partir de los grupos y opciones del form.
 *  Si hay un grupo marcado como `isDominant`, cada combinación toma por defecto
 *  la imagen de la opción del grupo dominante que forma parte de esa combinación. */
function generateCombinationsFromForm(groups: ProductFormState['variantGroups']): ProductFormState['combinations'] {
  const nonEmpty = groups.filter((g) => g.options.length > 0);
  if (nonEmpty.length < 2) return [];
  const dominant = nonEmpty.find((g) => g.isDominant);
  const result: ProductFormState['combinations'] = [];
  function cross(idx: number, acc: { id: string; image: string }[]) {
    if (idx >= nonEmpty.length) {
      // Por defecto, la imagen de la combinación es la imagen de la opción del grupo dominante.
      const domImg = dominant
        ? acc.find((a) => dominant.options.some((o) => o.id === a.id))?.image || ''
        : '';
      result.push({
        id: genLocalId('cmb'),
        optionIds: acc.map((a) => a.id),
        sku: '',
        stock: 0,
        price: null,
        image: domImg,
        available: true,
        sortOrder: result.length,
      });
      return;
    }
    for (const opt of nonEmpty[idx].options) {
      cross(idx + 1, [...acc, { id: opt.id, image: opt.image }]);
    }
  }
  cross(0, []);
  return result;
}

/** Re-aplica a las combinaciones existentes la imagen del grupo dominante.
 *  Útil cuando el admin cambió el grupo dominante o editó imágenes de opciones
 *  y quiere re-sync sin tener que volver a generar todo el producto cartesiano. */
function reapplyDominantImages(form: ProductFormState): ProductFormState['combinations'] {
  const nonEmpty = form.variantGroups.filter((g) => g.options.length > 0);
  const dominant = nonEmpty.find((g) => g.isDominant);
  if (!dominant) return form.combinations;
  return form.combinations.map((c) => {
    // Buscar cuál opción de la combinación pertenece al grupo dominante
    const domOptId = c.optionIds.find((oid) => dominant.options.some((o) => o.id === oid));
    if (!domOptId) return c;
    const domOpt = dominant.options.find((o) => o.id === domOptId);
    return { ...c, image: domOpt?.image || '' };
  });
}

// ─── Helper editors para el diálogo de producto ───

function parseTagArray(json: string): { name: string; color: string }[] {
  try {
    const p = JSON.parse(json || '[]');
    if (Array.isArray(p)) {
      return p
        .filter((x) => x && typeof x === 'object')
        .map((x) => ({ name: String(x.name ?? ''), color: String(x.color ?? '#6B7280') }))
        .filter((x) => x.name);
    }
  } catch { /* ignore */ }
  return [];
}

function CustomTagEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(TAG_COLOR_SWATCHES[0]);
  const tags = parseTagArray(value);

  const addTag = () => {
    const n = name.trim();
    if (!n) return;
    if (tags.some((t) => t.name === n)) {
      setName('');
      return;
    }
    onChange(JSON.stringify([...tags, { name: n, color }]));
    setName('');
  };

  const removeTag = (n: string) => {
    onChange(JSON.stringify(tags.filter((t) => t.name !== n)));
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Etiqueta personalizada</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            placeholder="Nombre de la etiqueta"
            className="flex-1"
          />
          <Button type="button" onClick={addTag} className="bg-amber-500 hover:bg-amber-600">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div>
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {TAG_COLOR_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{ backgroundColor: c, borderColor: color === c ? '#000' : 'transparent' }}
              aria-label={`Color ${c}`}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-7 w-10 rounded border border-gray-300 cursor-pointer"
            aria-label="Color personalizado"
          />
        </div>
      </div>
      {tags.length > 0 && (
        <div>
          <Label>Etiquetas actuales</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {tags.map((t) => (
              <span
                key={t.name}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: t.color }}
              >
                {t.name}
                <button
                  type="button"
                  onClick={() => removeTag(t.name)}
                  className="ml-1 hover:bg-white/30 rounded-full p-0.5"
                  aria-label={`Quitar ${t.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function parseStringArray(json: string): string[] {
  try {
    const p = JSON.parse(json || '[]');
    if (Array.isArray(p)) return p.filter((x) => typeof x === 'string');
  } catch { /* ignore */ }
  return [];
}

function GalleryEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const images = parseStringArray(value);

  const addUrl = () => {
    const u = url.trim();
    if (!u) return;
    onChange(JSON.stringify([...images, u]));
    setUrl('');
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        try {
          const dataUrl = await optimizeImage(f);
          newImages.push(dataUrl);
        } catch (err) {
          setUploadError((prev) => prev ? `${prev}; ${f.name}: ${(err as Error).message}` : `${f.name}: ${(err as Error).message}`);
        }
      }
      if (newImages.length > 0) {
        onChange(JSON.stringify([...images, ...newImages]));
      }
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeAt = (idx: number) => {
    onChange(JSON.stringify(images.filter((_, i) => i !== idx)));
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Cargar imágenes (archivo local, máx. 2MB c/u)</Label>
        <div className="flex items-center gap-2 mt-1">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {uploading ? 'Procesando…' : 'Seleccionar archivos'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={handleFiles}
            disabled={uploading}
          />
          {uploading && <Loader2 className="h-4 w-4 animate-spin text-amber-500" />}
        </div>
        {uploadError && (
          <p className="text-xs text-red-600 mt-1">{uploadError}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Se comprimen automáticamente a WebP (máx. 800px de ancho). También puedes pegar una URL abajo.
        </p>
      </div>
      <div>
        <Label>Agregar imagen (URL)</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
            placeholder="/products/prod-00.jpg o https://..."
            className="flex-1"
          />
          <Button type="button" onClick={addUrl} className="bg-amber-500 hover:bg-amber-600">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {images.length === 0 ? (
        <p className="text-sm text-gray-500">Sin imágenes en la galería. La imagen principal se usa como fallback.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((src, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
              <img src={src} alt={`Imagen ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Eliminar imagen"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MainImageEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const dataUrl = await optimizeImage(file);
      onChange(dataUrl);
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Imagen principal</Label>
      {/* Preview grande */}
      <div className="w-full aspect-square rounded-xl border-2 border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shadow-sm">
        {value ? (
          <img src={value} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <ImagePlus className="h-10 w-10" />
            <span className="text-xs">Sin imagen</span>
          </div>
        )}
      </div>
      {/* Botón subir */}
      <Button
        type="button"
        variant="outline"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="w-full"
      >
        {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
        {uploading ? 'Procesando…' : 'Subir imagen'}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFile}
        disabled={uploading}
      />
      {uploadError ? (
        <p className="text-xs text-red-600">{uploadError}</p>
      ) : (
        <p className="text-xs text-gray-500">
          Máx. 2MB · Se comprime a WebP automáticamente.
        </p>
      )}
    </div>
  );
}

function VariantOptionRow({
  option,
  onUpdate,
  onRemove,
  stockFrozen = false,
}: {
  option: { id: string; name: string; priceMod: number; image: string; stock: number; available: boolean };
  onUpdate: (patch: Partial<{ name: string; priceMod: number; image: string; stock: number; available: boolean }>) => void;
  onRemove: () => void;
  /** Cuando hay combinaciones, el stock individual de la opción se congela. */
  stockFrozen?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await optimizeImage(file);
      onUpdate({ image: dataUrl });
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <Input
        className="col-span-12 sm:col-span-4 h-8 text-sm"
        value={option.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Pequeño"
      />
      <Input
        className="col-span-4 sm:col-span-2 h-8 text-sm"
        type="number"
        step="0.01"
        value={option.priceMod}
        onChange={(e) => onUpdate({ priceMod: parseFloat(e.target.value) || 0 })}
      />
      <Input
        className={`col-span-4 sm:col-span-2 h-8 text-sm ${stockFrozen ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
        type="number"
        value={option.stock}
        disabled={stockFrozen}
        onChange={(e) => onUpdate({ stock: parseInt(e.target.value) || 0 })}
        title={stockFrozen ? 'Stock congelado: hay combinaciones que gobiernan el stock' : undefined}
      />
      {/* Imagen: thumbnail + botón subir */}
      <div className="col-span-4 sm:col-span-3 flex items-center gap-1.5">
        <div className="h-8 w-8 rounded border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
          {option.image ? (
            <img src={option.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="h-3.5 w-3.5 text-gray-300" />
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Subir imagen"
          className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500 text-white shadow-sm transition-all hover:bg-green-600 hover:scale-105 active:scale-95 shrink-0"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFile}
          disabled={uploading}
        />
        {option.image && (
          <button
            type="button"
            onClick={() => onUpdate({ image: '' })}
            title="Quitar imagen"
            className="flex h-6 w-6 items-center justify-center rounded text-red-500 hover:bg-red-50 shrink-0"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="col-span-11 sm:col-span-1 flex justify-center">
        <Switch checked={option.available} onCheckedChange={(v) => onUpdate({ available: v })} aria-label="Disponible" />
      </div>
      <div className="col-span-1 flex justify-end">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={onRemove}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function VariantsEditor({
  form,
  setForm,
  optionStockFrozen = false,
  computedStock = 0,
  stockLevel = 'manual',
}: {
  form: ProductFormState;
  setForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
  /** Cuando hay combinaciones, el stock de cada opción individual se congela. */
  optionStockFrozen?: boolean;
  /** Stock total calculado del producto (combinaciones > opciones > manual). */
  computedStock?: number;
  /** Nivel activo de cálculo de stock. */
  stockLevel?: 'combinations' | 'options' | 'manual';
}) {
  const addGroup = () => {
    setForm({
      ...form,
      variantGroups: [
        ...form.variantGroups,
        {
          id: genLocalId('vg'),
          name: '',
          required: false,
          maxSelect: 1,
          isImageGroup: false,
          isDominant: false,
          sortOrder: form.variantGroups.length,
          options: [],
        },
      ],
    });
  };

  const updateGroup = (gid: string, patch: Partial<ProductFormState['variantGroups'][number]>) => {
    setForm({
      ...form,
      variantGroups: form.variantGroups.map((g) => (g.id === gid ? { ...g, ...patch } : g)),
    });
  };

  const removeGroup = (gid: string) => {
    setForm({
      ...form,
      variantGroups: form.variantGroups.filter((g) => g.id !== gid),
      combinations: form.combinations.filter((c) => !c.optionIds.some((oid) => form.variantGroups.find((g) => g.id === gid)?.options.some((o) => o.id === oid))),
    });
  };

  const addOption = (gid: string) => {
    setForm({
      ...form,
      variantGroups: form.variantGroups.map((g) =>
        g.id === gid
          ? {
              ...g,
              options: [
                ...g.options,
                {
                  id: genLocalId('vo'),
                  name: '',
                  priceMod: 0,
                  image: '',
                  stock: 0,
                  available: true,
                  sortOrder: g.options.length,
                },
              ],
            }
          : g
      ),
    });
  };

  const updateOption = (gid: string, oid: string, patch: Partial<ProductFormState['variantGroups'][number]['options'][number]>) => {
    setForm({
      ...form,
      variantGroups: form.variantGroups.map((g) =>
        g.id === gid
          ? { ...g, options: g.options.map((o) => (o.id === oid ? { ...o, ...patch } : o)) }
          : g
      ),
    });
  };

  const removeOption = (gid: string, oid: string) => {
    setForm({
      ...form,
      variantGroups: form.variantGroups.map((g) =>
        g.id === gid ? { ...g, options: g.options.filter((o) => o.id !== oid) } : g
      ),
      combinations: form.combinations.filter((c) => !c.optionIds.includes(oid)),
    });
  };

  const generateCombs = () => {
    const combs = generateCombinationsFromForm(form.variantGroups);
    if (combs.length === 0) return;
    setForm({ ...form, combinations: combs });
  };

  /** Marcar un grupo como dominante (desmarca los demás, ya que sólo puede haber uno). */
  const setDominant = (gid: string) => {
    setForm({
      ...form,
      variantGroups: form.variantGroups.map((g) => ({ ...g, isDominant: g.id === gid })),
    });
  };

  /** Re-aplica a las combinaciones existentes la imagen del grupo dominante. */
  const applyDominantImages = () => {
    setForm({ ...form, combinations: reapplyDominantImages(form) });
  };

  const updateComb = (cid: string, patch: Partial<ProductFormState['combinations'][number]>) => {
    setForm({
      ...form,
      combinations: form.combinations.map((c) => (c.id === cid ? { ...c, ...patch } : c)),
    });
  };

  const removeComb = (cid: string) => {
    setForm({ ...form, combinations: form.combinations.filter((c) => c.id !== cid) });
  };

  // Mapa optionId -> name para mostrar nombres en la tabla
  const optNameMap: Record<string, string> = {};
  for (const g of form.variantGroups) {
    for (const o of g.options) {
      optNameMap[o.id] = o.name;
    }
  }

  // ¿Hay algún grupo marcado como dominante? (sólo relevante cuando hay 2+ grupos)
  const hasDominant = form.variantGroups.some((g) => g.isDominant);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Grupos de variantes</Label>
          <p className="text-xs text-gray-500">Ej: Tamaño, Color, Sabor. Necesitas 2+ grupos para generar combinaciones.</p>
        </div>
        <Button type="button" onClick={addGroup} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Grupo
        </Button>
      </div>

      {form.variantGroups.length === 0 && (
        <p className="text-sm text-gray-400 italic">Sin grupos de variantes. Este producto no tiene variantes.</p>
      )}

      {/* Aviso de stock total calculado cuando hay grupos de variantes */}
      {form.variantGroups.length > 0 && (() => {
        return (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-snug">
              El stock general del producto está <strong>congelado</strong>.{' '}
              {stockLevel === 'combinations' ? (
                <>
                  Como hay combinaciones, se calcula como la <strong>suma del stock de las combinaciones</strong>.
                  El stock individual de cada opción está <strong>congelado</strong> (sólo referencia) porque
                  las combinaciones tienen prioridad.
                </>
              ) : stockLevel === 'options' ? (
                <>
                  Como no hay combinaciones, se calcula como la <strong>suma del stock de las opciones</strong>.
                  Si creas combinaciones, el stock pasará a gobernarse por ellas y el de las opciones se congelará.
                </>
              ) : null}
              <br />
              Stock total actual: <strong>{computedStock}</strong> unidades.
            </div>
          </div>
        );
      })()}

      {form.variantGroups.map((g) => (
        <Card key={g.id} className="border-gray-200">
          <CardContent className="p-3 space-y-3">
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 sm:col-span-5">
                <Label className="text-xs">Nombre del grupo</Label>
                <Input value={g.name} onChange={(e) => updateGroup(g.id, { name: e.target.value })} placeholder="Tamaño" />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Label className="text-xs">Max sel.</Label>
                <Input type="number" min={1} value={g.maxSelect} onChange={(e) => updateGroup(g.id, { maxSelect: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="col-span-4 sm:col-span-2 flex items-center gap-2 pb-2">
                <Switch checked={g.required} onCheckedChange={(v) => updateGroup(g.id, { required: v })} id={`req-${g.id}`} />
                <Label htmlFor={`req-${g.id}`} className="text-xs">Requerido</Label>
              </div>
              <div className="col-span-4 sm:col-span-2 flex items-center gap-2 pb-2">
                <Switch checked={g.isImageGroup} onCheckedChange={(v) => updateGroup(g.id, { isImageGroup: v })} id={`img-${g.id}`} />
                <Label htmlFor={`img-${g.id}`} className="text-xs">C/ imagen</Label>
              </div>
              <div className="col-span-12 sm:col-span-1 flex justify-end">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeGroup(g.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Selector de grupo dominante: sólo se muestra cuando hay 2+ grupos.
                Sólo un grupo puede ser dominante a la vez. */}
            {form.variantGroups.length >= 2 && (
              <label className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-amber-50/60 border border-amber-200 cursor-pointer w-fit">
                <input
                  type="radio"
                  name="dominant-group"
                  checked={!!g.isDominant}
                  onChange={() => setDominant(g.id)}
                  className="h-3.5 w-3.5 accent-amber-500"
                />
                <span className="text-xs font-medium text-amber-800">
                  Grupo dominante
                  {g.isDominant && <span className="ml-1 text-amber-600">· las combinaciones toman su imagen</span>}
                </span>
              </label>
            )}

            {/* Opciones del grupo */}
            <div className="space-y-2 pl-2 border-l-2 border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">Opciones</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => addOption(g.id)}>
                  <Plus className="h-3 w-3 mr-1" /> Opción
                </Button>
              </div>
              {g.options.length === 0 && <p className="text-xs text-gray-400 italic">Sin opciones.</p>}
              {g.options.length > 0 && (
                <div className="grid grid-cols-12 gap-2 px-1">
                  <span className="col-span-12 sm:col-span-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Nombre</span>
                  <span className="col-span-4 sm:col-span-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">+ Precio</span>
                  <span className="col-span-4 sm:col-span-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Stock</span>
                  <span className="col-span-4 sm:col-span-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Imagen</span>
                  <span className="col-span-12 sm:col-span-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">Disp.</span>
                </div>
              )}
              {g.options.map((o) => (
                <VariantOptionRow
                  key={o.id}
                  option={o}
                  onUpdate={(patch) => updateOption(g.id, o.id, patch)}
                  onRemove={() => removeOption(g.id, o.id)}
                  stockFrozen={optionStockFrozen}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Combinaciones */}
      {form.variantGroups.filter((g) => g.options.length > 0).length >= 2 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Label>Combinaciones</Label>
            <div className="flex gap-2 flex-wrap">
              {hasDominant && form.combinations.length > 0 && (
                <Button
                  type="button"
                  onClick={applyDominantImages}
                  size="sm"
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  title="Sobrescribe las imágenes de todas las combinaciones con la imagen de la opción del grupo dominante"
                >
                  <ImagePlus className="h-3.5 w-3.5 mr-1" /> Aplicar imágenes del dominante
                </Button>
              )}
              <Button type="button" onClick={generateCombs} size="sm" className="bg-amber-500 hover:bg-amber-600">
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Generar combinaciones
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            El <strong>stock</strong> mostrado al cliente se toma de las combinaciones (no del stock individual de cada opción).
            La <strong>imagen</strong> de cada combinación se autocompleta con la imagen de la opción del grupo dominante, pero puedes editarla manualmente.
          </p>
          {form.combinations.length === 0 ? (
            <p className="text-xs text-gray-500 italic">Haz clic en &quot;Generar combinaciones&quot; para crear el producto cartesiano.</p>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Imagen</TableHead>
                    <TableHead>Combinación</TableHead>
                    <TableHead className="w-28">SKU</TableHead>
                    <TableHead className="w-20">Stock</TableHead>
                    <TableHead className="w-24">Precio</TableHead>
                    <TableHead className="w-16">Disp.</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.combinations.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <CombinationImageCell
                          value={c.image}
                          onChange={(v) => updateComb(c.id, { image: v })}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-gray-700">
                        {c.optionIds.map((oid) => optNameMap[oid] || '?').join(' / ')}
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-7 w-24 text-xs"
                          value={c.sku}
                          onChange={(e) => updateComb(c.id, { sku: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-7 w-16 text-xs"
                          type="number"
                          value={c.stock}
                          onChange={(e) => updateComb(c.id, { stock: parseInt(e.target.value) || 0 })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-7 w-20 text-xs"
                          type="number"
                          step="0.01"
                          value={c.price ?? ''}
                          placeholder="auto"
                          onChange={(e) => {
                            const v = e.target.value;
                            updateComb(c.id, { price: v === '' ? null : parseFloat(v) || 0 });
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={c.available} onCheckedChange={(v) => updateComb(c.id, { available: v })} />
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeComb(c.id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Celda de imagen para combinaciones: thumbnail + subir + URL + quitar. */
function CombinationImageCell({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await optimizeImage(file);
      onChange(dataUrl);
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="h-8 w-8 rounded border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImagePlus className="h-3.5 w-3.5 text-gray-300" />
        )}
      </div>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        title="Subir imagen"
        className="flex h-7 w-7 items-center justify-center rounded-md bg-green-500 text-white shadow-sm transition-all hover:bg-green-600 hover:scale-105 active:scale-95 shrink-0"
      >
        {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFile}
        disabled={uploading}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          title="Quitar imagen"
          className="flex h-6 w-6 items-center justify-center rounded text-red-500 hover:bg-red-50 shrink-0"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function ExtrasEditor({
  form,
  setForm,
}: {
  form: ProductFormState;
  setForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
}) {
  const addExtra = () => {
    setForm({
      ...form,
      productExtras: [
        ...form.productExtras,
        {
          id: genLocalId('pex'),
          name: '',
          description: '',
          priceMod: 0,
          required: false,
          sortOrder: form.productExtras.length,
        },
      ],
    });
  };

  const updateExtra = (eid: string, patch: Partial<ProductFormState['productExtras'][number]>) => {
    setForm({
      ...form,
      productExtras: form.productExtras.map((e) => (e.id === eid ? { ...e, ...patch } : e)),
    });
  };

  const removeExtra = (eid: string) => {
    setForm({ ...form, productExtras: form.productExtras.filter((e) => e.id !== eid) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label>Extras del producto</Label>
          <p className="text-xs text-gray-500">Adicionales que el cliente puede elegir (ej: &quot;Añadir queso extra&quot;).</p>
        </div>
        <Button type="button" onClick={addExtra} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Extra
        </Button>
      </div>
      {form.productExtras.length === 0 && (
        <p className="text-sm text-gray-400 italic">Sin extras. El cliente no podrá añadir adicionales.</p>
      )}
      {form.productExtras.map((e) => (
        <Card key={e.id} className="border-gray-200">
          <CardContent className="p-3 grid grid-cols-12 gap-2 items-end">
            <div className="col-span-12 sm:col-span-4">
              <Label className="text-xs">Nombre</Label>
              <Input value={e.name} onChange={(ev) => updateExtra(e.id, { name: ev.target.value })} placeholder="Queso extra" />
            </div>
            <div className="col-span-12 sm:col-span-4">
              <Label className="text-xs">Descripción</Label>
              <Input value={e.description} onChange={(ev) => updateExtra(e.id, { description: ev.target.value })} placeholder="Opcional" />
            </div>
            <div className="col-span-6 sm:col-span-2">
              <Label className="text-xs">Precio (+)</Label>
              <Input type="number" step="0.01" value={e.priceMod} onChange={(ev) => updateExtra(e.id, { priceMod: parseFloat(ev.target.value) || 0 })} />
            </div>
            <div className="col-span-4 sm:col-span-1 flex items-center gap-2 pb-2">
              <Switch checked={e.required} onCheckedChange={(v) => updateExtra(e.id, { required: v })} id={`reqex-${e.id}`} />
              <Label htmlFor={`reqex-${e.id}`} className="text-xs">Oblig.</Label>
            </div>
            <div className="col-span-2 sm:col-span-1 flex justify-end">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeExtra(e.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Pestañas del overlay de edición de producto a pantalla completa
const PRODUCT_EDIT_TABS: { value: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'info', label: 'Info', icon: Package },
  { value: 'availability', label: 'Disponibilidad', icon: Store },
  { value: 'oferta', label: 'Oferta', icon: Tags },
  { value: 'tags', label: 'Etiquetas', icon: Tags },
  { value: 'gallery', label: 'Galería', icon: ImagePlus },
  { value: 'variants', label: 'Variantes', icon: Layers },
  { value: 'extras', label: 'Extras', icon: Plus },
  { value: 'wholesale', label: 'Por mayor', icon: DollarSign },
  { value: 'reservation', label: 'Reserva', icon: CalendarClock },
  { value: 'promo', label: 'Promo', icon: Percent },
];

function WholesaleTiersEditor({
  form,
  setForm,
  computedStock = 0,
}: {
  form: ProductFormState;
  setForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
  /** Stock total actual del producto (para sugerir maxQty del último rango). */
  computedStock?: number;
}) {
  const addTier = () => {
    // El nuevo rango se añade al final. Su minQty por defecto es el maxQty
    // del rango anterior + 1 (o 1 si no hay rangos), y su maxQty por defecto
    // es el stock actual del producto (o 0 = sin límite si no hay stock).
    const sorted = [...form.wholesaleTiers].sort((a, b) => (a.minQty - b.minQty) || (a.sortOrder - b.sortOrder));
    const lastMax = sorted.length > 0 ? sorted[sorted.length - 1].maxQty : 0;
    const newMin = Math.max(1, (lastMax || 0) + 1);
    setForm({
      ...form,
      wholesaleTiers: [
        ...form.wholesaleTiers,
        {
          id: genLocalId('wt'),
          name: '',
          minQty: newMin,
          maxQty: computedStock > 0 ? computedStock : 0,
          price: 0,
          sortOrder: form.wholesaleTiers.length,
        },
      ],
    });
  };

  const updateTier = (tid: string, patch: Partial<ProductFormState['wholesaleTiers'][number]>) => {
    setForm({
      ...form,
      wholesaleTiers: form.wholesaleTiers.map((t) => (t.id === tid ? { ...t, ...patch } : t)),
    });
  };

  const removeTier = (tid: string) => {
    setForm({
      ...form,
      wholesaleTiers: form.wholesaleTiers.filter((t) => t.id !== tid),
    });
  };

  // Rangos ordenados por minQty asc
  const tiers = [...form.wholesaleTiers].sort((a, b) => (a.minQty - b.minQty) || (a.sortOrder - b.sortOrder));

  // ── Validaciones de rangos ──
  const validationIssues: string[] = [];
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    const label = t.name?.trim() || `Rango ${i + 1}`;
    // minQty > 0
    if (t.minQty <= 0) {
      validationIssues.push(`"${label}": la cantidad mínima debe ser mayor que 0.`);
    }
    // maxQty == 0 (sin límite) sólo permitido en el ÚLTIMO rango
    if (t.maxQty === 0 && i !== tiers.length - 1) {
      validationIssues.push(`"${label}": la cantidad máxima no puede ser 0 (sin límite) si hay rangos posteriores. Sólo el último rango puede no tener límite.`);
    }
    // minQty <= maxQty (cuando maxQty != 0)
    if (t.maxQty !== 0 && t.minQty > t.maxQty) {
      validationIssues.push(`"${label}": la cantidad mínima (${t.minQty}) no puede ser mayor que la máxima (${t.maxQty}).`);
    }
    // precio >= 0
    if (t.price < 0) {
      validationIssues.push(`"${label}": el precio no puede ser negativo.`);
    }
    // solapamiento con el siguiente rango
    if (i < tiers.length - 1) {
      const next = tiers[i + 1];
      if (t.maxQty !== 0 && next.minQty <= t.maxQty) {
        validationIssues.push(`"${label}" y "${next.name?.trim() || `Rango ${i + 2}`}": hay solapamiento o hueco (máx ${t.maxQty} → mín ${next.minQty}). El siguiente rango debe empezar en ${t.maxQty + 1} o más.`);
      }
    }
  }
  // precio descendente (recomendación, no error bloqueante)
  const priceWarning: string[] = [];
  for (let i = 1; i < tiers.length; i++) {
    if (tiers[i].price >= tiers[i - 1].price) {
      priceWarning.push(`El precio del rango ${i + 1} debería ser menor que el del rango ${i} (los precios al por mayor suelen bajar con más cantidad).`);
      break;
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label>Rangos de precios al por mayor</Label>
          <p className="text-xs text-gray-500">
            Define precios por rango de cantidad. El <strong>nombre es opcional</strong> (se autogenera como "Rango 1", "Rango 2", etc.).
            {' '}La <strong>cantidad máxima del último rango</strong> se sugiere automáticamente como el stock actual del producto ({computedStock} unidades); 0 = sin límite.
          </p>
        </div>
        <Button type="button" onClick={addTier} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Rango
        </Button>
      </div>

      {tiers.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Sin rangos. Agrega al menos uno para activar precios por volumen.</p>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Nombre <span className="text-gray-400 font-normal">(opcional)</span></TableHead>
                <TableHead className="w-28">Cant. mínima</TableHead>
                <TableHead className="w-32">Cant. máxima</TableHead>
                <TableHead className="w-32">Precio por unidad</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((t, idx) => {
                const isLast = idx === tiers.length - 1;
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Input
                        className="h-8 text-sm"
                        value={t.name}
                        onChange={(e) => updateTier(t.id, { name: e.target.value })}
                        placeholder={`Rango ${idx + 1}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 text-sm"
                        type="number"
                        min={0}
                        value={t.minQty}
                        onChange={(e) => updateTier(t.id, { minQty: parseInt(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Input
                          className="h-8 text-sm"
                          type="number"
                          min={0}
                          value={t.maxQty}
                          onChange={(e) => updateTier(t.id, { maxQty: parseInt(e.target.value) || 0 })}
                          title={isLast ? '0 = sin límite (último rango)' : 'Cantidad máxima del rango'}
                        />
                        {isLast && (
                          <button
                            type="button"
                            onClick={() => updateTier(t.id, { maxQty: computedStock > 0 ? computedStock : 0 })}
                            title={`Usar stock actual (${computedStock})`}
                            className="text-[10px] px-1.5 py-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors whitespace-nowrap"
                          >
                            = stock
                          </button>
                        )}
                      </div>
                      {isLast && t.maxQty === 0 && (
                        <p className="text-[10px] text-emerald-600 mt-0.5">0 = sin límite</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 text-sm"
                        type="number"
                        step="0.01"
                        value={t.price}
                        onChange={(e) => updateTier(t.id, { price: parseFloat(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500"
                        onClick={() => removeTier(t.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Errores de validación (bloqueantes) */}
      {validationIssues.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-red-700 leading-snug">
            <strong>Revisa los rangos antes de guardar:</strong>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              {validationIssues.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Advertencia de precios (no bloqueante) */}
      {validationIssues.length === 0 && priceWarning.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">{priceWarning[0]}</p>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Los rangos se ordenan automáticamente por cantidad mínima al mostrarlos en la tienda.
        Si el nombre está vacío, se mostrará "Rango 1", "Rango 2", etc.
      </p>
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  // Form state
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [loadingDetail, setLoadingDetail] = useState(false);
  // Pestaña activa del overlay de edición a pantalla completa
  const [editTab, setEditTab] = useState<string>('info');
  // Feedback visual tras guardar (banner verde que desaparece solo).
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories'),
      ]);
      setProducts(await pRes.json());
      setCategories(await cRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setEditingProduct(null);
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id || '' });
    setEditTab('info');
    setSavedFeedback(null);
    setDialogOpen(true);
  };

  const openEdit = async (p: Product) => {
    setEditingProduct(p);
    setLoadingDetail(true);
    setEditTab('info');
    setSavedFeedback(null);
    setDialogOpen(true);
    // Cargar detalle completo (con variant groups, combinations, extras)
    try {
      const res = await fetch(`/api/products/${p.id}`);
      const detail = res.ok ? await res.json() : null;
      let parsedImages = '[]';
      try { parsedImages = typeof detail?.images === 'string' ? detail.images : JSON.stringify(detail?.images ?? []); } catch { /* ignore */ }
      let parsedTags = '[]';
      try { parsedTags = typeof detail?.tags === 'string' ? detail.tags : JSON.stringify(detail?.tags ?? []); } catch { /* ignore */ }
      const vGroups: ProductFormState['variantGroups'] = Array.isArray(detail?.variantGroups)
        ? detail.variantGroups.map((g: VariantGroup & { options?: VariantOption[] }) => ({
            id: g.id,
            name: g.name,
            required: g.required,
            maxSelect: g.maxSelect,
            isImageGroup: g.isImageGroup,
            isDominant: g.isDominant === true,
            sortOrder: g.sortOrder,
            options: (g.options || []).map((o) => ({
              id: o.id,
              name: o.name,
              priceMod: o.priceMod,
              image: o.image,
              stock: o.stock,
              available: o.available,
              sortOrder: o.sortOrder,
            })),
          }))
        : [];
      const combs: ProductFormState['combinations'] = Array.isArray(detail?.combinations)
        ? detail.combinations.map((c: Combination) => {
            let ids: string[] = [];
            try { const p = JSON.parse(c.optionIds || '[]'); if (Array.isArray(p)) ids = p.filter((x: unknown) => typeof x === 'string'); } catch { /* ignore */ }
            return {
              id: c.id,
              optionIds: ids,
              sku: c.sku,
              stock: c.stock,
              price: c.price,
              image: c.image,
              available: c.available,
              sortOrder: c.sortOrder,
            };
          })
        : [];
      const extras: ProductFormState['productExtras'] = Array.isArray(detail?.productExtras)
        ? detail.productExtras.map((e: ProductExtra) => ({
            id: e.id,
            name: e.name,
            description: e.description,
            priceMod: e.priceMod,
            required: e.required,
            sortOrder: e.sortOrder,
          }))
        : [];
      const wTiers: ProductFormState['wholesaleTiers'] = Array.isArray(detail?.wholesaleTiers)
        ? detail.wholesaleTiers.map((t: WholesaleTier) => ({
            id: t.id,
            name: t.name,
            minQty: t.minQty,
            maxQty: t.maxQty,
            price: t.price,
            sortOrder: t.sortOrder,
          }))
        : [];
      setForm({
        name: p.name,
        shortName: p.shortName || '',
        sku: p.sku || '',
        description: p.description,
        price: p.price,
        image: p.image,
        images: parsedImages,
        tags: parsedTags,
        categoryId: p.categoryId,
        stock: p.stock,
        featured: p.featured,
        order: p.order,
        // SIGECOS: unidad y código
        saleUnit: (detail?.saleUnit ?? p.saleUnit) || 'unidad',
        barcode: (detail?.barcode ?? p.barcode) ?? '',
        // SIGECOS: tipo y estado
        productType: (detail?.productType ?? p.productType) || 'elaborado',
        status: (detail?.status ?? p.status) || 'active',
        // SIGECOS: disponibilidad
        posAvailable: detail?.posAvailable ?? p.posAvailable ?? true,
        tiendaAvailable: detail?.tiendaAvailable ?? p.tiendaAvailable ?? true,
        // SIGECOS: anticipo
        advanceType: (detail?.advanceType ?? p.advanceType) || 'sin',
        advanceValue: Number(detail?.advanceValue ?? p.advanceValue ?? 0),
        minHours: Number(detail?.minHours ?? p.minHours ?? 24),
        minHoursUnit: (detail?.minHoursUnit ?? p.minHoursUnit) === 'dias' ? 'dias' : 'horas',
        // SIGECOS: costos (admin only)
        costPrice: Number(detail?.costPrice ?? p.costPrice ?? 0),
        marginPercent: Number(detail?.marginPercent ?? p.marginPercent ?? 0),
        offerEnabled: p.offerEnabled ?? false,
        offerType: p.offerType || 'permanente',
        offerPrice: p.offerPrice ?? 0,
        offerStart: p.offerStart ?? null,
        offerEnd: p.offerEnd ?? null,
        wholesaleEnabled: detail?.wholesaleEnabled ?? p.wholesaleEnabled ?? false,
        wholesalePrice: detail?.wholesalePrice ?? p.wholesalePrice ?? 0,
        wholesaleMinQty: detail?.wholesaleMinQty ?? p.wholesaleMinQty ?? 10,
        wholesaleTiers: wTiers,
        reservationEnabled: detail?.reservationEnabled ?? p.reservationEnabled ?? false,
        maxReservations: detail?.maxReservations ?? p.maxReservations ?? 50,
        reservationDays: detail?.reservationDays ?? p.reservationDays ?? 7,
        reservationDeposit: detail?.reservationDeposit ?? p.reservationDeposit ?? 0,
        promoEnabled: detail?.promoEnabled ?? p.promoEnabled ?? false,
        promoType: detail?.promoType ?? p.promoType ?? 'discount',
        promoValue: detail?.promoValue ?? p.promoValue ?? 0,
        promoBuyQty: detail?.promoBuyQty ?? p.promoBuyQty ?? 0,
        promoGetQty: detail?.promoGetQty ?? p.promoGetQty ?? 0,
        promoStart: detail?.promoStart ?? p.promoStart ?? null,
        promoEnd: detail?.promoEnd ?? p.promoEnd ?? null,
        variantGroups: vGroups,
        combinations: combs,
        productExtras: extras,
      });
    } catch (err) {
      console.error('Error loading product detail:', err);
      setForm({
        name: p.name,
        shortName: p.shortName || '',
        sku: p.sku || '',
        description: p.description,
        price: p.price,
        image: p.image,
        images: p.images || '[]',
        tags: p.tags || '[]',
        categoryId: p.categoryId,
        stock: p.stock,
        featured: p.featured,
        order: p.order,
        saleUnit: p.saleUnit || 'unidad',
        barcode: p.barcode ?? '',
        productType: p.productType || 'elaborado',
        status: p.status || 'active',
        posAvailable: p.posAvailable ?? true,
        tiendaAvailable: p.tiendaAvailable ?? true,
        advanceType: p.advanceType || 'sin',
        advanceValue: Number(p.advanceValue ?? 0),
        minHours: Number(p.minHours ?? 24),
        minHoursUnit: p.minHoursUnit === 'dias' ? 'dias' : 'horas',
        costPrice: Number(p.costPrice ?? 0),
        marginPercent: Number(p.marginPercent ?? 0),
        offerEnabled: p.offerEnabled ?? false,
        offerType: p.offerType || 'permanente',
        offerPrice: p.offerPrice ?? 0,
        offerStart: p.offerStart ?? null,
        offerEnd: p.offerEnd ?? null,
        wholesaleEnabled: p.wholesaleEnabled ?? false,
        wholesalePrice: p.wholesalePrice ?? 0,
        wholesaleMinQty: p.wholesaleMinQty ?? 10,
        wholesaleTiers: [],
        reservationEnabled: p.reservationEnabled ?? false,
        maxReservations: p.maxReservations ?? 50,
        reservationDays: p.reservationDays ?? 7,
        reservationDeposit: p.reservationDeposit ?? 0,
        promoEnabled: p.promoEnabled ?? false,
        promoType: p.promoType ?? 'discount',
        promoValue: p.promoValue ?? 0,
        promoBuyQty: p.promoBuyQty ?? 0,
        promoGetQty: p.promoGetQty ?? 0,
        promoStart: p.promoStart ?? null,
        promoEnd: p.promoEnd ?? null,
        variantGroups: [],
        combinations: [],
        productExtras: [],
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  // ═══ Stock del producto: prioridad combinaciones > opciones > stock general ═══
  //
  // 1. Si hay combinaciones → el stock se calcula como la SUMA del stock de las
  //    combinaciones. El stock de cada OPCIÓN individual se congela (no es editable
  //    porque ya no gobierna el stock) y se muestra como referencia.
  // 2. Si NO hay combinaciones pero SÍ hay opciones de variantes → el stock se
  //    calcula como la SUMA del stock de las opciones.
  // 3. Si no hay variantes → se usa el campo `stock` editables directamente.
  const hasVariantGroups = form.variantGroups.length > 0;
  const hasVariantOptions = hasVariantGroups && form.variantGroups.some((g) => g.options.length > 0);
  const hasCombinations = form.combinations.length > 0;

  // Suma del stock de todas las opciones de todos los grupos (nivel 2)
  const optionsStockSum = useMemo(() => {
    return form.variantGroups.reduce(
      (total, g) => total + g.options.reduce((sub, o) => sub + (Number(o.stock) || 0), 0),
      0,
    );
  }, [form.variantGroups]);

  // Suma del stock de todas las combinaciones (nivel 1, máxima prioridad)
  const combinationsStockSum = useMemo(() => {
    return form.combinations.reduce((total, c) => total + (Number(c.stock) || 0), 0);
  }, [form.combinations]);

  // Stock calculado según la prioridad: combinaciones > opciones > stock general
  const computedStock = hasCombinations
    ? combinationsStockSum
    : hasVariantOptions
      ? optionsStockSum
      : form.stock;

  // Nivel activo para mostrar en los avisos
  const stockLevel: 'combinations' | 'options' | 'manual' = hasCombinations
    ? 'combinations'
    : hasVariantOptions
      ? 'options'
      : 'manual';

  // ¿Está el campo stock general congelado? (sí cuando hay opciones o combinaciones)
  const stockFrozen = hasVariantOptions || hasCombinations;

  // ¿Está el stock de cada opción congelado? (sí cuando hay combinaciones)
  const optionStockFrozen = hasCombinations;

  const handleSave = async () => {
    // ── Validaciones previas al guardado ──
    // 1. Fechas de oferta: fin no puede ser anterior a inicio
    if (form.offerType === 'temporada' && form.offerEnabled && form.offerStart && form.offerEnd) {
      if (form.offerEnd < form.offerStart) {
        alert('La fecha de fin de la oferta no puede ser anterior a la fecha de inicio. Corrige las fechas antes de guardar.');
        setSaving(false);
        return;
      }
    }
    // 2. Si es de temporada y sólo tiene una fecha, advertir
    if (form.offerType === 'temporada' && form.offerEnabled && ((!form.offerStart) !== (!form.offerEnd))) {
      alert('Si la oferta es de temporada, debes definir ambas fechas (inicio y fin), o cambiar el tipo a "Permanente".');
      setSaving(false);
      return;
    }
    // 3. Validar rangos al por mayor (si hay)
    if (form.wholesaleTiers.length > 0) {
      const sorted = [...form.wholesaleTiers].sort((a, b) => (a.minQty - b.minQty) || (a.sortOrder - b.sortOrder));
      const issues: string[] = [];
      for (let i = 0; i < sorted.length; i++) {
        const t = sorted[i];
        const label = t.name?.trim() || `Rango ${i + 1}`;
        if (t.minQty <= 0) issues.push(`"${label}": la cantidad mínima debe ser mayor que 0.`);
        if (t.maxQty === 0 && i !== sorted.length - 1) issues.push(`"${label}": la cantidad máxima no puede ser 0 (sin límite) si hay rangos posteriores.`);
        if (t.maxQty !== 0 && t.minQty > t.maxQty) issues.push(`"${label}": la cantidad mínima (${t.minQty}) no puede ser mayor que la máxima (${t.maxQty}).`);
        if (t.price < 0) issues.push(`"${label}": el precio no puede ser negativo.`);
        if (i < sorted.length - 1) {
          const next = sorted[i + 1];
          if (t.maxQty !== 0 && next.minQty <= t.maxQty) {
            issues.push(`"${label}" y "${next.name?.trim() || `Rango ${i + 2}`}": hay solapamiento o hueco. El siguiente rango debe empezar en ${t.maxQty + 1} o más.`);
          }
        }
      }
      if (issues.length > 0) {
        alert('Revisa los rangos al por mayor:\n\n• ' + issues.join('\n• '));
        setSaving(false);
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        shortName: form.shortName,
        sku: form.sku,
        description: form.description,
        price: form.price,
        image: form.image,
        images: form.images,
        tags: form.tags,
        categoryId: form.categoryId,
        // Si hay variantes/combinaciones, el stock general se calcula automáticamente
        // según la prioridad combinaciones > opciones; el campo queda congelado en la UI.
        stock: stockFrozen ? computedStock : form.stock,
        featured: form.featured,
        order: form.order,
        // SIGECOS
        saleUnit: form.saleUnit,
        barcode: form.barcode,
        productType: form.productType,
        status: form.status,
        posAvailable: form.posAvailable,
        tiendaAvailable: form.tiendaAvailable,
        advanceType: form.advanceType,
        advanceValue: form.advanceValue,
        minHours: form.minHours,
        minHoursUnit: form.minHoursUnit,
        costPrice: form.costPrice,
        marginPercent: form.marginPercent,
        offerEnabled: form.offerEnabled,
        offerType: form.offerType,
        offerPrice: form.offerPrice,
        offerStart: form.offerStart,
        offerEnd: form.offerEnd,
        wholesaleEnabled: form.wholesaleEnabled,
        wholesalePrice: form.wholesalePrice,
        wholesaleMinQty: form.wholesaleMinQty,
        wholesaleTiers: [...form.wholesaleTiers]
          .sort((a, b) => (a.minQty - b.minQty) || (a.sortOrder - b.sortOrder))
          .map((t, ti) => ({
            name: t.name?.trim() || `Rango ${ti + 1}`,
            minQty: t.minQty,
            maxQty: t.maxQty,
            price: t.price,
            sortOrder: ti,
          })),
        reservationEnabled: form.reservationEnabled,
        maxReservations: form.maxReservations,
        reservationDays: form.reservationDays,
        reservationDeposit: form.reservationDeposit,
        promoEnabled: form.promoEnabled,
        promoType: form.promoType,
        promoValue: form.promoValue,
        promoBuyQty: form.promoBuyQty,
        promoGetQty: form.promoGetQty,
        promoStart: form.promoStart,
        promoEnd: form.promoEnd,
        variantGroups: form.variantGroups.map((g, gi) => ({
          id: g.id,
          name: g.name,
          required: g.required,
          maxSelect: g.maxSelect,
          isImageGroup: g.isImageGroup,
          isDominant: g.isDominant === true,
          sortOrder: g.sortOrder ?? gi,
          options: g.options.map((o, oi) => ({
            id: o.id,
            name: o.name,
            priceMod: o.priceMod,
            image: o.image,
            stock: o.stock,
            available: o.available,
            sortOrder: o.sortOrder ?? oi,
          })),
        })),
        combinations: form.combinations.map((c, ci) => ({
          id: c.id,
          optionIds: JSON.stringify(c.optionIds),
          sku: c.sku,
          stock: c.stock,
          price: c.price,
          image: c.image,
          available: c.available,
          sortOrder: c.sortOrder ?? ci,
        })),
        productExtras: form.productExtras.map((e, ei) => ({
          id: e.id,
          name: e.name,
          description: e.description,
          priceMod: e.priceMod,
          required: e.required,
          sortOrder: e.sortOrder ?? ei,
        })),
      };
      if (editingProduct) {
        const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          // Mostrar feedback de éxito SIN cerrar el overlay, para que el admin
          // pueda seguir revisando o haciendo otros cambios.
          setSavedFeedback(`✓ Cambios guardados correctamente (${new Date().toLocaleTimeString('es-ES')}).`);
          // Auto-ocultar el feedback después de 4 segundos.
          setTimeout(() => setSavedFeedback(null), 4000);
          // Recargar la lista de productos (para que la tabla refleje los cambios).
          fetchData();
          // Actualizar el editingProduct con los campos escalares que el
          // backend pudo haber recalculado (stock congelado, marginPercent).
          // No reemplazamos todo el objeto porque el detalle trae relaciones
          // (variantGroups, combinations, etc.) con tipos más complejos.
          try {
            const detail = await (await fetch(`/api/admin/products/${editingProduct.id}`)).json();
            if (detail && detail.id) {
              setEditingProduct((prev) => prev ? { ...prev, ...detail } : prev);
            }
          } catch {
            /* ignore detail refresh error */
          }
        } else {
          alert('Error al guardar los cambios. Revisa la consola para más detalles.');
        }
      } else {
        // Producto NUEVO: después de crear, sí cerramos el overlay porque el
        // producto recién creado tiene IDs nuevos que el admin no necesita
        // seguir editando inmediatamente.
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setDialogOpen(false);
          fetchData();
        } else {
          alert('Error al crear el producto. Revisa la consola para más detalles.');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error inesperado al guardar. Revisa la consola para más detalles.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/admin/products/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFeatured = async (p: Product) => {
    try {
      await fetch(`/api/admin/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !p.featured }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Agrupar productos por categoría, ordenados por `order`
  const groupedProducts = useMemo(() => {
    const sortedCats = [...categories].sort((a, b) => a.order - b.order);
    return sortedCats.map((cat) => ({
      category: cat,
      products: products
        .filter((p) => p.categoryId === cat.id)
        .sort((a, b) => a.order - b.order),
    }));
  }, [products, categories]);

  // Drag & Drop: reordenar productos dentro de una categoría
  const handleDragStart = (e: React.DragEvent, productId: string) => {
    setDraggedId(productId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, productId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedId !== productId) {
      setDragOverId(productId);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetProductId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetProductId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    // Encontrar el producto arrastrado y el destino
    const dragged = products.find((p) => p.id === draggedId);
    const target = products.find((p) => p.id === targetProductId);
    if (!dragged || !target || dragged.categoryId !== target.categoryId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    // Reordenar localmente
    const catProducts = products
      .filter((p) => p.categoryId === target.categoryId)
      .sort((a, b) => a.order - b.order);
    const draggedIdx = catProducts.findIndex((p) => p.id === draggedId);
    const targetIdx = catProducts.findIndex((p) => p.id === targetProductId);
    const reordered = [...catProducts];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, moved);

    // Asignar nuevos órdenes (0, 1, 2, ...)
    const updates = reordered.map((p, i) => ({ id: p.id, order: i }));

    // Actualizar estado local inmediatamente
    setProducts((cur) => {
      const updated = cur.map((p) => {
        const u = updates.find((u) => u.id === p.id);
        return u ? { ...p, order: u.order } : p;
      });
      return updated;
    });

    // Persistir en el servidor
    try {
      await Promise.all(
        updates.map((u) =>
          fetch(`/api/admin/products/${u.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: u.order }),
          })
        )
      );
    } catch (err) {
      console.error('Error reordering products:', err);
      fetchData();
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const toggleCatCollapse = (catId: string) => {
    setCollapsedCats((cur) => {
      const next = new Set(cur);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
          <p className="text-sm text-gray-500 mt-1">
            Arrastra y suelta para reordenar dentro de cada categoría
          </p>
        </div>
        <Button onClick={openNew} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="h-4 w-4 mr-2" /> Nuevo Producto
        </Button>
      </div>

      {/* Productos agrupados por categoría */}
      <div className="space-y-4">
        {groupedProducts.map(({ category, products: catProducts }) => {
          const isCollapsed = collapsedCats.has(category.id);
          return (
            <Card key={category.id} className="overflow-hidden">
              {/* Header de categoría (clickeable para colapsar) */}
              <div
                className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b cursor-pointer select-none hover:bg-gray-100 transition-colors"
                onClick={() => toggleCatCollapse(category.id)}
              >
                <span className="text-xl">{category.icon}</span>
                <span className="font-semibold text-gray-900 flex-1">{category.name}</span>
                <Badge variant="secondary">{catProducts.length}</Badge>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
              </div>

              {/* Tabla de productos de esta categoría */}
              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead className="w-12">Img</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="hidden sm:table-cell">Destacado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {catProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-400 py-6 text-sm">
                            Sin productos en esta categoría
                          </TableCell>
                        </TableRow>
                      ) : (
                        catProducts.map((p, idx) => (
                          <TableRow
                            key={p.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, p.id)}
                            onDragOver={(e) => handleDragOver(e, p.id)}
                            onDrop={(e) => handleDrop(e, p.id)}
                            onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                            className={`transition-all ${
                              draggedId === p.id ? 'opacity-40' : ''
                            } ${
                              dragOverId === p.id ? 'border-t-2 border-t-amber-400 bg-amber-50' : ''
                            } cursor-grab active:cursor-grabbing hover:bg-gray-50`}
                          >
                            <TableCell className="text-gray-300 select-none">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-mono text-gray-400">{idx + 1}</span>
                                <GripVertical className="h-4 w-4" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover" />
                            </TableCell>
                            <TableCell className="font-medium max-w-[200px] truncate">{p.name}</TableCell>
                            <TableCell className="font-semibold">${p.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <span className={`text-sm font-medium ${p.stock <= 5 ? 'text-red-500' : 'text-gray-700'}`}>
                                {p.stock}
                              </span>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toggleFeatured(p); }}>
                                <Star className={`h-4 w-4 ${p.featured ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                              </Button>
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => setDeleteId(p.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Full-screen Product Edit Overlay */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col">
          {/* Top bar */}
          <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 flex items-center gap-2 shadow-sm shrink-0">
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h1>
              {editingProduct?.name ? (
                <p className="text-xs text-gray-500 truncate hidden md:block">{editingProduct.name}</p>
              ) : null}
            </div>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="hidden sm:inline-flex"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {editingProduct ? 'Guardar' : 'Crear'}
            </Button>
          </div>

          {/* Banner de feedback tras guardar (sólo edición, no creación) */}
          {savedFeedback && editingProduct && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border-b border-green-200 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <span className="flex-1">{savedFeedback}</span>
              <button
                type="button"
                onClick={() => setSavedFeedback(null)}
                className="text-green-600 hover:text-green-800 text-xs"
                aria-label="Cerrar aviso"
              >
                ✕
              </button>
            </div>
          )}

          {/* Body */}
          {loadingDetail ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Vertical tab sidebar (dark) */}
              <aside className="bg-gray-900 text-gray-100 md:w-60 md:shrink-0 overflow-x-auto md:overflow-y-auto">
                <nav className="flex md:flex-col gap-1 p-2 md:p-3 min-w-max md:min-w-0">
                  {PRODUCT_EDIT_TABS.map((t) => {
                    const Icon = t.icon;
                    const active = editTab === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setEditTab(t.value)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                          active
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </aside>

              {/* Content */}
              <div className="flex-1 overflow-y-auto bg-gray-50">
                <div className="p-4 sm:p-6 lg:p-8">
                  {/* INFO */}
                  {editTab === 'info' && (
                    <>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Información general</h2>
                      <p className="text-sm text-gray-500 mb-6">Datos básicos del producto.</p>
                      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
                        {/* Columna izquierda: Imagen + clasificación */}
                        <div className="space-y-5">
                          <MainImageEditor
                            value={form.image}
                            onChange={(v) => setForm({ ...form, image: v })}
                          />
                          <div>
                            <Label>Categoría</Label>
                            <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                              <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                              <SelectContent>
                                {categories.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Tipo de producto</Label>
                            <Select value={form.productType} onValueChange={(v) => setForm({ ...form, productType: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="elaborado">Elaborado</SelectItem>
                                <SelectItem value="mercancia">Mercancía</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Unidad de venta</Label>
                            <Select value={form.saleUnit} onValueChange={(v) => setForm({ ...form, saleUnit: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unidad">unidad</SelectItem>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="lb">lb</SelectItem>
                                <SelectItem value="litro">litro</SelectItem>
                                <SelectItem value="metros">metros</SelectItem>
                                <SelectItem value="caja">caja</SelectItem>
                                <SelectItem value="paquete">paquete</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="flex items-center gap-1.5"><Barcode className="h-3.5 w-3.5" /> Código de barras</Label>
                            <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="EAN-13, UPC, etc." />
                          </div>
                        </div>

                        {/* Columna derecha: Datos + Precios */}
                        <div className="space-y-5">
                          <div>
                            <Label>Nombre</Label>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Brazo Gitano" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label>Nombre corto (opcional)</Label>
                              <Input value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} placeholder="Para tarjetas" />
                            </div>
                            <div>
                              <Label>SKU (auto si vacío)</Label>
                              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="PROD-XXXXXX" />
                            </div>
                          </div>
                          <div>
                            <Label>Descripción</Label>
                            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} />
                          </div>

                          {/* Precios y stock */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <Label>Precio de costo (USD)</Label>
                              <Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div>
                              <Label>Precio de venta (USD)</Label>
                              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div>
                              <Label className="flex items-center gap-1.5">
                                Stock
                                {stockFrozen && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                                    <Lock className="h-2.5 w-2.5" /> Congelado
                                  </span>
                                )}
                              </Label>
                              <Input
                                type="number"
                                value={stockFrozen ? computedStock : form.stock}
                                disabled={stockFrozen}
                                onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                                className={stockFrozen ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
                              />
                            </div>
                          </div>

                          {/* Aviso: stock congelado cuando hay variantes/combinaciones */}
                          {stockFrozen && (
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                              <div className="text-xs text-amber-800 leading-snug">
                                <strong>Stock congelado.</strong>{' '}
                                {stockLevel === 'combinations' ? (
                                  <>
                                    Este producto tiene combinaciones, por lo que el stock general
                                    se calcula como la <strong>suma del stock de las combinaciones</strong>
                                    {' '}(actual: <strong>{computedStock}</strong>). Para modificarlo, edita el stock
                                    de cada combinación en la pestaña <strong>Variantes</strong>.
                                  </>
                                ) : (
                                  <>
                                    Este producto tiene opciones de variantes (sin combinaciones), por lo que
                                    el stock general se calcula como la <strong>suma del stock de las opciones</strong>
                                    {' '}(actual: <strong>{computedStock}</strong>). Para modificarlo, edita el stock
                                    de cada opción en la pestaña <strong>Variantes</strong>.
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Margen calculado */}
                          {(() => {
                            const sp = Number(form.price) || 0;
                            const cp = Number(form.costPrice) || 0;
                            const margin = sp > 0 ? Math.round(((sp - cp) / sp) * 10000) / 100 : 0;
                            const barColor = margin < 20 ? 'bg-red-500' : margin <= 40 ? 'bg-amber-500' : 'bg-green-500';
                            const textColor = margin < 20 ? 'text-red-600' : margin <= 40 ? 'text-amber-600' : 'text-green-600';
                            const label = margin < 20 ? 'Bajo' : margin <= 40 ? 'Medio' : 'Bueno';
                            return (
                              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between text-sm mb-1.5">
                                  <span className="text-gray-700">Margen estimado</span>
                                  <span className={`font-bold ${textColor}`}>{margin.toFixed(2)}% · {label}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${barColor} transition-all`}
                                    style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </>
                  )}

                  {/* DISPONIBILIDAD */}
                  {editTab === 'availability' && (
                    <>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Disponibilidad</h2>
                      <p className="text-sm text-gray-500 mb-6">Dónde se vende el producto y reglas de anticipo (SIGECOS).</p>
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                            <Switch id="tiendaAvailable" checked={form.tiendaAvailable} onCheckedChange={(v) => setForm({ ...form, tiendaAvailable: v })} />
                            <div>
                              <Label htmlFor="tiendaAvailable" className="cursor-pointer text-emerald-800">Disponible en tienda online</Label>
                              <p className="text-xs text-emerald-700">Si está apagado, no aparece en el storefront público.</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <Switch id="posAvailable" checked={form.posAvailable} onCheckedChange={(v) => setForm({ ...form, posAvailable: v })} />
                            <div>
                              <Label htmlFor="posAvailable" className="cursor-pointer text-blue-800">Disponible en POS</Label>
                              <p className="text-xs text-blue-700">Disponible en tienda física / punto de venta.</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="flex items-center gap-1.5"><ToggleLeft className="h-4 w-4" /> Tipo de anticipo</Label>
                          <Select value={form.advanceType} onValueChange={(v) => setForm({ ...form, advanceType: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sin">Sin anticipo</SelectItem>
                              <SelectItem value="porcentaje">Porcentaje</SelectItem>
                              <SelectItem value="monto_fijo">Monto fijo</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">
                            {form.advanceType === 'sin'
                              ? 'No se requiere anticipo: el cliente paga todo al recibir el pedido.'
                              : form.advanceType === 'porcentaje'
                                ? 'El cliente paga un porcentaje del total por adelantado.'
                                : 'El cliente paga un monto fijo por adelantado.'}
                          </p>

                          {/* Valor del anticipo (sólo si no es "sin") */}
                          {form.advanceType !== 'sin' && (
                            <div className="mt-3">
                              <Label>{form.advanceType === 'porcentaje' ? 'Valor del anticipo (%)' : 'Valor del anticipo (USD)'}</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
                                value={form.advanceValue}
                                onChange={(e) => setForm({ ...form, advanceValue: parseFloat(e.target.value) || 0 })}
                              />
                              {form.advanceType === 'porcentaje' && Number(form.advanceValue) > 100 && (
                                <p className="text-xs text-red-600 mt-1">El porcentaje no debería superar 100%.</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Tiempo de anticipación: sólo cuando NO es "sin" */}
                        {form.advanceType !== 'sin' && (
                          <div>
                            <Label>Tiempo mínimo de anticipación</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                min={0}
                                value={form.minHoursUnit === 'dias' ? Math.floor(form.minHours / 24) : form.minHours}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  // Convertir el valor ingresado a horas según la unidad seleccionada
                                  const hours = form.minHoursUnit === 'dias' ? val * 24 : val;
                                  setForm({ ...form, minHours: hours });
                                }}
                                className="flex-1"
                              />
                              <Select
                                value={form.minHoursUnit}
                                onValueChange={(unit) => {
                                  // Al cambiar de unidad, minHours se mantiene en horas (es canónico).
                                  // Sólo cambiamos la unidad para la UX.
                                  setForm({ ...form, minHoursUnit: unit });
                                }}
                              >
                                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="horas">horas</SelectItem>
                                  <SelectItem value="dias">días</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Anticipación mínima con la que el cliente debe hacer el pedido.
                              {' '}Equivalente: <strong>{form.minHours} horas</strong>
                              {form.minHours >= 24 && ` (≈ ${(form.minHours / 24).toFixed(1)} días)`}.
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* OFERTA */}
                  {editTab === 'oferta' && (
                    <>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Oferta</h2>
                      <p className="text-sm text-gray-500 mb-6">Define un precio rebajado. Las ofertas permanentes no necesitan fechas.</p>
                      <div className="space-y-5">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <Switch id="offerEnabled" checked={form.offerEnabled} onCheckedChange={(v) => setForm({ ...form, offerEnabled: v })} />
                          <div>
                            <Label htmlFor="offerEnabled" className="cursor-pointer">Habilitar oferta</Label>
                            <p className="text-xs text-gray-500">Muestra precio de oferta si es menor al precio regular.</p>
                          </div>
                        </div>
                        <div>
                          <Label>Tipo de oferta</Label>
                          <Select value={form.offerType} onValueChange={(v) => setForm({ ...form, offerType: v, ...(v === 'permanente' ? { offerStart: null, offerEnd: null } : {}) })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="permanente">Permanente (sin fechas)</SelectItem>
                              <SelectItem value="temporada">Temporada (con fechas)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Precio de oferta (USD)</Label>
                          <Input type="number" step="0.01" value={form.offerPrice} onChange={(e) => setForm({ ...form, offerPrice: parseFloat(e.target.value) || 0 })} />
                        </div>
                        {form.offerType === 'temporada' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label>Inicio</Label>
                              <Input
                                type="date"
                                value={form.offerStart ?? ''}
                                onChange={(e) => setForm({ ...form, offerStart: e.target.value || null })}
                              />
                            </div>
                            <div>
                              <Label>Fin</Label>
                              <Input
                                type="date"
                                value={form.offerEnd ?? ''}
                                min={form.offerStart ?? undefined}
                                onChange={(e) => setForm({ ...form, offerEnd: e.target.value || null })}
                              />
                            </div>
                            {/* Validación: fin < inicio */}
                            {form.offerStart && form.offerEnd && form.offerEnd < form.offerStart && (
                              <div className="sm:col-span-2 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-700">
                                  La <strong>fecha de fin</strong> no puede ser anterior a la <strong>fecha de inicio</strong>.
                                  Ajusta las fechas antes de guardar.
                                </p>
                              </div>
                            )}
                            {/* Validación: falta una de las dos fechas */}
                            {((form.offerStart && !form.offerEnd) || (!form.offerStart && form.offerEnd)) && (
                              <div className="sm:col-span-2 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700">
                                  Te falta definir {form.offerStart ? 'la fecha de <strong>fin</strong>' : 'la fecha de <strong>inicio</strong>'}.
                                  Si querés que sea permanente, cambia el tipo a "Permanente".
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        {form.offerType === 'permanente' && form.offerEnabled && (
                          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm text-amber-700">
                            ✓ Esta oferta es permanente. Se mostrará siempre sin fecha de vencimiento.
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* ETIQUETAS */}
                  {editTab === 'tags' && (
                    <>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Etiquetas</h2>
                      <p className="text-sm text-gray-500 mb-6">Etiquetas visuales que se muestran como badges en la tarjeta y el detalle del producto.</p>
                      <div className="space-y-5">
                        <div>
                          <Label>Presets rápidos</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {QUICK_TAG_PRESETS.map((t) => {
                              const currentTags: { name: string; color: string }[] = (() => { try { return JSON.parse(form.tags || '[]'); } catch { return []; } })();
                              const exists = currentTags.some((x) => x.name === t.name);
                              return (
                                <button
                                  key={t.name}
                                  type="button"
                                  onClick={() => {
                                    let next: { name: string; color: string }[];
                                    if (exists) {
                                      next = currentTags.filter((x) => x.name !== t.name);
                                    } else {
                                      next = [...currentTags, { name: t.name, color: t.color }];
                                    }
                                    setForm({ ...form, tags: JSON.stringify(next) });
                                  }}
                                  className="px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
                                  style={{ backgroundColor: t.color, opacity: exists ? 1 : 0.6 }}
                                >
                                  {exists ? '✓ ' : '+ '}{t.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <Separator />
                        <CustomTagEditor
                          value={form.tags}
                          onChange={(tagsJson) => setForm({ ...form, tags: tagsJson })}
                        />
                      </div>
                    </>
                  )}

                  {/* GALERÍA */}
                  {editTab === 'gallery' && (
                    <>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Galería</h2>
                      <p className="text-sm text-gray-500 mb-6">Imágenes adicionales del producto. La imagen principal se muestra como fallback.</p>
                      <GalleryEditor
                        value={form.images}
                        onChange={(json) => setForm({ ...form, images: json })}
                      />
                    </>
                  )}

                  {/* VARIANTES */}
                  {editTab === 'variants' && (
                    <>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Variantes</h2>
                      <p className="text-sm text-gray-500 mb-6">Grupos de opciones (tamaño, color, etc.) y combinaciones con stock y precio propio.</p>
                      <VariantsEditor
                        form={form}
                        setForm={setForm}
                        optionStockFrozen={optionStockFrozen}
                        computedStock={computedStock}
                        stockLevel={stockLevel}
                      />
                    </>
                  )}

                  {/* EXTRAS */}
                  {editTab === 'extras' && (
                    <>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Extras</h2>
                      <p className="text-sm text-gray-500 mb-6">Adicionales opcionales que el cliente puede agregar al producto.</p>
                      <ExtrasEditor
                        form={form}
                        setForm={setForm}
                      />
                    </>
                  )}

                  {/* POR MAYOR */}
                  {editTab === 'wholesale' && (
                    <>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Venta al por mayor</h2>
                      <p className="text-sm text-gray-500 mb-6">Habilita precios por volumen usando rangos (ej: 10-20 = $100, 20+ = $90).</p>
                      <div className="space-y-5">
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                          <Switch id="wholesaleEnabled" checked={form.wholesaleEnabled} onCheckedChange={(v) => setForm({ ...form, wholesaleEnabled: v })} />
                          <div>
                            <Label htmlFor="wholesaleEnabled" className="cursor-pointer text-emerald-800">Venta al por mayor habilitada</Label>
                            <p className="text-xs text-emerald-700">Muestra un badge &quot;💰 Por mayor&quot; en la tienda y la tabla de rangos en el detalle.</p>
                          </div>
                        </div>

                        <WholesaleTiersEditor
                          form={form}
                          setForm={setForm}
                          computedStock={computedStock}
                        />

                        <Separator />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label>Precio mayorista (legacy)</Label>
                            <Input type="number" step="0.01" value={form.wholesalePrice} onChange={(e) => setForm({ ...form, wholesalePrice: parseFloat(e.target.value) || 0 })} />
                            <p className="text-xs text-gray-500 mt-1">Usado sólo si no hay rangos definidos arriba.</p>
                          </div>
                          <div>
                            <Label>Cantidad mínima (legacy)</Label>
                            <Input type="number" min={1} value={form.wholesaleMinQty} onChange={(e) => setForm({ ...form, wholesaleMinQty: parseInt(e.target.value) || 1 })} />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* RESERVA */}
                  {editTab === 'reservation' && (
                    <>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Reserva</h2>
                      <p className="text-sm text-gray-500 mb-6">Permite que los clientes reserven el producto con anticipación pagando un depósito.</p>
                      <div className="space-y-5">
                        <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <Switch id="reservationEnabled" checked={form.reservationEnabled} onCheckedChange={(v) => setForm({ ...form, reservationEnabled: v })} />
                          <div>
                            <Label htmlFor="reservationEnabled" className="cursor-pointer text-purple-800">Reserva habilitada</Label>
                            <p className="text-xs text-purple-700">Los clientes podrán reservar el producto indicando una fecha de entrega.</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label>Máximo de reservas simultáneas</Label>
                            <Input type="number" min={0} value={form.maxReservations} onChange={(e) => setForm({ ...form, maxReservations: parseInt(e.target.value) || 0 })} />
                          </div>
                          <div>
                            <Label>Días de anticipación</Label>
                            <Input type="number" min={0} value={form.reservationDays} onChange={(e) => setForm({ ...form, reservationDays: parseInt(e.target.value) || 0 })} />
                          </div>
                        </div>
                        <div>
                          <Label>Depósito (%)</Label>
                          <Input type="number" min={0} max={100} step="0.01" value={form.reservationDeposit} onChange={(e) => setForm({ ...form, reservationDeposit: parseFloat(e.target.value) || 0 })} />
                          <p className="text-xs text-gray-500 mt-1">Porcentaje del precio total que se cobra como depósito (0-100).</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* PROMO */}
                  {editTab === 'promo' && (
                    <>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">Promoción</h2>
                      <p className="text-sm text-gray-500 mb-6">Promociones especiales: descuento por porcentaje, precio fijo o 2x1 (BOGO).</p>
                      <div className="space-y-5">
                        <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                          <Switch id="promoEnabled" checked={form.promoEnabled} onCheckedChange={(v) => setForm({ ...form, promoEnabled: v })} />
                          <div>
                            <Label htmlFor="promoEnabled" className="cursor-pointer text-orange-800">Promoción habilitada</Label>
                            <p className="text-xs text-orange-700">Activa la promoción seleccionada abajo.</p>
                          </div>
                        </div>
                        <div>
                          <Label>Tipo de promoción</Label>
                          <Select value={form.promoType} onValueChange={(v) => setForm({ ...form, promoType: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="discount">Descuento (%)</SelectItem>
                              <SelectItem value="fixed_price">Precio fijo</SelectItem>
                              <SelectItem value="bogo">2x1 (BOGO)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {form.promoType !== 'bogo' && (
                          <div>
                            <Label>{form.promoType === 'fixed_price' ? 'Precio fijo (USD)' : 'Valor del descuento (%)'}</Label>
                            <Input type="number" step="0.01" value={form.promoValue} onChange={(e) => setForm({ ...form, promoValue: parseFloat(e.target.value) || 0 })} />
                          </div>
                        )}
                        {form.promoType === 'bogo' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label>Cantidad a comprar</Label>
                              <Input type="number" min={1} value={form.promoBuyQty} onChange={(e) => setForm({ ...form, promoBuyQty: parseInt(e.target.value) || 1 })} />
                            </div>
                            <div>
                              <Label>Cantidad regalada</Label>
                              <Input type="number" min={1} value={form.promoGetQty} onChange={(e) => setForm({ ...form, promoGetQty: parseInt(e.target.value) || 1 })} />
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label>Inicio (opcional)</Label>
                            <Input type="date" value={form.promoStart ?? ''} onChange={(e) => setForm({ ...form, promoStart: e.target.value || null })} />
                          </div>
                          <div>
                            <Label>Fin (opcional)</Label>
                            <Input type="date" value={form.promoEnd ?? ''} onChange={(e) => setForm({ ...form, promoEnd: e.target.value || null })} />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mobile bottom action bar */}
          <div className="md:hidden bg-white border-t border-gray-200 px-4 py-3 flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-600">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingProduct ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El producto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── CATEGORIES TAB ─────────────────────────────────────────────────────────

function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', slug: '', icon: '📦', image: '', order: 0 });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      setCategories(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', slug: '', icon: '📦', image: '', order: 0 });
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, icon: c.icon, image: c.image ?? '', order: c.order });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Formato no válido. Solo JPG, PNG, WebP o GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Archivo demasiado grande. Máximo 5 MB.');
      return;
    }

    setUploadingImage(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/categories/upload' + (token ? `?token=${encodeURIComponent(token)}` : ''), {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        // Si hay una categoría siendo editada (desde el botón de subir imagen directo en la tabla),
        // guardar la imagen en esa categoría inmediatamente
        if (editing && !dialogOpen) {
          await fetch(`/api/admin/categories/${editing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: data.url }),
          });
          fetchData();
          setEditing(null);
        } else {
          // Si el diálogo está abierto, actualizar el form
          setForm((f) => ({ ...f, image: data.url }));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'No se pudo subir la imagen.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al subir la imagen.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await fetch(`/api/admin/categories/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/admin/categories/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const moveCategory = async (c: Category, direction: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((cat) => cat.id === c.id);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sorted.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const other = sorted[swapIdx];
    try {
      await Promise.all([
        fetch(`/api/admin/categories/${c.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: other.order }),
        }),
        fetch(`/api/admin/categories/${other.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: c.order }),
        }),
      ]);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categorías</h2>
          <p className="text-sm text-gray-500 mt-1">
            Sube una imagen para cada categoría. Si no hay imagen, se muestra el emoji como fallback.
          </p>
        </div>
        <Button onClick={openNew} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="h-4 w-4 mr-2" /> Nueva Categoría
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories
                .sort((a, b) => a.order - b.order)
                .map((c) => (
                  <TableRow key={c.id} className={!c.active ? 'opacity-50' : ''}>
                    <TableCell>
                      {c.image ? (
                        <img
                          src={c.image}
                          alt={c.name}
                          className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                          {c.icon}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {c.name}
                      {!c.active && <span className="ml-2 text-xs text-red-500 font-normal">(pausada)</span>}
                    </TableCell>
                    <TableCell className="text-gray-500 font-mono text-sm">{c.slug}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{c._count?.products ?? 0}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Subir imagen */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(c);
                            setForm({ name: c.name, slug: c.slug, icon: c.icon, image: c.image ?? '', order: c.order });
                            setTimeout(() => fileInputRef.current?.click(), 100);
                          }}
                          title="Subir imagen"
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500 text-white shadow-sm transition-all hover:bg-green-600 hover:scale-105 active:scale-95"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                        {/* Editar */}
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          title="Editar"
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500 text-white shadow-sm transition-all hover:bg-amber-600 hover:scale-105 active:scale-95"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {/* Pausar / Activar */}
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/admin/categories/${c.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ active: !c.active }),
                            });
                            fetchData();
                          }}
                          title={c.active ? 'Pausar (ocultar de la tienda)' : 'Activar (mostrar en la tienda)'}
                          className={`flex h-8 w-8 items-center justify-center rounded-md text-white shadow-sm transition-all hover:scale-105 active:scale-95 ${
                            c.active ? 'bg-gray-500 hover:bg-gray-600' : 'bg-emerald-500 hover:bg-emerald-600'
                          }`}
                        >
                          {c.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        {/* Subir orden */}
                        <button
                          type="button"
                          onClick={() => moveCategory(c, 'up')}
                          title="Subir orden"
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-white shadow-sm transition-all hover:bg-blue-600 hover:scale-105 active:scale-95"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        {/* Bajar orden */}
                        <button
                          type="button"
                          onClick={() => moveCategory(c, 'down')}
                          title="Bajar orden"
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-white shadow-sm transition-all hover:bg-blue-600 hover:scale-105 active:scale-95"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        {/* Eliminar */}
                        <button
                          type="button"
                          onClick={() => setDeleteId(c.id)}
                          title="Eliminar"
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500 text-white shadow-sm transition-all hover:bg-red-600 hover:scale-105 active:scale-95"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Imagen de la categoría */}
            <div className="space-y-2">
              <Label>Imagen de la categoría</Label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
                  {form.image ? (
                    <img src={form.image} alt="Vista previa" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl">{form.icon || '📦'}</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Subiendo…</>
                    ) : (
                      <><ImagePlus className="h-4 w-4 mr-2" /> Subir imagen</>
                    )}
                  </Button>
                  {form.image && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setForm({ ...form, image: '' })}
                      className="text-red-500 hover:text-red-600 ml-2"
                    >
                      <X className="h-4 w-4 mr-1" /> Quitar
                    </Button>
                  )}
                  <p className="text-xs text-gray-500">
                    JPG, PNG, WebP o GIF · máx 5MB · Cuadrada recomendada (1:1)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="O pega una URL / ruta pública (ej: /categories/mi-cat.png)"
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => { const n = e.target.value; setForm({ ...form, name: n, slug: autoSlug(n) }); }} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Icono (emoji, fallback)</Label>
                <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
                <p className="text-xs text-gray-500 mt-1">
                  Se muestra si no hay imagen.
                </p>
              </div>
              <div>
                <Label>Orden</Label>
                <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán también todos los productos de esta categoría. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── ORDERS TAB ─────────────────────────────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [ticketOrder, setTicketOrder] = useState<Order | null>(null);
  const [store, setStore] = useState<SiteConfig | null>(null);

  // ── Filtros y buscador ──
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paidFilter, setPaidFilter] = useState<string>('all');
  const [slotFilter, setSlotFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, sRes] = await Promise.all([
        fetch('/api/admin/orders'),
        fetch('/api/siteconfig'),
      ]);
      setOrders(await oRes.json());
      setStore(await sRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Aplicar filtros en cliente ──
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      // Filtro por texto (busca en múltiples campos)
      if (q) {
        const haystack = [
          o.orderNumber,
          o.customerName,
          o.customerEmail,
          o.customerPhone,
          o.recipientName,
          o.recipientPhone,
          o.recipientCity,
          o.recipientAddress,
          o.deliveryZoneName,
          o.zelleRef,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      // Filtro por estado
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      // Filtro por pago
      if (paidFilter === 'paid' && !o.isPaid) return false;
      if (paidFilter === 'unpaid' && o.isPaid) return false;
      // Filtro por horario
      if (slotFilter !== 'all' && o.deliveryTimeSlot !== slotFilter) return false;
      // Filtro por fecha de entrega (rango)
      if (dateFrom && (!o.deliveryDate || o.deliveryDate < dateFrom)) return false;
      if (dateTo && (!o.deliveryDate || o.deliveryDate > dateTo)) return false;
      return true;
    });
  }, [orders, search, statusFilter, paidFilter, slotFilter, dateFrom, dateTo]);

  const hasActiveFilters = !!(search.trim() || statusFilter !== 'all' || paidFilter !== 'all' || slotFilter !== 'all' || dateFrom || dateTo);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPaidFilter('all');
    setSlotFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  // Contadores rápidos por estado (para los chips)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const o of orders) {
      if (counts[o.status] !== undefined) counts[o.status]++;
    }
    return counts;
  }, [orders]);

  const changeStatus = async (orderId: string, status: string) => {
    try {
      await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status }),
      });
      // Los clientes hacen seguimiento de sus pedidos desde la página
      // "Mis Pedidos" con el timeline en tiempo real. No se envían
      // mensajes de WhatsApp automáticos para no sobrecargar a los dueños.
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const togglePaid = async (orderId: string, isPaid: boolean) => {
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid }),
      });
      // Actualizar localmente para feedback inmediato
      setOrders((cur) => cur.map((o) => o.id === orderId ? { ...o, isPaid } : o));
      setTicketOrder((cur) => cur && cur.id === orderId ? { ...cur, isPaid } : cur);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/admin/orders?id=${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Pedidos</h2>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
        </Button>
      </div>

      {/* ── Barra de filtros y buscador ── */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Buscador + filtro por fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2 lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                placeholder="Buscar por #pedido, cliente, email, teléfono, ciudad, ref Zelle…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500 mb-1 block">Entrega desde</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500 mb-1 block">Entrega hasta</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                className="h-9"
              />
            </div>
          </div>

          {/* Chips de estado */}
          <div>
            <Label className="text-[11px] text-gray-500 mb-1.5 block">Estado</Label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'all',       label: 'Todos',       color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                { key: 'pending',   label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                { key: 'confirmed', label: 'Confirmado',  color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                { key: 'shipped',   label: 'Enviado',     color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
                { key: 'delivered', label: 'Entregado',   color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                { key: 'cancelled', label: 'Cancelado',   color: 'bg-red-100 text-red-700 hover:bg-red-200' },
              ].map((s) => {
                const active = statusFilter === s.key;
                const count = statusCounts[s.key] ?? 0;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setStatusFilter(s.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                      active
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : `${s.color} border-transparent`
                    }`}
                  >
                    {s.label}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-white/20' : 'bg-white/60'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chips de pago + horario + limpiar */}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-[11px] text-gray-500 mb-1.5 block">Pago</Label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'all',    label: 'Todos' },
                  { key: 'paid',   label: '✓ Pagados' },
                  { key: 'unpaid', label: 'Pendientes' },
                ].map((p) => {
                  const active = paidFilter === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPaidFilter(p.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                        active
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-[11px] text-gray-500 mb-1.5 block">Horario</Label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'all',    label: 'Todos' },
                  { key: 'normal', label: 'Normal' },
                  { key: 'asap',   label: '⚡ ASAP' },
                ].map((s) => {
                  const active = slotFilter === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSlotFilter(s.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                        active
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto">
                <X className="h-3.5 w-3.5 mr-1" /> Limpiar filtros
              </Button>
            )}
          </div>

          {/* Contador de resultados */}
          <div className="text-xs text-gray-500 pt-1 border-t border-gray-100">
            {filteredOrders.length === orders.length ? (
              <span>Mostrando los <strong>{orders.length}</strong> pedidos.</span>
            ) : (
              <span>Mostrando <strong>{filteredOrders.length}</strong> de <strong>{orders.length}</strong> pedidos.</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Recibe</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden sm:table-cell">Entrega</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      {hasActiveFilters
                        ? 'No hay pedidos que coincidan con los filtros seleccionados.'
                        : 'No hay pedidos todavía.'}
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">#{o.orderNumber}</span>
                        {o.deliveryTimeSlot === 'asap' && (
                          <span title="Entrega urgente (ASAP)" className="inline-flex items-center justify-center w-5 h-5 bg-amber-100 rounded-full text-[10px]">
                            ⚡
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">{o.customerName}</div>
                      <div className="text-xs text-gray-500">{o.customerPhone}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">{o.recipientName || '—'}</div>
                      {o.recipientCity && (
                        <div className="text-xs text-gray-500">{o.recipientCity}</div>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">${o.total.toFixed(2)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => togglePaid(o.id, !o.isPaid)}
                        title={o.isPaid ? 'Marcado como pagado. Clic para marcar pendiente.' : 'Pendiente de pago. Clic para marcar pagado.'}
                        className="inline-flex"
                      >
                        <Badge
                          variant="outline"
                          className={o.isPaid
                            ? 'bg-green-100 text-green-700 border-green-200 cursor-pointer'
                            : 'bg-yellow-100 text-yellow-700 border-yellow-200 cursor-pointer'}
                        >
                          {o.isPaid ? '✓ Pagado' : 'Pendiente'}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select value={o.status} onValueChange={(v) => changeStatus(o.id, v)}>
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="shipped">Enviado</SelectItem>
                          <SelectItem value="delivered">Entregado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-gray-500">
                      {o.deliveryDate && (
                        <div>{new Date(o.deliveryDate + 'T00:00:00').toLocaleDateString('es-ES')}</div>
                      )}
                      <div className="text-xs">
                        {o.deliveryTimeSlot === 'asap' ? '⚡ ASAP' : 'Normal'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setTicketOrder(o)}
                          title="Ver detalle / imprimir ticket"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => setDeleteId(o.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Ticket modal */}
      <OrderTicket
        order={ticketOrder}
        open={!!ticketOrder}
        onOpenChange={(open) => { if (!open) setTicketOrder(null); }}
        onTogglePaid={togglePaid}
        store={store ? {
          storeName: store.storeName,
          phone: store.phone,
          whatsappNumber: store.whatsappNumber,
          address: store.address,
          normalSchedule: store.normalSchedule,
        } : null}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El pedido será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── SETTINGS TAB ───────────────────────────────────────────────────────────

// ─── Editor del cintillo de titulares (marquee) ───
function TickerEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const items = (() => {
    try { return JSON.parse(value || '[]') as string[]; } catch { return []; }
  })();

  const updateItem = (idx: number, newText: string) => {
    const next = [...items];
    next[idx] = newText;
    onChange(JSON.stringify(next));
  };

  const removeItem = (idx: number) => {
    onChange(JSON.stringify(items.filter((_, i) => i !== idx)));
  };

  const addItem = () => {
    onChange(JSON.stringify([...items, 'Nuevo titular']));
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= items.length) return;
    const next = [...items];
    [next[idx], next[nextIdx]] = [next[nextIdx], next[idx]];
    onChange(JSON.stringify(next));
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <span className="text-xs text-gray-400 w-6 shrink-0">{idx + 1}.</span>
          <Input
            value={item}
            onChange={(e) => updateItem(idx, e.target.value)}
            className="flex-1 h-8 text-sm"
          />
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => moveItem(idx, -1)} title="Subir" disabled={idx === 0}>
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => moveItem(idx, 1)} title="Bajar" disabled={idx === items.length - 1}>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 shrink-0" onClick={() => removeItem(idx)} title="Eliminar">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button type="button" onClick={addItem} variant="outline" size="sm">
        <Plus className="h-3.5 w-3.5 mr-1" /> Añadir titular
      </Button>
    </div>
  );
}

// ─── Editor de las cards de Horario y Entregas ───
interface HorarioCard { icon: string; title: string; description: string; color: string; }

const HORARIO_CARD_COLORS: Record<string, { label: string; bg: string; iconBg: string; border: string; text: string }> = {
  blue: { label: 'Azul', bg: 'bg-blue-50', iconBg: 'bg-blue-100', border: 'border-blue-100', text: 'text-blue-700' },
  emerald: { label: 'Verde', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', border: 'border-emerald-100', text: 'text-emerald-700' },
  purple: { label: 'Púrpura', bg: 'bg-purple-50', iconBg: 'bg-purple-100', border: 'border-purple-100', text: 'text-purple-700' },
  amber: { label: 'Ámbar', bg: 'bg-amber-50', iconBg: 'bg-amber-100', border: 'border-amber-100', text: 'text-amber-700' },
  rose: { label: 'Rosa', bg: 'bg-rose-50', iconBg: 'bg-rose-100', border: 'border-rose-100', text: 'text-rose-700' },
};

function HorarioCardsEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const cards = (() => {
    try { return JSON.parse(value || '[]') as HorarioCard[]; } catch { return []; }
  })();

  const updateCard = (idx: number, patch: Partial<HorarioCard>) => {
    const next = cards.map((c, i) => i === idx ? { ...c, ...patch } : c);
    onChange(JSON.stringify(next));
  };

  const removeCard = (idx: number) => {
    onChange(JSON.stringify(cards.filter((_, i) => i !== idx)));
  };

  const addCard = () => {
    onChange(JSON.stringify([...cards, { icon: '✨', title: 'Nueva tarjeta', description: 'Descripción de la tarjeta.', color: 'amber' }]));
  };

  const moveCard = (idx: number, dir: -1 | 1) => {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= cards.length) return;
    const next = [...cards];
    [next[idx], next[nextIdx]] = [next[nextIdx], next[idx]];
    onChange(JSON.stringify(next));
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">Tarjetas (actualmente: {cards.length})</Label>
      {cards.map((card, idx) => {
        const colorInfo = HORARIO_CARD_COLORS[card.color] || HORARIO_CARD_COLORS.amber;
        return (
          <div key={idx} className={`rounded-xl border-2 ${colorInfo.border} ${colorInfo.bg} p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Tarjeta {idx + 1}</span>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveCard(idx, -1)} title="Subir" disabled={idx === 0}>
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveCard(idx, 1)} title="Bajar" disabled={idx === cards.length - 1}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeCard(idx)} title="Eliminar">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-[60px_1fr] gap-3">
              <div>
                <Label className="text-xs">Icono</Label>
                <Input value={card.icon} onChange={(e) => updateCard(idx, { icon: e.target.value })} className="h-8 text-center text-lg" maxLength={4} />
              </div>
              <div>
                <Label className="text-xs">Título</Label>
                <Input value={card.title} onChange={(e) => updateCard(idx, { title: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Descripción (usa **texto** para negritas)</Label>
              <Textarea value={card.description} onChange={(e) => updateCard(idx, { description: e.target.value })} rows={2} className="text-sm" />
            </div>
            <div>
              <Label className="text-xs">Color de la tarjeta</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.entries(HORARIO_CARD_COLORS).map(([code, info]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => updateCard(idx, { color: code })}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${info.bg} ${info.text} ${
                      card.color === code ? 'border-gray-900 scale-105' : `${info.border} opacity-60 hover:opacity-100`
                    }`}
                  >
                    {info.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Preview */}
            <div className={`rounded-lg ${colorInfo.bg} ${colorInfo.border} border p-3 mt-2`}>
              <p className="text-xs text-gray-500 mb-1">Vista previa:</p>
              <div className="flex items-start gap-2">
                <div className={`w-10 h-10 ${colorInfo.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                  <span className="text-xl">{card.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-900">{card.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{card.description.replace(/\*\*/g, '')}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <Button type="button" onClick={addCard} variant="outline" size="sm">
        <Plus className="h-3.5 w-3.5 mr-1" /> Añadir tarjeta
      </Button>
    </div>
  );
}

function SettingsTab() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/siteconfig');
        setConfig(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/siteconfig', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof SiteConfig, value: string | number) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const dayFields: { key: keyof SiteConfig; label: string }[] = [
    { key: 'scheduleLunes', label: 'Lunes' },
    { key: 'scheduleMartes', label: 'Martes' },
    { key: 'scheduleMiercoles', label: 'Miércoles' },
    { key: 'scheduleJueves', label: 'Jueves' },
    { key: 'scheduleViernes', label: 'Viernes' },
    { key: 'scheduleSabado', label: 'Sábado' },
    { key: 'scheduleDomingo', label: 'Domingo' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900">Ajustes</h2>

      {/* Store Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Tienda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Nombre</Label>
              <Input value={config.storeName} onChange={(e) => updateField('storeName', e.target.value)} />
            </div>
            <div>
              <Label>Eslogan</Label>
              <Input value={config.tagline} onChange={(e) => updateField('tagline', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Logo URL</Label>
              <Input value={config.logo} onChange={(e) => updateField('logo', e.target.value)} />
            </div>
            <div>
              <Label>Cover URL</Label>
              <Input value={config.cover} onChange={(e) => updateField('cover', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Teléfono</Label>
              <Input value={config.phone} onChange={(e) => updateField('phone', e.target.value)} />
            </div>
            <div>
              <Label>WhatsApp (para pedidos)</Label>
              <Input value={config.whatsappNumber} onChange={(e) => updateField('whatsappNumber', e.target.value)} placeholder="+5363169968" />
              <p className="text-xs text-gray-500 mt-1">Se usará para enviar los pedidos por WhatsApp</p>
            </div>
          </div>
          <div>
            <Label>Dirección</Label>
            <Input value={config.address} onChange={(e) => updateField('address', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Zelle Payment */}
      <Card>
        <CardHeader>
          <CardTitle>Pago Zelle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Email Zelle</Label>
              <Input value={config.zelleEmail} onChange={(e) => updateField('zelleEmail', e.target.value)} />
            </div>
            <div>
              <Label>Nombre Zelle</Label>
              <Input value={config.zelleName} onChange={(e) => updateField('zelleName', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping */}
      <Card>
        <CardHeader>
          <CardTitle>Envío y Entregas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Envío gratis desde ($)</Label>
            <Input type="number" step="0.01" value={config.freeShippingMin} onChange={(e) => updateField('freeShippingMin', parseFloat(e.target.value) || 0)} />
            <p className="text-xs text-gray-500 mt-1">
              Pedidos con subtotal igual o superior a este monto tendrán envío gratis. El costo de envío por zona se gestiona desde la pestaña <strong>Delivery</strong>.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Horario normal de entrega</Label>
            <Input
              value={config.normalSchedule}
              onChange={(e) => updateField('normalSchedule', e.target.value)}
              placeholder="15:00 - 18:00"
            />
            <p className="text-xs text-gray-500">
              Texto que se muestra al cliente como horario normal de entrega.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Recargo global por entrega "Lo antes posible" (ASAP)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500">Tipo de recargo</Label>
                <Select
                  value={config.asapSurchargeType}
                  onValueChange={(v) => updateField('asapSurchargeType', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Monto fijo ($)</SelectItem>
                    <SelectItem value="percent">Porcentaje (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-500">
                  {config.asapSurchargeType === 'percent' ? 'Porcentaje (%)' : 'Monto (USD)'}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={config.asapSurchargeValue}
                  onChange={(e) => updateField('asapSurchargeValue', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Recargo aplicado a TODAS las zonas cuando el cliente elige "Lo antes posible".
              Las zonas pueden tener su propio recargo (override) desde la pestaña <strong>Delivery</strong>.
              {config.asapSurchargeType === 'percent'
                ? ` Actualmente: ${config.asapSurchargeValue}% del (subtotal + envío).`
                : ` Actualmente: $${config.asapSurchargeValue} fijo.`}
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Países activos para registro de clientes</Label>
            <p className="text-xs text-gray-500">
              Selecciona los países que verán los clientes al crear su cuenta.
              {config.activeCountries?.includes('CU') ? ' Cuba está activa: los clientes de Cuba deberán ingresar dirección y zona de delivery para autocompletado.' : ''}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {Object.entries(COUNTRY_INFO).map(([code, info]) => {
                const current = (config.activeCountries || '').split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean);
                const isActive = current.includes(code);
                return (
                  <label
                    key={code}
                    className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-colors ${
                      isActive ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...current, code]
                          : current.filter((x: string) => x !== code);
                        updateField('activeCountries', next.join(','));
                      }}
                      className="h-4 w-4 accent-amber-500"
                    />
                    <CountryFlag code={code} showName />
                  </label>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Horario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dayFields.map(({ key, label }) => (
            <div key={key} className="grid grid-cols-[100px_1fr] items-center gap-4">
              <Label className="text-sm font-medium">{label}</Label>
              <Input
                value={config[key] as string}
                onChange={(e) => updateField(key, e.target.value)}
                placeholder="15:00 - 18:00"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cintillo de titulares (marquee) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Cintillo de Titulares (Marquee)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-gray-500">
            Estos son los titulares que se desplazan en la franja amarilla del header. Añade, edita o elimina líneas según tu negocio.
          </p>
          <TickerEditor
            value={config.tickerItems}
            onChange={(v) => updateField('tickerItems', v)}
          />
        </CardContent>
      </Card>

      {/* Sección Horario y Entregas (hero) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Sección "Horario y Entregas" (Inicio)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-gray-500">
            Configura el título, la descripción y las 3 tarjetas que ven los clientes en la página de inicio debajo de la imagen principal.
          </p>
          <div>
            <Label>Título de la sección</Label>
            <Input
              value={config.horarioSectionTitle}
              onChange={(e) => updateField('horarioSectionTitle', e.target.value)}
              placeholder="Pide cuando quieras, recíbelo en casa"
            />
          </div>
          <div>
            <Label>Descripción</Label>
            <Input
              value={config.horarioSectionDesc}
              onChange={(e) => updateField('horarioSectionDesc', e.target.value)}
              placeholder="Tres cosas que debes saber sobre cómo trabajamos..."
            />
          </div>
          <Separator />
          <HorarioCardsEditor
            value={config.horarioCards}
            onChange={(v) => updateField('horarioCards', v)}
          />
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600 min-w-[120px]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Guardar
        </Button>
        {saved && <span className="text-green-600 font-medium text-sm">✓ Guardado correctamente</span>}
      </div>
    </div>
  );
}

// ─── DELIVERY TAB ───────────────────────────────────────────────────────────

interface DeliveryZone {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedTime: string;
  active: boolean;
  order: number;
  asapSurchargeOverride: boolean;
  asapSurchargeType: string;
  asapSurchargeValue: number;
  createdAt: string;
}

function DeliveryTab() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryZone | null>(null);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

  const blankForm: DeliveryZone = {
    id: '',
    name: '',
    description: '',
    price: 0,
    estimatedTime: 'Mismo día',
    active: true,
    order: 0,
    asapSurchargeOverride: false,
    asapSurchargeType: 'fixed',
    asapSurchargeValue: 0,
    createdAt: '',
  };
  const [form, setForm] = useState<DeliveryZone>(blankForm);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/delivery-zones');
      const data = (await res.json()) as DeliveryZone[];
      setZones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  const openCreate = () => {
    setEditingZone(null);
    const nextOrder = zones.length > 0 ? Math.max(...zones.map((z) => z.order ?? 0)) + 1 : 0;
    setForm({ ...blankForm, order: nextOrder });
    setDialogOpen(true);
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setForm({ ...zone });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        estimatedTime: form.estimatedTime.trim() || 'Mismo día',
        active: form.active,
        order: Number(form.order) || 0,
        asapSurchargeOverride: form.asapSurchargeOverride,
        asapSurchargeType: form.asapSurchargeType,
        asapSurchargeValue: Number(form.asapSurchargeValue) || 0,
      };
      const res = await fetch(
        editingZone
          ? `/api/admin/delivery-zones/${editingZone.id}`
          : '/api/admin/delivery-zones',
        {
          method: editingZone ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        setDialogOpen(false);
        await fetchZones();
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('Error guardando zona:', err);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (zone: DeliveryZone) => {
    try {
      const res = await fetch(`/api/admin/delivery-zones/${zone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !zone.active }),
      });
      if (res.ok) await fetchZones();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/delivery-zones/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteTarget(null);
        await fetchZones();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Zonas de Delivery</h2>
          <p className="text-sm text-gray-500 mt-1">
            Define las zonas de entrega con precios personalizados. El cliente elegirá una zona durante el checkout.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Zona
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{zones.length}</div>
            <p className="text-xs text-gray-500 mt-1">Zonas totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {zones.filter((z) => z.active).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Zonas activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">
              ${zones.length > 0
                ? Math.min(...zones.filter((z) => z.active).map((z) => Number(z.price) || 0)).toFixed(2)
                : '0.00'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Envío más económico</p>
          </CardContent>
        </Card>
      </div>

      {/* Zones table */}
      {zones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Aún no has creado ninguna zona de delivery.</p>
            <Button onClick={openCreate} className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Crear primera zona
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Orden</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead className="w-28">Precio</TableHead>
                  <TableHead className="w-36">Tiempo estimado</TableHead>
                  <TableHead className="w-24">Estado</TableHead>
                  <TableHead className="w-32 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones
                  .slice()
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-mono text-xs text-gray-500">
                        {zone.order ?? 0}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{zone.name}</div>
                        {zone.description && (
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2 max-w-md">
                            {zone.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-amber-600">
                          ${Number(zone.price).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {zone.estimatedTime}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleActive(zone)}
                          className="inline-flex"
                          title={zone.active ? 'Click para desactivar' : 'Click para activar'}
                        >
                          <Badge
                            variant="outline"
                            className={
                              zone.active
                                ? 'bg-green-100 text-green-700 border-green-200 cursor-pointer'
                                : 'bg-gray-100 text-gray-500 border-gray-200 cursor-pointer'
                            }
                          >
                            {zone.active ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(zone)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(zone)}
                            title="Eliminar"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingZone ? 'Editar Zona de Delivery' : 'Nueva Zona de Delivery'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zone-name">Nombre de la zona *</Label>
              <Input
                id="zone-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Ciego de Ávila (Ciudad)"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone-desc">Descripción</Label>
              <Textarea
                id="zone-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Municipios o áreas que cubre esta zona, indicaciones, etc."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zone-price">Precio de envío (USD) *</Label>
                <Input
                  id="zone-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone-time">Tiempo estimado</Label>
                <Input
                  id="zone-time"
                  value={form.estimatedTime}
                  onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })}
                  placeholder="Ej: Mismo día, 1-2 días"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zone-order">Orden de visualización</Label>
                <Input
                  id="zone-order"
                  type="number"
                  min="0"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                />
                <p className="text-xs text-gray-500">Las zonas se ordenan de menor a mayor.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone-active">Estado</Label>
                <div className="flex items-center h-10">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      id="zone-active"
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                      className="h-4 w-4 accent-amber-500"
                    />
                    <span className="text-sm text-gray-700">
                      {form.active ? 'Activa (visible en el checkout)' : 'Inactiva (oculta)'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Recargo ASAP opcional por zona */}
            <div className="rounded-lg border border-gray-200 p-3 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.asapSurchargeOverride}
                  onChange={(e) => setForm({ ...form, asapSurchargeOverride: e.target.checked })}
                  className="h-4 w-4 accent-amber-500"
                />
                <span className="text-sm font-medium text-gray-800">
                  Recargo "Lo antes posible" personalizado para esta zona
                </span>
              </label>
              <p className="text-xs text-gray-500 -mt-1">
                Si activas esto, esta zona usará su propio recargo para entregas urgentes en vez del global.
              </p>
              {form.asapSurchargeOverride && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo</Label>
                    <Select
                      value={form.asapSurchargeType}
                      onValueChange={(v) => setForm({ ...form, asapSurchargeType: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Monto fijo ($)</SelectItem>
                        <SelectItem value="percent">Porcentaje (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      {form.asapSurchargeType === 'percent' ? 'Porcentaje (%)' : 'Monto (USD)'}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.asapSurchargeValue}
                      onChange={(e) => setForm({ ...form, asapSurchargeValue: Number(e.target.value) })}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingZone ? 'Guardar cambios' : 'Crear zona'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar zona de delivery?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{deleteTarget?.name}</strong>. Esta acción no se puede deshacer.
              Los pedidos existentes conservarán la zona que se les asignó en su momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── CUSTOMERS TAB ───────────────────────────────────────────────────────────

interface AdminCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  country: string;
  address: string;
  deliveryZoneName: string | null;
  savedRecipients: { id: string }[];
  createdAt: string;
}

// (COUNTRY_INFO y CountryFlag se importan desde @/components/ecommerce/CountryFlag)

// ─── Form state para crear/editar cliente ───
interface CustomerFormState {
  name: string;
  phone: string;
  email: string;
  country: string;
  address: string;
  deliveryZoneName: string;
  password: string; // vacío = no cambiar (edición) / autogenerada (creación)
}

const EMPTY_CUSTOMER_FORM: CustomerFormState = {
  name: '',
  phone: '',
  email: '',
  country: 'US',
  address: '',
  deliveryZoneName: '',
  password: '',
};

function CustomersTab() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [detailCustomer, setDetailCustomer] = useState<AdminCustomer | null>(null);
  const [error, setError] = useState<string | null>(null);

  // CRUD: diálogo de crear/editar
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<AdminCustomer | null>(null);
  const [form, setForm] = useState<CustomerFormState>(EMPTY_CUSTOMER_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // CRUD: confirmación de eliminación
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/customers');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los clientes. Esto puede deberse a una recompilación del servidor. Haz clic en "Reintentar".');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q);
  });

  // ── Abrir formulario para nuevo cliente ──
  const openNew = () => {
    setEditingCustomer(null);
    setForm(EMPTY_CUSTOMER_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  // ── Abrir formulario para editar cliente existente ──
  const openEdit = (c: AdminCustomer) => {
    setEditingCustomer(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      country: c.country || 'US',
      address: c.address || '',
      deliveryZoneName: c.deliveryZoneName || '',
      password: '', // vacío = no cambiar
    });
    setFormError(null);
    setFormOpen(true);
    setDetailCustomer(null); // cerrar el diálogo de detalle si estaba abierto
  };

  // ── Guardar (crear o actualizar) ──
  const handleSave = async () => {
    setFormError(null);
    // Validaciones básicas
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      setFormError('Nombre, teléfono y correo son obligatorios.');
      return;
    }
    // Validar formato de email simple
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError('El correo electrónico no tiene un formato válido.');
      return;
    }
    // Si es creación, la contraseña es obligatoria (o se autogenera si está vacía)
    // Si es edición, la contraseña es opcional (vacío = no cambiar)
    if (!editingCustomer && form.password && form.password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (editingCustomer && form.password && form.password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        country: form.country,
        address: form.address.trim(),
        deliveryZoneName: form.deliveryZoneName.trim(),
      };
      // Sólo enviar password si no está vacío
      if (form.password) payload.password = form.password;

      let res: Response;
      if (editingCustomer) {
        res = await fetch(`/api/admin/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      setFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : 'Error al guardar el cliente.');
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar cliente ──
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/customers/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      setDeleteId(null);
      setDetailCustomer(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Error al eliminar el cliente.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No se pudieron cargar los clientes</h3>
        <p className="text-sm text-gray-500 max-w-md mb-4">{error}</p>
        <Button onClick={fetchData} className="bg-amber-500 hover:bg-amber-600 text-white">
          <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clientes Registrados</h2>
          <p className="text-sm text-gray-500 mt-1">{customers.length} cliente{customers.length === 1 ? '' : 's'} registrado{customers.length === 1 ? '' : 's'}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openNew} className="bg-amber-500 hover:bg-amber-600 text-white">
            <UserPlus className="h-4 w-4 mr-2" /> Nuevo Cliente
          </Button>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
          </Button>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar por nombre, correo o teléfono…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            {search ? 'No se encontraron clientes con ese criterio.' : 'Aún no hay clientes registrados.'}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Correo</TableHead>
                    <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead className="hidden lg:table-cell">Dirección</TableHead>
                    <TableHead className="hidden sm:table-cell">Destinatarios</TableHead>
                    <TableHead className="hidden md:table-cell">Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => setDetailCustomer(c)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{c.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-500">{c.email}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-gray-500">{c.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          <CountryFlag code={c.country} />
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-gray-500 max-w-[200px] truncate">
                        {c.address || '—'}
                        {c.deliveryZoneName && <span className="text-gray-400"> · {c.deliveryZoneName}</span>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">
                          <Heart className="h-3 w-3 mr-1" />
                          {c.savedRecipients?.length ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDetailCustomer(c)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(c)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => setDeleteId(c.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Modal de detalle del cliente */}
      <Dialog open={!!detailCustomer} onOpenChange={(o) => !o && setDetailCustomer(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {detailCustomer?.name.charAt(0).toUpperCase()}
              </div>
              {detailCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          {detailCustomer && (
            <div className="space-y-4">
              {/* Datos del cliente */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Correo</p>
                  <p className="text-sm text-gray-900 flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-gray-400" /> {detailCustomer.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Teléfono</p>
                  <p className="text-sm text-gray-900 flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-gray-400" /> {detailCustomer.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">País</p>
                  <Badge variant="outline" className="text-xs"><CountryFlag code={detailCustomer.country} /></Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Registro</p>
                  <p className="text-sm text-gray-900">{new Date(detailCustomer.createdAt).toLocaleDateString('es-ES')}</p>
                </div>
                {detailCustomer.address && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 font-medium">Dirección</p>
                    <p className="text-sm text-gray-900 flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-gray-400" /> {detailCustomer.address}{detailCustomer.deliveryZoneName ? ` · ${detailCustomer.deliveryZoneName}` : ''}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Familiares guardados */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  Familiares Guardados ({detailCustomer.savedRecipients?.length ?? 0})
                </h4>
                {detailCustomer.savedRecipients && detailCustomer.savedRecipients.length > 0 ? (
                  <div className="space-y-2">
                    {detailCustomer.savedRecipients.map((r: { id: string; label: string; name: string; phone: string; address: string; notes?: string }) => (
                      <div key={r.id} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[11px]">{r.label}</Badge>
                          <span className="font-medium text-gray-900 text-sm">{r.name}</span>
                        </div>
                        <p className="text-xs text-gray-500">📞 {r.phone}</p>
                        <p className="text-xs text-gray-500">📍 {r.address}</p>
                        {r.notes && <p className="text-xs text-gray-400 italic mt-0.5">📝 {r.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Sin familiares guardados.</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => setDeleteId(detailCustomer?.id ?? null)}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Eliminar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDetailCustomer(null)}>Cerrar</Button>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => detailCustomer && openEdit(detailCustomer)}
              >
                <Pencil className="h-4 w-4 mr-2" /> Editar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Crear / Editar cliente */}
      <Dialog open={formOpen} onOpenChange={(o) => { if (!o && !saving) setFormOpen(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingCustomer ? <Pencil className="h-5 w-5 text-amber-500" /> : <UserPlus className="h-5 w-5 text-amber-500" />}
              {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre completo *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Juan Pérez" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Teléfono *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+53 5555 1234" />
              </div>
              <div>
                <Label>Correo electrónico *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="juan@email.com" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>País</Label>
                <Select value={form.country || 'US'} onValueChange={(v) => setForm({ ...form, country: v })}>
                  <SelectTrigger>
                    <span className="inline-flex items-center gap-1.5">
                      <img
                        src={`https://flagcdn.com/w20/${(form.country || 'US').toLowerCase()}.png`}
                        srcSet={`https://flagcdn.com/w40/${(form.country || 'US').toLowerCase()}.png 2x`}
                        alt={form.country || 'US'}
                        className="h-3 w-4 object-cover rounded-[2px]"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <span className="font-semibold">{COUNTRY_INFO[form.country]?.abbr || form.country || 'US'}</span>
                      <span className="text-gray-500 font-normal">— {COUNTRY_INFO[form.country]?.name || ''}</span>
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COUNTRY_INFO).map(([code, info]) => (
                      <SelectItem key={code} value={code}>
                        <span className="inline-flex items-center gap-2">
                          <img
                            src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`}
                            srcSet={`https://flagcdn.com/w40/${code.toLowerCase()}.png 2x`}
                            alt={info.abbr}
                            className="h-3 w-4 object-cover rounded-[2px]"
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <span className="font-semibold">{info.abbr}</span>
                          <span className="text-gray-500 font-normal">— {info.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Zona de delivery (opcional)</Label>
                <Input value={form.deliveryZoneName} onChange={(e) => setForm({ ...form, deliveryZoneName: e.target.value })} placeholder="Ciego de Ávila (Ciudad)" />
              </div>
            </div>
            <div>
              <Label>Dirección (opcional)</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Calle 1 entre 2 y 4, Rpto. Sueño" />
            </div>
            <div>
              <Label>
                Contraseña{' '}
                {editingCustomer
                  ? <span className="text-xs text-gray-400">(vacío = no cambiar)</span>
                  : <span className="text-xs text-gray-400">(vacío = autogenerada)</span>}
              </Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingCustomer ? '••••••••' : 'Se genera automáticamente si está vacío'}
              />
              <p className="text-[11px] text-gray-500 mt-1">Mínimo 6 caracteres.</p>
            </div>

            {formError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {editingCustomer ? 'Guardar Cambios' : 'Crear Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminación */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El cliente será eliminado permanentemente,
              junto con sus destinatarios guardados. Los pedidos ya realizados no se verán afectados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── REVIEWS TAB ────────────────────────────────────────────────────────────

interface AdminReview {
  id: string;
  productId: string;
  customerId: string | null;
  authorName: string;
  rating: number;
  comment: string;
  status: string;
  adminReply: string;
  createdAt: string;
}

function ReviewsTab() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([
        fetch('/api/admin/reviews'),
        fetch('/api/admin/products'),
      ]);
      setReviews(await rRes.json());
      const prods = await pRes.json();
      setProducts(prods.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (reviewId: string, status: string) => {
    try {
      await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setReviews((cur) => cur.map((r) => r.id === reviewId ? { ...r, status } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      await fetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' });
      setReviews((cur) => cur.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = filter === 'all' ? reviews : reviews.filter((r) => r.status === filter);
  const productName = (productId: string) => products.find((p) => p.id === productId)?.name || 'Producto eliminado';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reseñas de Productos</h2>
          <p className="text-sm text-gray-500 mt-1">
            {reviews.filter(r => r.status === 'pending').length} pendientes · {reviews.filter(r => r.status === 'approved').length} aprobadas · {reviews.filter(r => r.status === 'rejected').length} rechazadas
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            className={filter === f ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : f === 'approved' ? 'Aprobadas' : 'Rechazadas'}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            No hay reseñas {filter !== 'all' ? 'con este filtro' : ''}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{r.authorName}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <Badge variant="outline" className={`text-[11px] ${
                        r.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                        r.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-red-100 text-red-700 border-red-200'
                      }`}>
                        {r.status === 'approved' ? 'Aprobada' : r.status === 'pending' ? 'Pendiente' : 'Rechazada'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {productName(r.productId)} · {new Date(r.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">{r.comment}</p>
                {r.adminReply && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 mb-3">
                    <p className="text-xs text-blue-800"><strong>Respuesta del admin:</strong> {r.adminReply}</p>
                  </div>
                )}
                {/* Acciones */}
                <div className="flex items-center gap-2">
                  {r.status !== 'approved' && (
                    <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white h-7" onClick={() => updateStatus(r.id, 'approved')}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprobar
                    </Button>
                  )}
                  {r.status !== 'rejected' && (
                    <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 h-7" onClick={() => updateStatus(r.id, 'rejected')}>
                      Rechazar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 h-7" onClick={() => deleteReview(r.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Download source code button ─────────────────────────────────────────────
function DownloadCodeButton() {
  const [status, setStatus] = useState<'idle' | 'preparing' | 'done' | 'error'>('idle');
  const [fileCount, setFileCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleDownload = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
    if (!token) {
      setErrorMsg('No hay sesión activa. Inicia sesión de nuevo.');
      setStatus('error');
      return;
    }
    setStatus('preparing');
    setFileCount(null);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/download?token=${encodeURIComponent(token)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // Si el token expiró, mostrar mensaje claro
        if (res.status === 401) {
          setErrorMsg('Tu sesión expiró. Cierra sesión, vuelve a ingresar al admin e inténtalo de nuevo.');
        } else {
          setErrorMsg(err.error || `Error ${res.status}`);
        }
        throw new Error(err.error || `Error ${res.status}`);
      }
      const count = res.headers.get('X-File-Count');
      if (count) setFileCount(parseInt(count, 10));

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      let filename = `diaz-premium-envios-${Date.now()}.zip`;
      const match = disposition.match(/filename="([^"]+)"/);
      if (match) filename = match[1];

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus('done');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Download error:', err);
      if (!errorMsg) {
        setErrorMsg('No se pudo generar el paquete. Intenta de nuevo.');
      }
      setStatus('error');
      setTimeout(() => { setStatus('idle'); setErrorMsg(''); }, 8000);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <Button
        onClick={handleDownload}
        disabled={status === 'preparing'}
        className="bg-amber-500 hover:bg-amber-600 text-white"
      >
        {status === 'preparing' ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Preparando zip…</>
        ) : status === 'done' ? (
          <><CheckCircle2 className="h-4 w-4 mr-2" /> Descargado</>
        ) : (
          <><Download className="h-4 w-4 mr-2" /> Descargar Código</>
        )}
      </Button>
      {fileCount !== null && status === 'done' && (
        <span className="text-sm text-gray-600">
          {fileCount} archivos incluidos en el paquete.
        </span>
      )}
      {status === 'error' && (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-red-600">
            {errorMsg || 'No se pudo generar el paquete. Intenta de nuevo.'}
          </span>
          {errorMsg.includes('sesión') && (
            <Button
              variant="outline"
              size="sm"
              className="text-amber-600 border-amber-300 hover:bg-amber-50 w-fit"
              onClick={() => {
                localStorage.removeItem(ADMIN_TOKEN_KEY);
                window.location.href = '/admin';
              }}
            >
              Ir a iniciar sesión
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ADMIN PANEL ───────────────────────────────────────────────────────

export function AdminPanel() {
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderTab = () => {
    switch (adminTab) {
      case 'dashboard': return <DashboardTab />;
      case 'products': return <ProductsTab />;
      case 'categories': return <CategoriesTab />;
      case 'orders': return <OrdersTab />;
      case 'delivery': return <DeliveryTab />;
      case 'customers': return <CustomersTab />;
      case 'reviews': return <ReviewsTab />;
      case 'settings': return <SettingsTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-amber-400">Admin Panel</h2>
            <Button variant="ghost" size="icon" className="lg:hidden text-white" onClick={() => setSidebarOpen(false)}>
              ✕
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.tab}
              onClick={() => { setAdminTab(item.tab); setSidebarOpen(false); }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors
                ${adminTab === item.tab
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <a
            href="/"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Ver Tienda
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b bg-white">
          <Button variant="outline" size="icon" onClick={() => setSidebarOpen(true)}>
            <LayoutDashboard className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold capitalize">
            {navItems.find((n) => n.tab === adminTab)?.label}
          </h2>
        </div>

        <div className="p-4 md:p-6 lg:p-8">
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
