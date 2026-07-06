/**
 * RestaurantInventory.jsx — Recipe-Level Ingredient Management
 *
 * Features:
 * - Stock level dashboard with low-stock alerts
 * - Add/Edit/Restock ingredient modals
 * - Category grouping (Proteins, Vegetables, Beverages, Dry Goods)
 * - Recipe cost calculator (links ingredients to products)
 */
import { useState, useEffect, useMemo } from 'react';
import { inventoryApi } from '@/lib/marketplaceApi';
import { Card, Button, Badge, Sheet, Select, Empty } from '@/components/ui';
import { Progress } from '@/components/ui/Progress';
import { KpiCard } from '@/components/charts/KpiCard';
import { useToast } from '@/components/ui/Toast';
import {
  Package, AlertTriangle, TrendingDown, Plus, RefreshCw,
  CheckCircle2, Scale, DollarSign,
} from 'lucide-react';

const CATEGORIES = ['All', 'Proteins', 'Vegetables', 'Dry Goods', 'Beverages', 'Dairy', 'Spices', 'Other'];

function StockBar({ current, minimum }) {
  const pct = minimum > 0 ? Math.min(100, (current / (minimum * 3)) * 100) : current > 0 ? 100 : 0;
  const color = current <= 0 ? 'var(--sn-red)' : current <= minimum ? 'var(--sn-amber)' : 'var(--sn-purple)';
  return <Progress value={pct} style={{ '--progress-color': color }} />;
}

