import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Badge,
  Skeleton,
  Empty,
  Modal,
  Input,
  Select,
  StatCard,
  Avatar,
  Switch,
  useToast
} from '@/components/ui';
import {
  BedDouble,
  Bath,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Plus,
  Layers,
  Sparkles,
  Calendar,
  DollarSign,
  Users,
  Eye,
  Settings,
  X,
  FileSpreadsheet,
  TrendingUp,
  Tag
} from 'lucide-react';
import { hotelOpsApi } from '@/lib/marketplaceApi';
import { usePermission } from '@/hooks/usePermission';
import { request } from '@/lib/apiCore'; // safe request fallback if we call new endpoints via fetch/apiCore

// Status configuration metadata
const STATUS_META = {
  AVAILABLE: { label: 'Available', color: 'var(--sn-green)', icon: CheckCircle2 },
  OCCUPIED: { label: 'Occupied', color: 'var(--sn-blue)', icon: BedDouble },
  DIRTY: { label: 'Dirty', color: 'var(--sn-amber)', icon: AlertCircle },
  MAINTENANCE: { label: 'Maintenance', color: 'var(--sn-red)', icon: Wrench },
  RESERVED: { label: 'Reserved', color: 'var(--sn-purple)', icon: BedDouble },
  CLEANING: { label: 'Cleaning', color: 'var(--sn-purple)', icon: Sparkles }
};

// Available Amenities list for selection/chips
const AVAILABLE_AMENITIES = [
  'WiFi', 'AC', 'TV', 'Minibar', 'Ocean View', 'Balcony', 'Bathtub', 'Room Service', 'Coffee Maker', 'Desk'
];

// Room Type options
const ROOM_TYPES = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'DELUXE', label: 'Deluxe' },
  { value: 'SUITE', label: 'Suite' },
  { value: 'EXECUTIVE', label: 'Executive' },
  { value: 'PRESIDENTIAL', label: 'Presidential' }
];