export default function RestaurantInventory() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [activeTab, setActiveTab] = useState('stock');
  const [filterCat, setFilterCat] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [form, setForm] = useState({ name: '', unit: 'kg', currentStock: '', minimumStock: '', costPerUnit: '', category: 'Proteins', supplier: '' });

  const load = async () => {
    try {
      const [invRes, recipeRes] = await Promise.all([inventoryApi.list(), inventoryApi.recipes()]);
      setItems(invRes.data?.items || []);
      setRecipes(recipeRes.data?.products || []);
    } catch { toast.error('Failed to load inventory'); }
  };

  useEffect(() => { load(); }, []);

  const filtered = filterCat === 'All' ? items : items.filter(i => i.category === filterCat);
  const lowStock = items.filter(i => i.isLowStock && !i.isOutOfStock);
  const outOfStock = items.filter(i => i.isOutOfStock);
  const totalValue = items.reduce((s, i) => s + (i.totalCostGhs || 0), 0);

  const handleAdd = async () => {
    if (!form.name || !form.unit || form.currentStock === '' || form.costPerUnit === '') {
      toast.error('Fill required fields');
      return;
    }
    try {
      await inventoryApi.create(form);
      toast.success('Ingredient added');
      setShowAddModal(false);
      setForm({ name: '', unit: 'kg', currentStock: '', minimumStock: '', costPerUnit: '', category: 'Proteins', supplier: '' });
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add ingredient');
    }
  };

  const handleRestock = async () => {
    if (!restockQty || parseFloat(restockQty) <= 0) { toast.error('Enter quantity'); return; }
    try {
      await inventoryApi.restock(restockItem.id, parseFloat(restockQty));
      toast.success(`Restocked ${restockQty}${restockItem.unit}`);
      setRestockItem(null);
      setRestockQty('');
      load();
    } catch { toast.error('Failed to restock'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--sn-text)]">Inventory & Recipe Costing</h1>
          <p className="text-sm text-[var(--sn-text-muted)] mt-0.5">Track stock levels, monitor food costs, and calculate recipe margins</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="btn-sentry flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Ingredient
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Items" value={items.length} icon={Package} />
        <KpiCard label="Low Stock" value={lowStock.length} icon={AlertTriangle} color="var(--sn-amber)" />
        <KpiCard label="Out of Stock" value={outOfStock.length} icon={TrendingDown} color="var(--sn-red)" />
        <KpiCard label="Stock Value" value={`GHS ${totalValue.toFixed(2)}`} icon={DollarSign} color="var(--sn-purple)" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--sn-border)]">
        <button onClick={() => setActiveTab('stock')} className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'stock' ? 'border-[var(--sn-purple)] text-[var(--sn-purple)]' : 'border-transparent text-[var(--sn-text-muted)] hover:text-[var(--sn-text)]'}`}>
          <Package className="w-4 h-4 inline mr-1.5" />Stock Levels
        </button>
        <button onClick={() => setActiveTab('recipes')} className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'recipes' ? 'border-[var(--sn-purple)] text-[var(--sn-purple)]' : 'border-transparent text-[var(--sn-text-muted)] hover:text-[var(--sn-text)]'}`}>
          <Scale className="w-4 h-4 inline mr-1.5" />Recipe Costs
        </button>
      </div>

      {/* Stock tab */}
      {activeTab === 'stock' && (
        <>
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setFilterCat(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterCat === cat ? 'bg-[var(--sn-purple-subtle)] text-[var(--sn-purple)] border border-[var(--sn-purple-border)]' : 'text-[var(--sn-text-muted)] border border-[var(--sn-border)] hover:bg-[var(--sn-card-hover)]'}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Items list */}
          {filtered.length === 0 ? (
            <Empty icon={Package} title="No ingredients" description="Add your first ingredient to start tracking stock" />
          ) : (
            <Card>
              <div className="space-y-1">
                {filtered.map(item => (
                  <div key={item.id} className="flex items-center gap-4 py-3 border-b border-[var(--sn-border)] last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--sn-text)]">{item.name}</p>
                        {item.isOutOfStock && <Badge color="var(--sn-red)">Out</Badge>}
                        {item.isLowStock && !item.isOutOfStock && <Badge color="var(--sn-amber)">Low</Badge>}
                      </div>
                      <p className="text-xs text-[var(--sn-text-muted)] mt-0.5">
                        {item.category || 'Uncategorized'} - GHS {item.costPerUnit.toFixed(2)}/{item.unit}
                        {item.supplier && ` - ${item.supplier}`}
                      </p>
                    </div>
                    <div className="w-32">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--sn-text)] font-semibold">{item.currentStock} {item.unit}</span>
                        <span className="text-[var(--sn-text-muted)]">min: {item.minimumStock}</span>
                      </div>
                      <StockBar current={item.currentStock} minimum={item.minimumStock} />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--sn-text)]">GHS {(item.totalCostGhs || 0).toFixed(2)}</p>
                      <p className="text-xs text-[var(--sn-text-muted)]">value</p>
                    </div>
                    <button onClick={() => { setRestockItem(item); setRestockQty(''); }} className="btn-sentry flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold">
                      <RefreshCw className="w-3 h-3" />
                      Restock
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Recipe costs tab */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          {recipes.length === 0 ? (
            <Empty icon={Scale} title="No recipes configured" description="Link ingredients to products to see cost breakdowns" />
          ) : (
            recipes.map(product => (
              <Card key={product.id}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--sn-text)]">{product.name}</p>
                    <p className="text-xs text-[var(--sn-text-muted)]">Sells for GHS {(product.priceUsdc || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[var(--sn-purple)]">GHS {product.totalCostGhs?.toFixed(2)}</p>
                    <p className="text-xs text-[var(--sn-text-muted)]">
                      {product.totalCostGhs > 0 && product.priceUsdc > 0
                        ? `${(((product.priceUsdc - product.totalCostGhs) / product.priceUsdc) * 100).toFixed(0)}% margin`
                        : 'no cost data'}
                    </p>
                  </div>
                </div>
                {product.ingredients?.length > 0 ? (
                  <div className="space-y-1">
                    {product.ingredients.map(ing => (
                      <div key={ing.id} className="flex justify-between text-xs py-1.5 border-b border-[var(--sn-border)] last:border-0">
                        <span className="text-[var(--sn-text-muted)]">{ing.inventoryItemName}</span>
                        <span className="text-[var(--sn-text)] font-medium">{ing.quantityRequired} {ing.unit} - GHS {ing.costGhs?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--sn-text-muted)] italic">No ingredients linked yet</p>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Add ingredient modal */}
      {showAddModal && (
        <Sheet open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Ingredient">
          <div className="space-y-3 px-1">
            <div>
              <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase">Name *</label>
              <input className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--sn-surface)] border border-[var(--sn-border)] text-sm text-[var(--sn-text)]" placeholder="e.g. Rice" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase">Unit *</label>
                <Select className="w-full mt-1" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  <option value="kg">kg</option>
                  <option value="grams">grams</option>
                  <option value="liters">liters</option>
                  <option value="pieces">pieces</option>
                  <option value="packs">packs</option>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase">Category</label>
                <Select className="w-full mt-1" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase">Current Stock *</label>
                <input type="number" step="0.1" className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--sn-surface)] border border-[var(--sn-border)] text-sm text-[var(--sn-text)]" value={form.currentStock} onChange={e => setForm({ ...form, currentStock: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase">Min Stock</label>
                <input type="number" step="0.1" className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--sn-surface)] border border-[var(--sn-border)] text-sm text-[var(--sn-text)]" value={form.minimumStock} onChange={e => setForm({ ...form, minimumStock: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase">Cost per Unit (GHS) *</label>
              <input type="number" step="0.01" className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--sn-surface)] border border-[var(--sn-border)] text-sm text-[var(--sn-text)]" value={form.costPerUnit} onChange={e => setForm({ ...form, costPerUnit: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase">Supplier</label>
              <input className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--sn-surface)] border border-[var(--sn-border)] text-sm text-[var(--sn-text)]" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAdd} className="btn-sentry flex-1">Add Ingredient</Button>
            </div>
          </div>
        </Sheet>
      )}

      {/* Restock modal */}
      {restockItem && (
        <Sheet open={!!restockItem} onClose={() => setRestockItem(null)} title={`Restock ${restockItem.name}`}>
          <div className="space-y-3 px-1">
            <div className="p-3 rounded-lg bg-[var(--sn-surface)] border border-[var(--sn-border)]">
              <p className="text-sm text-[var(--sn-text-muted)]">Current stock</p>
              <p className="text-2xl font-bold text-[var(--sn-text)]">{restockItem.currentStock} {restockItem.unit}</p>
              <p className="text-xs text-[var(--sn-text-muted)] mt-1">Minimum: {restockItem.minimumStock} {restockItem.unit}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase">Quantity to add ({restockItem.unit})</label>
              <input type="number" step="0.1" autoFocus className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--sn-surface)] border border-[var(--sn-border)] text-sm text-[var(--sn-text)]" value={restockQty} onChange={e => setRestockQty(e.target.value)} placeholder="e.g. 10" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => setRestockItem(null)} className="flex-1">Cancel</Button>
              <Button onClick={handleRestock} className="btn-sentry flex-1">Restock</Button>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