export default function HotelRooms() {
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const canManage = hasPermission('inventory.manage');

  // Page level tabs: 'inventory' or 'rates'
  const [activeTab, setActiveTab] = useState('inventory');

  // Room Inventory State
  const [rooms, setRooms] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterFloor, setFilterFloor] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isRateOverrideModalOpen, setIsRateOverrideModalOpen] = useState(false);

  // Selected items for edits/overrides
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedRateCell, setSelectedRateCell] = useState(null); // { roomType, date, currentPrice }

  // Rate Calendar State (14-day grid)
  const [rateCalendarData, setRateCalendarData] = useState([]);
  const [rateOverrides, setRateOverrides] = useState({}); // { 'SUITE_2026-07-16': price }
  const [loadingRates, setLoadingRates] = useState(false);

  // Form states
  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    roomType: 'STANDARD',
    floor: '',
    capacity: 2,
    bedConfig: '1 King Bed',
    basePriceUsdc: '',
    weekendPriceUsdc: '',
    amenities: [],
    notes: '',
    status: 'AVAILABLE'
  });

  const [bulkForm, setBulkForm] = useState({
    startNumber: '',
    endNumber: '',
    roomType: 'STANDARD',
    floor: '',
    basePrice: '',
    capacity: 2
  });

  const [blockForm, setBlockForm] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [rateOverridePrice, setRateOverridePrice] = useState('');

  // ---------------------------------------------------------------------------
  // API ACTIONS & LOADERS
  // ---------------------------------------------------------------------------
  
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hotelOpsApi.getRooms();
      setRooms(res?.rooms || res?.data?.rooms || []);
    } catch (err) {
      toast.error({
        title: 'Error loading rooms',
        description: err.message || 'Please check your connection and try again.',
        action: <Button variant="outline" size="sm" onClick={fetchRooms}>Retry</Button>
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchRatesAndCalendar = useCallback(async () => {
    setLoadingRates(true);
    try {
      // Fetch rate calendar data
      const res = await request('/api/business-os/hotel/rate-calendar');
      if (res && res.overrides) {
        // Assume overrides are structured or we mapping them
        const overridesMap = {};
        res.overrides.forEach(ov => {
          overridesMap[`${ov.roomType}_${ov.date}`] = ov.priceUsdc;
        });
        setRateOverrides(overridesMap);
      }
    } catch (err) {
      console.warn('Rate calendar overrides API missing or error; using standard fallbacks.', err);
    } finally {
      setLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (activeTab === 'rates') {
      fetchRatesAndCalendar();
    }
  }, [activeTab, fetchRatesAndCalendar]);

  // Generates 14 days starting from today (2026-07-16)
  const generateDates = () => {
    const dates = [];
    const baseDate = new Date('2026-07-16'); // Consistent with system time
    for (let i = 0; i < 14; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}`;
      const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
      dates.push({ dateStr: formatted, display: `${dayOfWeek} ${month}/${day}` });
    }
    return dates;
  };

  const calendarDates = generateDates();

  // Create single room
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.roomNumber || !roomForm.floor || !roomForm.basePriceUsdc) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      const payload = {
        ...roomForm,
        roomNumber: roomForm.roomNumber.trim(),
        floor: parseInt(roomForm.floor, 10),
        capacity: parseInt(roomForm.capacity, 10),
        basePriceUsdc: parseFloat(roomForm.basePriceUsdc),
        weekendPriceUsdc: roomForm.weekendPriceUsdc ? parseFloat(roomForm.weekendPriceUsdc) : undefined
      };
      await hotelOpsApi.createRoom(payload);
      toast.success('Room added successfully');
      setIsAddModalOpen(false);
      fetchRooms();
      // Reset form
      setRoomForm({
        roomNumber: '',
        roomType: 'STANDARD',
        floor: '',
        capacity: 2,
        bedConfig: '1 King Bed',
        basePriceUsdc: '',
        weekendPriceUsdc: '',
        amenities: [],
        notes: '',
        status: 'AVAILABLE'
      });
    } catch (err) {
      toast.error(`Failed to create room: ${err.message || 'Error'}`);
    }
  };

  // Bulk create rooms
  const handleBulkCreate = async (e) => {
    e.preventDefault();
    const { startNumber, endNumber, roomType, floor, basePrice, capacity } = bulkForm;
    if (!startNumber || !endNumber || !floor || !basePrice) {
      toast.error('Please fill in all bulk properties');
      return;
    }
    try {
      await request('/api/business-os/hotel/rooms/bulk', {
        method: 'POST',
        body: JSON.stringify({
          startNumber: parseInt(startNumber, 10),
          endNumber: parseInt(endNumber, 10),
          roomType,
          floor: parseInt(floor, 10),
          basePrice: parseFloat(basePrice),
          capacity: parseInt(capacity, 10)
        })
      });
      toast.success('Bulk rooms created successfully');
      setIsBulkModalOpen(false);
      fetchRooms();
    } catch (err) {
      toast.error(`Failed to bulk create rooms: ${err.message || 'Error'}`);
    }
  };

  // Update complete room details
  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    if (!selectedRoom) return;
    try {
      const payload = {
        ...roomForm,
        floor: parseInt(roomForm.floor, 10),
        capacity: parseInt(roomForm.capacity, 10),
        basePriceUsdc: parseFloat(roomForm.basePriceUsdc),
        weekendPriceUsdc: roomForm.weekendPriceUsdc ? parseFloat(roomForm.weekendPriceUsdc) : undefined
      };
      await request(`/api/business-os/hotel/rooms/${selectedRoom.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      toast.success(`Room ${roomForm.roomNumber} updated successfully`);
      setIsDetailModalOpen(false);
      fetchRooms();
    } catch (err) {
      toast.error(`Failed to update room: ${err.message || 'Error'}`);
    }
  };

  // Quick cycle room status from detail / grid
  const handleCycleStatus = async (room, newStatus) => {
    try {
      await hotelOpsApi.updateRoomStatus(room.id, newStatus);
      toast.success(`Room ${room.roomNumber} is now ${STATUS_META[newStatus].label}`);
      fetchRooms();
      if (selectedRoom && selectedRoom.id === room.id) {
        setSelectedRoom({ ...selectedRoom, status: newStatus });
      }
    } catch (err) {
      toast.error(`Failed to update room status: ${err.message || 'Error'}`);
    }
  };

  // Block room (OUT_OF_ORDER / Maintenance)
  const handleBlockRoom = async (e) => {
    e.preventDefault();
    if (!blockForm.startDate || !blockForm.endDate || !blockForm.reason) {
      toast.error('Please enter all dates and reason to block the room');
      return;
    }
    try {
      await request(`/api/business-os/hotel/rooms/${selectedRoom.id}/block`, {
        method: 'POST',
        body: JSON.stringify(blockForm)
      });
      toast.success(`Room ${selectedRoom.roomNumber} has been placed under maintenance / blocked`);
      setIsBlockModalOpen(false);
      setIsDetailModalOpen(false);
      fetchRooms();
    } catch (err) {
      toast.error(`Failed to block room: ${err.message || 'Error'}`);
    }
  };

  // Save specific rate calendar override
  const handleSaveRateOverride = async (e) => {
    e.preventDefault();
    if (!selectedRateCell || !rateOverridePrice) return;
    try {
      await request('/api/business-os/hotel/rate-calendar', {
        method: 'POST',
        body: JSON.stringify({
          roomType: selectedRateCell.roomType,
          date: selectedRateCell.date,
          priceUsdc: parseFloat(rateOverridePrice)
        })
      });
      setRateOverrides(prev => ({
        ...prev,
        [`${selectedRateCell.roomType}_${selectedRateCell.date}`]: parseFloat(rateOverridePrice)
      }));
      toast.success('Rate override saved successfully');
      setIsRateOverrideModalOpen(false);
    } catch (err) {
      toast.error(`Failed to apply override: ${err.message || 'Error'}`);
    }
  };

  // Bulk quick actions for rate calendar
  const handleBulkRateAction = async (actionType) => {
    try {
      let multiplier = 1;
      if (actionType === 'WEEKEND') multiplier = 1.20;
      if (actionType === 'HOLIDAY') multiplier = 1.40;

      // Apply multiplier on frontend and push updates
      const promises = [];
      const updatedOverrides = { ...rateOverrides };

      ROOM_TYPES.forEach(type => {
        calendarDates.forEach(d => {
          const defaultPrice = getDefaultPriceForType(type.value);
          const currentPrice = rateOverrides[`${type.value}_${d.dateStr}`] || defaultPrice;
          const newPrice = Math.round((currentPrice * multiplier) * 100) / 100;
          
          updatedOverrides[`${type.value}_${d.dateStr}`] = newPrice;
          
          promises.push(
            request('/api/business-os/hotel/rate-calendar', {
              method: 'POST',
              body: JSON.stringify({
                roomType: type.value,
                date: d.dateStr,
                priceUsdc: newPrice
              })
            })
          );
        });
      });

      await Promise.all(promises);
      setRateOverrides(updatedOverrides);
      toast.success(`Quick action complete: rates adjusted successfully`);
    } catch (err) {
      toast.error(`Failed applying bulk rate action: ${err.message || 'Error'}`);
    }
  };

  // Get fallback standard prices for calculation/display
  const getDefaultPriceForType = (type) => {
    // Check if we have rooms matching this type to derive actual base price
    if (rooms && rooms.length > 0) {
      const match = rooms.find(r => r.roomType === type);
      if (match) return match.basePriceUsdc;
    }
    const defaults = {
      STANDARD: 100,
      DELUXE: 150,
      SUITE: 250,
      EXECUTIVE: 400,
      PRESIDENTIAL: 800
    };
    return defaults[type] || 100;
  };

  // Filtered rooms logic
  const filteredRooms = rooms?.filter(room => {
    const matchFloor = filterFloor === 'ALL' || String(room.floor) === filterFloor;
    const matchType = filterType === 'ALL' || room.roomType === filterType;
    const matchStatus = filterStatus === 'ALL' || room.status === filterStatus;
    return matchFloor && matchType && matchStatus;
  }) || [];

  // Unique lists for dropdown options
  const uniqueFloors = [...new Set(rooms?.map(r => String(r.floor)) || [])].sort();

  // Status Counts derivation
  const statusCounts = rooms?.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {}) || {};

  // Form utilities
  const toggleAmenity = (amenity) => {
    setRoomForm(prev => {
      const isSelected = prev.amenities.includes(amenity);
      const amenities = isSelected
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities };
    });
  };

  const openEditModal = (room) => {
    setSelectedRoom(room);
    setRoomForm({
      roomNumber: room.roomNumber,
      roomType: room.roomType || 'STANDARD',
      floor: String(room.floor),
      capacity: room.capacity || 2,
      bedConfig: room.bedConfig || '',
      basePriceUsdc: String(room.basePriceUsdc),
      weekendPriceUsdc: room.weekendPriceUsdc ? String(room.weekendPriceUsdc) : '',
      amenities: room.amenities || [],
      notes: room.notes || '',
      status: room.status || 'AVAILABLE'
    });
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12" style={{ color: 'var(--sn-text)' }}>
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--sn-border)] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hotel Room Command</h1>
          <p className="text-sm text-[var(--sn-text-muted)] mt-1">
            Manage your physical spaces, rooms status, and dynamic rate pricing rules from a central dashboard.
          </p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          {canManage && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsBulkModalOpen(true)}>
                <Layers className="w-4 h-4 mr-1.5" />
                Bulk Build
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Single Room
              </Button>
            </>
          )}
        </div>
      </div>

      {/* PRIMARY TAB CONTROLLER */}
      <div className="flex gap-1 p-1 bg-[var(--az-black)] border border-[var(--sn-border)] rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'inventory'
              ? 'bg-[var(--sn-purple)] text-[var(--az-black)] shadow-sm'
              : 'text-[var(--sn-text-muted)] hover:text-[var(--sn-text)]'
          }`}
        >
          <BedDouble className="w-4 h-4" />
          Room Inventory
        </button>
        <button
          onClick={() => setActiveTab('rates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'rates'
              ? 'bg-[var(--sn-purple)] text-[var(--az-black)] shadow-sm'
              : 'text-[var(--sn-text-muted)] hover:text-[var(--sn-text)]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Rate Calendar
        </button>
      </div>

      {/* LOADING STATE */}
      {loading && activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: INVENTORY VIEWS */}
      {!loading && activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* STATS BAR */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {Object.entries(STATUS_META).map(([key, meta]) => {
              const count = statusCounts[key] || 0;
              return (
                <div
                  key={key}
                  className="flex flex-col justify-between p-3 rounded-xl border border-[var(--sn-border)] bg-[var(--az-card)]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <meta.icon className="w-4 h-4 flex-shrink-0" style={{ color: meta.color }} />
                    <span className="text-[10px] text-[var(--sn-text-muted)] font-bold uppercase tracking-wider">
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-xl font-bold">{count}</p>
                </div>
              );
            })}
          </div>

          {/* FILTER CONTROLS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[var(--az-card)] p-4 rounded-xl border border-[var(--sn-border)]">
            <div>
              <label className="text-[10px] font-bold text-[var(--sn-text-muted)] uppercase mb-1 block">Floor</label>
              <select
                value={filterFloor}
                onChange={(e) => setFilterFloor(e.target.value)}
                className="w-full bg-[var(--az-black)] border border-[var(--sn-border)] text-sm rounded-lg p-2 outline-none text-[var(--sn-text)] focus:border-[var(--sn-purple)]"
              >
                <option value="ALL">All Floors</option>
                {uniqueFloors.map(fl => (
                  <option key={fl} value={fl}>Floor {fl}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--sn-text-muted)] uppercase mb-1 block">Room Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-[var(--az-black)] border border-[var(--sn-border)] text-sm rounded-lg p-2 outline-none text-[var(--sn-text)] focus:border-[var(--sn-purple)]"
              >
                <option value="ALL">All Types</option>
                {ROOM_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[var(--sn-text-muted)] uppercase mb-1 block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-[var(--az-black)] border border-[var(--sn-border)] text-sm rounded-lg p-2 outline-none text-[var(--sn-text)] focus:border-[var(--sn-purple)]"
              >
                <option value="ALL">All Statuses</option>
                {Object.entries(STATUS_META).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ROOM GRID */}
          {filteredRooms.length === 0 ? (
            <Empty
              icon={BedDouble}
              title="No rooms match filters"
              description="Adjust your floor, type, or status selections, or add new rooms."
              action={
                canManage ? (
                  <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)}>
                    Add Room
                  </Button>
                ) : null
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredRooms.map(room => {
                const meta = STATUS_META[room.status] || STATUS_META.AVAILABLE;
                const priceStr = `${parseFloat(room.basePriceUsdc || 0).toFixed(2)} USDC`;
                const maxChips = 3;
                const extraCount = room.amenities && room.amenities.length > maxChips ? room.amenities.length - maxChips : 0;

                return (
                  <Card
                    key={room.id}
                    className="hover:scale-[1.01] transition-all relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Badge / Meta */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-[var(--sn-text-muted)]">
                          FLOOR {room.floor}
                        </span>
                        <Badge color={meta.color}>{meta.label}</Badge>
                      </div>

                      {/* Number & Type */}
                      <div className="mb-2">
                        <h3 className="text-lg font-bold">Room {room.roomNumber}</h3>
                        <p className="text-xs text-[var(--sn-text-muted)]">
                          {ROOM_TYPES.find(t => t.value === room.roomType)?.label || room.roomType}
                        </p>
                      </div>

                      {/* Bed Config */}
                      {room.bedConfig && (
                        <p className="text-xs text-[var(--sn-text-muted)] flex items-center gap-1.5 mb-3">
                          <BedDouble className="w-3.5 h-3.5 text-[var(--sn-purple)]" />
                          {room.bedConfig}
                        </p>
                      )}

                      {/* Amenities */}
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {room.amenities.slice(0, maxChips).map(am => (
                            <span
                              key={am}
                              className="text-[10px] px-2 py-0.5 rounded bg-[var(--sn-border)] text-[var(--sn-text-muted)] font-medium"
                            >
                              {am}
                            </span>
                          ))}
                          {extraCount > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--sn-purple)]0d text-[var(--sn-purple)] font-medium">
                              +{extraCount} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer price & view details button */}
                    <div className="pt-3 border-t border-[var(--sn-border)] flex items-center justify-between mt-auto">
                      <div>
                        <p className="text-[10px] text-[var(--sn-text-muted)] font-bold uppercase">Rate</p>
                        <p className="text-sm font-bold text-[var(--sn-green)]">{priceStr}</p>
                      </div>
                      <Button variant="secondary" size="sm" className="py-1 px-2.5 h-8 text-xs" onClick={() => openEditModal(room)}>
                        Manage
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RATE CALENDAR GRID */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          {/* INTRO AND QUICK ACTIONS */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--az-card)] p-4 rounded-xl border border-[var(--sn-border)]">
            <div>
              <h3 className="text-sm font-bold">Smart Pricing Override</h3>
              <p className="text-xs text-[var(--sn-text-muted)]">
                Click cells to set rates, or apply multipliers over your baseline prices.
              </p>
            </div>
            {canManage && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkRateAction('WEEKEND')}>
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--sn-purple)] mr-1" />
                  Weekend +20%
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkRateAction('HOLIDAY')}>
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--sn-purple)] mr-1" />
                  Holiday +40%
                </Button>
              </div>
            )}
          </div>

          {/* CALENDAR MAIN CONTAINER */}
          {loadingRates ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="overflow-x-auto border border-[var(--sn-border)] rounded-xl bg-[var(--az-card)]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--sn-border)] bg-[var(--az-black)]">
                    <th className="p-3 text-xs font-bold text-[var(--sn-text-muted)] uppercase tracking-wider sticky left-0 bg-[var(--az-black)] z-10">
                      Room Type
                    </th>
                    {calendarDates.map(d => (
                      <th key={d.dateStr} className="p-3 text-xs font-bold text-[var(--sn-text-muted)] uppercase text-center min-w-[90px]">
                        {d.display}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROOM_TYPES.map(type => {
                    const defaultPrice = getDefaultPriceForType(type.value);

                    return (
                      <tr key={type.value} className="border-b border-[var(--sn-border)] hover:bg-[var(--sn-border)]/10">
                        <td className="p-3 text-sm font-bold sticky left-0 bg-[var(--az-card)] border-r border-[var(--sn-border)] z-10">
                          {type.label}
                          <p className="text-[10px] text-[var(--sn-text-muted)] font-normal">
                            Base: {defaultPrice.toFixed(2)} USDC
                          </p>
                        </td>

                        {calendarDates.map(d => {
                          const overrideKey = `${type.value}_${d.dateStr}`;
                          const isOverridden = overrideKey in rateOverrides;
                          const ratePrice = isOverridden ? rateOverrides[overrideKey] : defaultPrice;

                          return (
                            <td
                              key={d.dateStr}
                              onClick={() => {
                                if (!canManage) return;
                                setSelectedRateCell({ roomType: type.value, date: d.dateStr, currentPrice: ratePrice });
                                setRateOverridePrice(String(ratePrice));
                                setIsRateOverrideModalOpen(true);
                              }}
                              className={`p-3 text-center cursor-pointer transition-all border-r border-[var(--sn-border)]/50 ${
                                isOverridden
                                  ? 'bg-[var(--sn-purple)]/15 hover:bg-[var(--sn-purple)]/25 text-[var(--sn-purple)]'
                                  : 'hover:bg-[var(--sn-border)]/30 text-[var(--sn-text)]'
                              }`}
                            >
                              <div className="font-semibold text-xs py-1">
                                {parseFloat(ratePrice).toFixed(2)}
                              </div>
                              {isOverridden && (
                                <span className="inline-block text-[8px] bg-[var(--sn-purple)]/20 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                                  Custom
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODALS
         ========================================================================= */}

      {/* SINGLE ROOM MODAL */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Single Room"
      >
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Room Number"
              placeholder="e.g. 101"
              value={roomForm.roomNumber}
              onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
              required
            />
            <Input
              label="Floor"
              placeholder="e.g. 1"
              type="number"
              value={roomForm.floor}
              onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Room Type"
              options={ROOM_TYPES}
              value={roomForm.roomType}
              onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
            />
            <Input
              label="Capacity (Guests)"
              type="number"
              value={roomForm.capacity}
              onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Base Price (USDC)"
              placeholder="100.00"
              type="number"
              step="0.01"
              value={roomForm.basePriceUsdc}
              onChange={(e) => setRoomForm({ ...roomForm, basePriceUsdc: e.target.value })}
              required
            />
            <Input
              label="Weekend Price Override (USDC)"
              placeholder="120.00"
              type="number"
              step="0.01"
              value={roomForm.weekendPriceUsdc}
              onChange={(e) => setRoomForm({ ...roomForm, weekendPriceUsdc: e.target.value })}
            />
          </div>

          <Input
            label="Bed Configuration"
            placeholder="e.g. 1 King Bed, 2 Double Beds"
            value={roomForm.bedConfig}
            onChange={(e) => setRoomForm({ ...roomForm, bedConfig: e.target.value })}
          />

          <div>
            <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider block mb-1.5">
              Amenities
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-[var(--az-black)] border border-[var(--sn-border)] rounded-xl">
              {AVAILABLE_AMENITIES.map(am => {
                const isSelected = roomForm.amenities.includes(am);
                return (
                  <button
                    type="button"
                    key={am}
                    onClick={() => toggleAmenity(am)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                      isSelected
                        ? 'bg-[var(--sn-purple)] border-[var(--sn-purple)] text-[var(--az-black)]'
                        : 'bg-[var(--az-card)] border-[var(--sn-border)] text-[var(--sn-text-muted)] hover:border-[var(--sn-purple)]'
                    }`}
                  >
                    {am}
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            label="Internal Notes"
            placeholder="Maintenance instructions, structural notes, etc."
            value={roomForm.notes}
            onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--sn-border)]">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Room
            </Button>
          </div>
        </form>
      </Modal>

      {/* BULK CREATE MODAL */}
      <Modal
        open={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Rooms Factory"
      >
        <form onSubmit={handleBulkCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Number"
              placeholder="e.g. 101"
              type="number"
              value={bulkForm.startNumber}
              onChange={(e) => setBulkForm({ ...bulkForm, startNumber: e.target.value })}
              required
            />
            <Input
              label="End Number"
              placeholder="e.g. 110"
              type="number"
              value={bulkForm.endNumber}
              onChange={(e) => setBulkForm({ ...bulkForm, endNumber: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Room Type"
              options={ROOM_TYPES}
              value={bulkForm.roomType}
              onChange={(e) => setBulkForm({ ...bulkForm, roomType: e.target.value })}
            />
            <Input
              label="Floor"
              placeholder="e.g. 1"
              type="number"
              value={bulkForm.floor}
              onChange={(e) => setBulkForm({ ...bulkForm, floor: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Base Price (USDC)"
              placeholder="e.g. 100"
              type="number"
              step="0.01"
              value={bulkForm.basePrice}
              onChange={(e) => setBulkForm({ ...bulkForm, basePrice: e.target.value })}
              required
            />
            <Input
              label="Capacity"
              type="number"
              value={bulkForm.capacity}
              onChange={(e) => setBulkForm({ ...bulkForm, capacity: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--sn-border)]">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsBulkModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Construct Rooms
            </Button>
          </div>
        </form>
      </Modal>

      {/* DETAIL & FULL EDIT MODAL */}
      <Modal
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedRoom ? `Manage Room ${selectedRoom.roomNumber}` : 'Room Detail'}
      >
        {selectedRoom && (
          <form onSubmit={handleUpdateRoom} className="space-y-4">
            {/* Status cycling options */}
            <div className="p-3 bg-[var(--az-black)] rounded-xl border border-[var(--sn-border)] flex flex-wrap gap-2 items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[var(--sn-text-muted)] uppercase">Status Control</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: STATUS_META[selectedRoom.status]?.color || 'var(--sn-text)' }}
                  />
                  <p className="text-sm font-semibold text-[var(--sn-text)]">{STATUS_META[selectedRoom.status]?.label}</p>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                {Object.keys(STATUS_META).map(st => (
                  <button
                    type="button"
                    key={st}
                    onClick={() => handleCycleStatus(selectedRoom, st)}
                    className={`text-[10px] px-2 py-1 rounded font-bold transition-all ${
                      selectedRoom.status === st
                        ? 'bg-[var(--sn-purple)] text-[var(--az-black)]'
                        : 'bg-[var(--az-card)] border border-[var(--sn-border)] text-[var(--sn-text-muted)] hover:text-[var(--sn-text)]'
                    }`}
                  >
                    {STATUS_META[st].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Block action */}
            {canManage && (
              <div className="bg-[var(--sn-red)]/10 p-3 rounded-xl border border-[var(--sn-red)]/25 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[var(--sn-red)]">Block / Place Out of Order</p>
                  <p className="text-[10px] text-[var(--sn-text-muted)] mt-0.5">Prevent room availability bookings.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="border-[var(--sn-red)] text-[var(--sn-red)] hover:bg-[var(--sn-red)]/10 text-xs px-2 py-1.5 h-8"
                  onClick={() => setIsBlockModalOpen(true)}
                >
                  Configure Block
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Room Number"
                value={roomForm.roomNumber}
                onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                disabled={!canManage}
                required
              />
              <Input
                label="Floor"
                type="number"
                value={roomForm.floor}
                onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                disabled={!canManage}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Room Type"
                options={ROOM_TYPES}
                value={roomForm.roomType}
                onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                disabled={!canManage}
              />
              <Input
                label="Capacity"
                type="number"
                value={roomForm.capacity}
                onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                disabled={!canManage}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Base Price (USDC)"
                type="number"
                step="0.01"
                value={roomForm.basePriceUsdc}
                onChange={(e) => setRoomForm({ ...roomForm, basePriceUsdc: e.target.value })}
                disabled={!canManage}
                required
              />
              <Input
                label="Weekend Price Override (USDC)"
                type="number"
                step="0.01"
                value={roomForm.weekendPriceUsdc}
                onChange={(e) => setRoomForm({ ...roomForm, weekendPriceUsdc: e.target.value })}
                disabled={!canManage}
              />
            </div>

            <Input
              label="Bed Configuration"
              value={roomForm.bedConfig}
              onChange={(e) => setRoomForm({ ...roomForm, bedConfig: e.target.value })}
              disabled={!canManage}
            />

            <div>
              <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider block mb-1.5">
                Amenities
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-[var(--az-black)] border border-[var(--sn-border)] rounded-xl">
                {AVAILABLE_AMENITIES.map(am => {
                  const isSelected = roomForm.amenities.includes(am);
                  return (
                    <button
                      type="button"
                      key={am}
                      onClick={() => {
                        if (canManage) toggleAmenity(am);
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        isSelected
                          ? 'bg-[var(--sn-purple)] border-[var(--sn-purple)] text-[var(--az-black)]'
                          : 'bg-[var(--az-card)] border-[var(--sn-border)] text-[var(--sn-text-muted)] hover:border-[var(--sn-purple)]'
                      }`}
                      disabled={!canManage}
                    >
                      {am}
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              label="Internal Notes"
              value={roomForm.notes}
              onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
              disabled={!canManage}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--sn-border)]">
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsDetailModalOpen(false)}>
                {canManage ? 'Cancel' : 'Close'}
              </Button>
              {canManage && (
                <Button variant="primary" size="sm" type="submit">
                  Save Changes
                </Button>
              )}
            </div>
          </form>
        )}
      </Modal>

      {/* BLOCK ROOM OVERLAY MODAL */}
      <Modal
        open={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        title={selectedRoom ? `Block Room ${selectedRoom.roomNumber}` : 'Block Room'}
      >
        <form onSubmit={handleBlockRoom} className="space-y-4">
          <p className="text-xs text-[var(--sn-text-muted)]">
            Specify a maintenance date range. The status will update automatically and block outbound reservations.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={blockForm.startDate}
              onChange={(e) => setBlockForm({ ...blockForm, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={blockForm.endDate}
              onChange={(e) => setBlockForm({ ...blockForm, endDate: e.target.value })}
              required
            />
          </div>
          <Input
            label="Reason / Notes"
            placeholder="e.g. Deep carpet clean, AC water leak repair"
            value={blockForm.reason}
            onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--sn-border)]">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsBlockModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Enforce Block
            </Button>
          </div>
        </form>
      </Modal>

      {/* RATE OVERRIDE CELL MODAL */}
      <Modal
        open={isRateOverrideModalOpen}
        onClose={() => setIsRateOverrideModalOpen(false)}
        title="Set Custom Daily Rate"
      >
        {selectedRateCell && (
          <form onSubmit={handleSaveRateOverride} className="space-y-4">
            <div className="p-3 bg-[var(--az-black)] rounded-xl border border-[var(--sn-border)] space-y-1">
              <p className="text-xs font-bold text-[var(--sn-text-muted)] uppercase">Override Parameters</p>
              <div className="flex justify-between text-sm">
                <span>Room Type:</span>
                <span className="font-bold text-[var(--sn-purple)]">
                  {ROOM_TYPES.find(t => t.value === selectedRateCell.roomType)?.label || selectedRateCell.roomType}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Target Date:</span>
                <span className="font-bold">{selectedRateCell.date}</span>
              </div>
            </div>

            <Input
              label="Price Override (USDC)"
              type="number"
              step="0.01"
              value={rateOverridePrice}
              onChange={(e) => setRateOverridePrice(e.target.value)}
              required
              autoFocus
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--sn-border)]">
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsRateOverrideModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Apply Override
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
