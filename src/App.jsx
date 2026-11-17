import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, ShoppingBag, Clock, User, Phone, MapPin, Tag, Plus, Minus, 
  Trash2, CheckCircle2, X, Share2, Check, Settings, Store, Bike, 
  Navigation, Image as ImageIcon, Bell, Send, ExternalLink, Sparkles
} from 'lucide-react';

// --- DỮ LIỆU KHỞI TẠO BAN ĐẦU ---
const INITIAL_MENU = [
  { 
    id: 'm1', 
    name: 'Trà Sữa Truyền Thống', 
    acronym: 'tstt', 
    image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=400&q=80',
    sizes: { 'M': 25000, 'L': 30000 } 
  },
  { 
    id: 'm2', 
    name: 'Trà Sữa Trân Châu Hoàng Kim', 
    acronym: 'tstchk', 
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
    sizes: { 'M': 35000, 'L': 40000 } 
  },
  { 
    id: 'm3', 
    name: 'Trà Sữa Gạo Nàng Thơm', 
    acronym: 'tsgnt', 
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80',
    sizes: { 'M': 22000, 'L': 27000 } 
  },
  { 
    id: 'm4', 
    name: 'Lục Trà Sủi Bọt', 
    acronym: 'ltsb', 
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80',
    sizes: { 'XL': 15000 } 
  },
  { 
    id: 'm5', 
    name: 'Trà Đào Cam Sả', 
    acronym: 'tdcs', 
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
    sizes: { 'M': 35000, 'L': 40000 } 
  },
  { 
    id: 'm6', 
    name: 'Sữa Tươi Trân Châu Đường Đen', 
    acronym: 'sttcdd', 
    image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=400&q=80',
    sizes: { 'M': 35000, 'L': 42000 } 
  }
];

const INITIAL_PROMOS = {
  'SALE10': { type: 'percent', value: 10, desc: 'Giảm 10% tổng đơn' },
  'MAYCHA20': { type: 'fixed', value: 20000, desc: 'Giảm trực tiếp 20.000đ' },
  'FREESHIP': { type: 'freeship', value: 100, desc: 'Miễn phí giao hàng 100%' }
};

const TOPPINGS = [
  { id: 'tc_ho_phach', name: 'Trân châu hổ phách', price: 6000 },
  { id: 'tc_hoang_kim', name: 'Trân châu hoàng kim', price: 6000 },
  { id: 'tc_den', name: 'Trân châu đen', price: 10000 },
  { id: 'kem_cheese', name: 'Kem cheese', price: 15000 },
  { id: 'thach_trai_cay', name: 'Thạch trái cây', price: 10000 }
];

const ICE_LEVELS = ['100% Đá', '50% Đá', 'Không đá'];
const SUGAR_LEVELS = ['100% Đường', '50% Đường', 'Không đường'];

// Cấu hình mặc định của Quán
const DEFAULT_STORE_CONFIG = {
  storeName: 'Maycha Trà Sữa',
  storeAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
  baseShipFee: 15000, // Phí ship 2km đầu
  perKmFee: 5000,     // Phụ thu mỗi km tiếp theo
  freeShipThreshold: 100000, // Đơn từ 100k tự động Freeship
  telegramBotToken: '', // Token bot nhận thông báo
  telegramChatId: ''    // Chat ID của chủ quán
};

export default function App() {
  const [activeTab, setActiveTab] = useState('menu'); // menu, cart, history, admin
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- STATE DỮ LIỆU LƯU TRỮ ---
  const [menuData, setMenuData] = useState(() => {
    const saved = localStorage.getItem('maycha_v2_menu');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });

  const [promos, setPromos] = useState(() => {
    const saved = localStorage.getItem('maycha_v2_promos');
    return saved ? JSON.parse(saved) : INITIAL_PROMOS;
  });

  const [storeConfig, setStoreConfig] = useState(() => {
    const saved = localStorage.getItem('maycha_v2_config');
    return saved ? JSON.parse(saved) : DEFAULT_STORE_CONFIG;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('maycha_v2_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // --- STATE GIỎ HÀNG & GIAO NHẬN ---
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('delivery'); // 'delivery' (Giao tận nơi) | 'pickup' (Tự đến lấy)
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', distanceKm: 2.5 });
  const [isCalculatingDist, setIsCalculatingDist] = useState(false);
  
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  // --- STATE MODAL ---
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalData, setModalData] = useState({
    size: '', ice: '100% Đá', sugar: '100% Đường', toppings: [], note: '', qty: 1
  });
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // --- STATE QUẢN TRỊ (ADMIN) ---
  const [adminSubTab, setAdminSubTab] = useState('dishes'); // 'dishes' | 'promos' | 'settings'
  const [newDish, setNewDish] = useState({ name: '', acronym: '', image: '', priceM: 25000, priceL: 30000 });
  const [editingDishId, setEditingDishId] = useState(null);
  const [newPromo, setNewPromo] = useState({ code: '', type: 'percent', value: 10, desc: '' });

  // Lưu tự động vào LocalStorage
  useEffect(() => { localStorage.setItem('maycha_v2_menu', JSON.stringify(menuData)); }, [menuData]);
  useEffect(() => { localStorage.setItem('maycha_v2_promos', JSON.stringify(promos)); }, [promos]);
  useEffect(() => { localStorage.setItem('maycha_v2_config', JSON.stringify(storeConfig)); }, [storeConfig]);
  useEffect(() => { localStorage.setItem('maycha_v2_orders', JSON.stringify(orders)); }, [orders]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // --- LỌC MENU ---
  const filteredMenu = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return menuData;
    return menuData.filter(item => 
      item.name.toLowerCase().includes(term) || 
      item.acronym.toLowerCase().includes(term)
    );
  }, [searchTerm, menuData]);

  // --- TÍNH TOÁN TIỀN & PHÍ SHIP ---
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }, [cart]);

  // Tính phí ship gốc theo khoảng cách
  const rawShippingFee = useMemo(() => {
    if (orderType === 'pickup' || cart.length === 0) return 0;
    const dist = Math.max(0, Number(customer.distanceKm) || 0);
    if (dist <= 2) return storeConfig.baseShipFee;
    const extraKm = Math.ceil(dist - 2);
    return storeConfig.baseShipFee + (extraKm * storeConfig.perKmFee);
  }, [orderType, customer.distanceKm, storeConfig, cart.length]);

  // Kiểm tra điều kiện Freeship (Đạt ngưỡng đơn hàng HOẶC nhập mã FREESHIP)
  const isFreeShipEligible = useMemo(() => {
    if (orderType === 'pickup') return true;
    if (cartSubtotal >= storeConfig.freeShipThreshold) return true;
    if (appliedPromo && appliedPromo.type === 'freeship') return true;
    return false;
  }, [orderType, cartSubtotal, storeConfig.freeShipThreshold, appliedPromo]);

  const finalShippingFee = isFreeShipEligible ? 0 : rawShippingFee;

  // Tính số tiền được giảm từ mã KM
  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === 'percent') return (cartSubtotal * appliedPromo.value) / 100;
    if (appliedPromo.type === 'fixed') return Math.min(cartSubtotal, appliedPromo.value);
    if (appliedPromo.type === 'freeship') return rawShippingFee;
    return 0;
  }, [cartSubtotal, appliedPromo, rawShippingFee]);

  const cartTotal = Math.max(0, cartSubtotal - (appliedPromo?.type !== 'freeship' ? discountAmount : 0) + finalShippingFee);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  // --- MÔ PHỎNG ĐO KHOẢNG CÁCH TỪ ĐỊA CHỈ KHÁCH ---
  const handleCalculateDistance = () => {
    if (!customer.address.trim()) {
      showToast('Vui lòng nhập địa chỉ giao hàng trước!');
      return;
    }
    setIsCalculatingDist(true);
    // Mô phỏng tính toán tọa độ dựa trên độ dài/từ khóa địa chỉ
    setTimeout(() => {
      const addr = customer.address.toLowerCase();
      let estimatedKm = 2.0;
      if (addr.includes('quận 1') || addr.includes('q1')) estimatedKm = 1.5;
      else if (addr.includes('quận 3') || addr.includes('quận 4') || addr.includes('bình thạnh')) estimatedKm = 3.2;
      else if (addr.includes('quận 7') || addr.includes('tân bình') || addr.includes('phú nhuận')) estimatedKm = 5.8;
      else if (addr.includes('thủ đức') || addr.includes('gò vấp') || addr.includes('quận 12')) estimatedKm = 9.5;
      else {
        // Tạo số km ngẫu nhiên ổn định từ 1.5 đến 7.5km dựa trên chuỗi địa chỉ
        const hash = addr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        estimatedKm = Number(((hash % 60) / 10 + 1.5).toFixed(1));
      }
      setCustomer(prev => ({ ...prev, distanceKm: estimatedKm }));
      setIsCalculatingDist(false);
      showToast(`Đã đo khoảng cách: ${estimatedKm} km từ quán`);
    }, 600);
  };

  // --- THAO TÁC CHỌN MÓN ---
  const openItemModal = (item) => {
    const defaultSize = Object.keys(item.sizes)[0];
    setSelectedItem(item);
    setModalData({
      size: defaultSize, ice: '100% Đá', sugar: '100% Đường', toppings: [], note: '', qty: 1
    });
  };

  const toggleTopping = (topping) => {
    setModalData(prev => {
      const exists = prev.toppings.find(t => t.id === topping.id);
      return exists 
        ? { ...prev, toppings: prev.toppings.filter(t => t.id !== topping.id) }
        : { ...prev, toppings: [...prev.toppings, topping] };
    });
  };

  const handleAddToCart = () => {
    const basePrice = selectedItem.sizes[modalData.size];
    const toppingsPrice = modalData.toppings.reduce((sum, t) => sum + t.price, 0);
    const finalPrice = basePrice + toppingsPrice;
    const optionsHash = `${selectedItem.id}-${modalData.size}-${modalData.ice}-${modalData.sugar}-${modalData.toppings.map(t=>t.id).sort().join(',')}-${modalData.note}`;
    
    setCart(prev => {
      const existing = prev.find(c => c.cartItemId === optionsHash);
      if (existing) {
        return prev.map(c => c.cartItemId === optionsHash ? { ...c, qty: c.qty + modalData.qty } : c);
      }
      return [...prev, { 
        cartItemId: optionsHash, id: selectedItem.id, name: selectedItem.name, 
        image: selectedItem.image, size: modalData.size, ice: modalData.ice,
        sugar: modalData.sugar, toppings: modalData.toppings, note: modalData.note,
        price: finalPrice, qty: modalData.qty 
      }];
    });
    setSelectedItem(null);
    showToast(`Đã thêm ${modalData.qty}x ${selectedItem.name}`);
  };

  const updateCartQty = (cartItemId, delta) => {
    setCart(prev => prev.map(item => 
      item.cartItemId === cartItemId ? { ...item, qty: Math.max(0, item.qty + delta) } : item
    ).filter(item => item.qty > 0));
  };

  const applyPromoCode = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;
    if (promos[code]) {
      setAppliedPromo({ code, ...promos[code] });
      setPromoError('');
      showToast(`Áp dụng mã ${code} thành công!`);
    } else {
      setPromoError('Mã khuyến mãi không tồn tại!');
      setAppliedPromo(null);
    }
  };

  // --- GỬI THÔNG BÁO ĐƠN HÀNG VỀ TELEGRAM CHỦ QUÁN ---
  const sendOrderNotification = async (order) => {
    const billText = generateBillText(order);
    
    // Nếu chủ quán đã cấu hình Telegram Bot Token & Chat ID
    if (storeConfig.telegramBotToken && storeConfig.telegramChatId) {
      try {
        const url = `https://api.telegram.org/bot${storeConfig.telegramBotToken}/sendMessage`;
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: storeConfig.telegramChatId,
            text: billText
          })
        });
      } catch (error) {
        console.error('Lỗi gửi Telegram:', error);
      }
    }
  };

  const handleCheckoutConfirm = async () => {
    if (!customer.name.trim() || !customer.phone.trim()) {
      showToast('Vui lòng nhập Tên và Số điện thoại để quán liên hệ!');
      return;
    }
    if (orderType === 'delivery' && !customer.address.trim()) {
      showToast('Vui lòng nhập địa chỉ giao hàng!');
      return;
    }

    setIsSendingOrder(true);
    const newOrder = {
      id: 'MC' + Date.now().toString().slice(-6),
      timestamp: Date.now(),
      orderType,
      customer: { ...customer },
      items: [...cart],
      subtotal: cartSubtotal,
      shippingFee: finalShippingFee,
      discount: discountAmount,
      total: cartTotal,
      promoCode: appliedPromo ? appliedPromo.code : null,
      paymentMethod
    };

    await sendOrderNotification(newOrder);

    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setAppliedPromo(null);
    setPromoCodeInput('');
    setShowPaymentModal(false);
    setIsSendingOrder(false);
    setActiveTab('history');
    showToast('🎉 Đặt hàng thành công! Đơn đã gửi tới quán.');
  };

  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  const formatDate = (ts) => new Date(ts).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

  const generateBillText = (order) => {
    let text = `🔔 ĐƠN HÀNG MỚI #${order.id}\n`;
    text += `Hình thức: ${order.orderType === 'delivery' ? '🛵 GIAO TẬN NƠI' : '🏪 TỰ ĐẾN LẤY'}\n`;
    text += `Thời gian: ${formatDate(order.timestamp)}\n`;
    text += `Khách: ${order.customer.name} - ${order.customer.phone}\n`;
    if (order.orderType === 'delivery') {
      text += `Địa chỉ: ${order.customer.address} (${order.customer.distanceKm} km)\n`;
    }
    text += `--------------------------\n`;
    order.items.forEach(item => {
      text += `• ${item.qty}x ${item.name} (${item.size})\n`;
      text += `  [${item.ice}, ${item.sugar}]`;
      if (item.toppings?.length) text += ` + ${item.toppings.map(t => t.name).join(', ')}`;
      if (item.note) text += `\n  📝 Ghi chú: ${item.note}`;
      text += `\n`;
    });
    text += `--------------------------\n`;
    text += `Tiền nước: ${formatMoney(order.subtotal)}\n`;
    if (order.orderType === 'delivery') {
      text += `Phí ship: ${order.shippingFee === 0 ? 'Miễn phí' : formatMoney(order.shippingFee)}\n`;
    }
    if (order.discount > 0 && order.promoCode !== 'FREESHIP') {
      text += `Giảm giá (${order.promoCode}): -${formatMoney(order.discount)}\n`;
    }
    text += `💰 TỔNG THU: ${formatMoney(order.total)}\n`;
    text += `Thanh toán: ${order.paymentMethod === 'qr' ? 'Chuyển khoản QR' : 'Tiền mặt'}`;
    return text;
  };

  const handleShareZalo = async (order) => {
    const text = generateBillText(order);
    if (navigator.share) {
      try { await navigator.share({ title: `Đơn hàng ${order.id}`, text }); } catch (e) {}
    } else {
      navigator.clipboard.writeText(text);
      showToast('Đã sao chép hóa đơn! Dán vào Zalo để gửi ngay.');
    }
  };

  // --- QUẢN TRỊ: THÊM / SỬA / XÓA MÓN ---
  const handleSaveDish = (e) => {
    e.preventDefault();
    if (!newDish.name) return;
    const defaultImg = 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=400&q=80';
    
    if (editingDishId) {
      setMenuData(prev => prev.map(item => item.id === editingDishId ? {
        ...item,
        name: newDish.name,
        acronym: newDish.acronym || item.acronym,
        image: newDish.image || item.image,
        sizes: { 'M': Number(newDish.priceM), 'L': Number(newDish.priceL) }
      } : item));
      setEditingDishId(null);
      showToast('Đã cập nhật thông tin món!');
    } else {
      const created = {
        id: 'm_' + Date.now(),
        name: newDish.name,
        acronym: newDish.acronym.toLowerCase() || newDish.name.split(' ').map(w=>w[0]).join('').toLowerCase(),
        image: newDish.image || defaultImg,
        sizes: { 'M': Number(newDish.priceM), 'L': Number(newDish.priceL) }
      };
      setMenuData([created, ...menuData]);
      showToast('Đã thêm món mới lên thực đơn!');
    }
    setNewDish({ name: '', acronym: '', image: '', priceM: 25000, priceL: 30000 });
  };

  const startEditDish = (dish) => {
    setEditingDishId(dish.id);
    setNewDish({
      name: dish.name,
      acronym: dish.acronym,
      image: dish.image,
      priceM: dish.sizes['M'] || Object.values(dish.sizes)[0],
      priceL: dish.sizes['L'] || (Object.values(dish.sizes)[0] + 5000)
    });
  };

  return (
    <div className="bg-slate-100 min-h-screen flex justify-center font-sans text-slate-800">
      {/* Khung giao diện Responsive: Tối đa max-w-4xl trên Web, Full màn hình trên Mobile */}
      <div className="w-full max-w-4xl bg-white min-h-screen shadow-xl flex flex-col md:flex-row relative">
        
        {/* TOAST THÔNG BÁO */}
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center space-x-2 text-sm font-medium animate-bounce">
            <Sparkles size={16} className="text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* === SIDEBAR NAVIGATION (TRÊN DESKTOP/WEB) === */}
        <div className="hidden md:flex flex-col w-60 bg-amber-950 text-amber-50 p-5 justify-between shrink-0">
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-black text-amber-950 text-xl">M</div>
              <div>
                <h1 className="font-black text-lg tracking-wide text-white">{storeConfig.storeName}</h1>
                <p className="text-xs text-amber-300">Đặt món & Giao hàng</p>
              </div>
            </div>

            <nav className="space-y-2">
              <button onClick={() => setActiveTab('menu')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'menu' ? 'bg-amber-500 text-amber-950' : 'hover:bg-amber-900/60'}`}>
                <Search size={20} /> <span>Thực Đơn</span>
              </button>
              <button onClick={() => setActiveTab('cart')} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'cart' ? 'bg-amber-500 text-amber-950' : 'hover:bg-amber-900/60'}`}>
                <div className="flex items-center space-x-3"><ShoppingBag size={20} /> <span>Giỏ Hàng</span></div>
                {totalItems > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{totalItems}</span>}
              </button>
              <button onClick={() => setActiveTab('history')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'history' ? 'bg-amber-500 text-amber-950' : 'hover:bg-amber-900/60'}`}>
                <Clock size={20} /> <span>Đơn Đã Đặt</span>
              </button>
              <button onClick={() => setActiveTab('admin')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'admin' ? 'bg-amber-500 text-amber-950' : 'hover:bg-amber-900/60'}`}>
                <Settings size={20} /> <span>Quản Lý Quán</span>
              </button>
            </nav>
          </div>

          <div className="bg-amber-900/50 p-3.5 rounded-xl text-xs space-y-1.5 border border-amber-800">
            <p className="font-bold text-amber-300 flex items-center"><Store size={14} className="mr-1.5"/> Địa chỉ quán:</p>
            <p className="text-amber-100/80 leading-relaxed">{storeConfig.storeAddress}</p>
            <p className="text-emerald-400 font-semibold pt-1">🎁 Freeship đơn từ {formatMoney(storeConfig.freeShipThreshold)}</p>
          </div>
        </div>

        {/* === NỘI DUNG CHÍNH === */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden pb-16 md:pb-0">
          
          {/* 1. TAB THỰC ĐƠN (MENU) */}
          {activeTab === 'menu' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              {/* Header Mobile & Search */}
              <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="flex justify-between items-center mb-3 md:hidden">
                  <div>
                    <h1 className="text-xl font-black text-amber-800">{storeConfig.storeName}</h1>
                    <p className="text-xs text-slate-500 flex items-center"><MapPin size={12} className="mr-1 text-amber-600"/> {storeConfig.storeAddress}</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full">
                    Freeship &gt;{storeConfig.freeShipThreshold/1000}k
                  </span>
                </div>

                {/* Chọn hình thức Giao hàng / Tự lấy ngay trên đầu */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-3">
                  <button 
                    onClick={() => setOrderType('delivery')}
                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition-all ${orderType === 'delivery' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500'}`}
                  >
                    <Bike size={16} /> <span>Giao tận nơi</span>
                  </button>
                  <button 
                    onClick={() => setOrderType('pickup')}
                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition-all ${orderType === 'pickup' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500'}`}
                  >
                    <Store size={16} /> <span>Tự đến lấy (0đ ship)</span>
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Tìm tên món hoặc gõ tắt (VD: tstt, tsgnt...)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-xl text-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Danh sách món ăn có Hình ảnh */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {filteredMenu.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => openItemModal(item)}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col cursor-pointer hover:shadow-md active:scale-[0.98] transition-all group"
                    >
                      <div className="h-32 sm:h-36 w-full bg-amber-50 relative overflow-hidden">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          onError={(e) => { e.target.src = 'https://placehold.co/400x300/fef3c7/b45309?text=Maycha'; }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                          {item.acronym}
                        </span>
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <h3 className="font-bold text-slate-800 text-sm line-clamp-2 mb-2">{item.name}</h3>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-amber-700 font-black text-sm">
                            {formatMoney(Object.values(item.sizes)[0])}
                          </span>
                          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            <Plus size={16} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thanh nổi xem giỏ hàng nhanh trên Mobile */}
              {cart.length > 0 && (
                <div className="p-3 bg-white border-t border-slate-200 md:hidden">
                  <button 
                    onClick={() => setActiveTab('cart')}
                    className="w-full py-3 px-4 bg-amber-600 text-white rounded-xl font-bold flex items-center justify-between shadow-lg shadow-amber-600/30"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="bg-amber-800 px-2 py-0.5 rounded-md text-xs">{totalItems}</span>
                      <span>Xem giỏ hàng</span>
                    </div>
                    <span>{formatMoney(cartTotal)}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. TAB GIỎ HÀNG & ĐO KHOẢNG CÁCH */}
          {activeTab === 'cart' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-800 flex items-center">
                  <ShoppingBag className="mr-2 text-amber-600" size={20} /> Chi Tiết Đơn Hàng
                </h2>
                {cart.length > 0 && (
                  <button onClick={() => setCart([])} className="text-xs text-red-500 font-semibold hover:underline">Xóa tất cả</button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <ShoppingBag size={56} className="mx-auto text-slate-300" />
                    <p className="text-slate-500 font-medium">Chưa có món nào trong giỏ hàng</p>
                    <button onClick={() => setActiveTab('menu')} className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm">
                      Quay lại chọn món
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Chọn hình thức nhận hàng */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Hình thức nhận hàng</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button 
                          onClick={() => setOrderType('delivery')}
                          className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center space-y-1 transition-all ${orderType === 'delivery' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-slate-100 text-slate-500'}`}
                        >
                          <Bike size={22} className={orderType === 'delivery' ? 'text-amber-600' : ''} />
                          <span className="font-bold text-xs">Giao tận nơi</span>
                        </button>
                        <button 
                          onClick={() => setOrderType('pickup')}
                          className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center space-y-1 transition-all ${orderType === 'pickup' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-slate-100 text-slate-500'}`}
                        >
                          <Store size={22} className={orderType === 'pickup' ? 'text-amber-600' : ''} />
                          <span className="font-bold text-xs">Tự đến lấy</span>
                        </button>
                      </div>

                      {/* Thông tin khách & Đo khoảng cách */}
                      <div className="pt-2 space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input
                              type="text"
                              placeholder="Tên của bạn *"
                              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-amber-500 outline-none"
                              value={customer.name}
                              onChange={(e) => setCustomer({...customer, name: e.target.value})}
                            />
                          </div>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input
                              type="tel"
                              placeholder="Số điện thoại *"
                              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-amber-500 outline-none"
                              value={customer.phone}
                              onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                            />
                          </div>
                        </div>

                        {orderType === 'delivery' && (
                          <div className="space-y-2 pt-1">
                            <div className="flex space-x-2">
                              <div className="relative flex-1">
                                <MapPin className="absolute left-3 top-2.5 text-amber-600" size={16} />
                                <input
                                  type="text"
                                  placeholder="Nhập địa chỉ giao hàng của bạn *"
                                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:border-amber-500 outline-none"
                                  value={customer.address}
                                  onChange={(e) => setCustomer({...customer, address: e.target.value})}
                                />
                              </div>
                              <button 
                                type="button"
                                onClick={handleCalculateDistance}
                                disabled={isCalculatingDist}
                                className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 hover:bg-blue-700 shrink-0"
                              >
                                <Navigation size={14} />
                                <span>{isCalculatingDist ? 'Đang đo...' : 'Đo KM'}</span>
                              </button>
                            </div>

                            {/* Bảng hiển thị kết quả đo khoảng cách & Phí ship */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="text-slate-500">Khoảng cách ước tính:</span>
                                <input 
                                  type="number" 
                                  step="0.1"
                                  className="w-14 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-bold text-center text-slate-800"
                                  value={customer.distanceKm}
                                  onChange={(e) => setCustomer({...customer, distanceKm: e.target.value})}
                                />
                                <span className="font-bold text-slate-700">km</span>
                              </div>
                              <a 
                                href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(storeConfig.storeAddress)}&destination=${encodeURIComponent(customer.address || 'TP.HCM')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 font-semibold flex items-center hover:underline"
                              >
                                Xem bản đồ <ExternalLink size={12} className="ml-1" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Danh sách món đã chọn */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Món đã chọn ({totalItems})</label>
                      {cart.map(item => (
                        <div key={item.cartItemId} className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-none">
                          <div className="flex space-x-3">
                            <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-cover bg-amber-50 shrink-0" />
                            <div>
                              <h4 className="font-bold text-sm text-slate-800">{item.name} <span className="text-amber-600">({item.size})</span></h4>
                              <p className="text-[11px] text-slate-500">{item.ice}, {item.sugar}</p>
                              {item.toppings?.length > 0 && (
                                <p className="text-[11px] text-amber-700 font-medium">+ {item.toppings.map(t => t.name).join(', ')}</p>
                              )}
                              {item.note && <p className="text-[11px] italic text-slate-400">"{item.note}"</p>}
                              <p className="text-xs font-bold text-slate-700 mt-1">{formatMoney(item.price * item.qty)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1.5 bg-slate-100 rounded-lg p-1">
                            <button onClick={() => updateCartQty(item.cartItemId, -1)} className="p-1 bg-white rounded shadow-sm text-slate-600"><Minus size={12}/></button>
                            <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
                            <button onClick={() => updateCartQty(item.cartItemId, 1)} className="p-1 bg-white rounded shadow-sm text-slate-600"><Plus size={12}/></button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mã khuyến mãi */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">3. Ưu đãi & Khuyến mãi</label>
                      {!appliedPromo ? (
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Nhập mã (VD: SALE10, FREESHIP)"
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm uppercase font-medium"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value)}
                          />
                          <button onClick={applyPromoCode} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs">Áp dụng</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                          <div>
                            <span className="font-bold text-emerald-800 text-sm flex items-center"><Tag size={14} className="mr-1.5"/> {appliedPromo.code}</span>
                            <p className="text-xs text-emerald-600">{appliedPromo.desc}</p>
                          </div>
                          <button onClick={() => { setAppliedPromo(null); setPromoCodeInput(''); }} className="p-1 bg-white rounded-full text-slate-400 hover:text-red-500"><X size={16}/></button>
                        </div>
                      )}
                      {promoError && <p className="text-xs text-red-500 mt-1.5">{promoError}</p>}
                    </div>

                    {/* Bảng tính tổng tiền */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-2 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>Tạm tính tiền món:</span>
                        <span className="font-semibold">{formatMoney(cartSubtotal)}</span>
                      </div>
                      
                      {orderType === 'delivery' && (
                        <div className="flex justify-between text-slate-600">
                          <span>Phí giao hàng ({customer.distanceKm} km):</span>
                          {isFreeShipEligible ? (
                            <span className="text-emerald-600 font-bold">
                              Miễn phí <span className="line-through text-slate-400 font-normal text-xs ml-1">{formatMoney(rawShippingFee)}</span>
                            </span>
                          ) : (
                            <span className="font-semibold">{formatMoney(finalShippingFee)}</span>
                          )}
                        </div>
                      )}

                      {appliedPromo && appliedPromo.type !== 'freeship' && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Khuyến mãi ({appliedPromo.code}):</span>
                          <span className="font-bold">-{formatMoney(discountAmount)}</span>
                        </div>
                      )}

                      <div className="border-t border-dashed border-slate-200 pt-2.5 flex justify-between items-center">
                        <span className="font-bold text-slate-800">Tổng thanh toán:</span>
                        <span className="text-xl font-black text-amber-700">{formatMoney(cartTotal)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 bg-white border-t border-slate-200">
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl shadow-lg shadow-amber-600/30 transition-all"
                  >
                    ĐẶT ĐƠN NGAY • {formatMoney(cartTotal)}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. TAB LỊCH SỬ ĐƠN HÀNG */}
          {activeTab === 'history' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              <div className="p-4 bg-white border-b border-slate-200">
                <h2 className="text-lg font-black text-slate-800 flex items-center">
                  <Clock className="mr-2 text-amber-600" size={20} /> Lịch Sử Đơn Hàng ({orders.length})
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <Clock size={48} className="mx-auto mb-3 opacity-30" />
                    <p>Chưa có đơn hàng nào được ghi nhận</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-slate-800 text-sm">#{order.id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.orderType === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'}`}>
                            {order.orderType === 'delivery' ? `🛵 Giao hàng (${order.customer.distanceKm}km)` : '🏪 Tự đến lấy'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">{formatDate(order.timestamp)}</span>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="text-xs bg-slate-50 p-2.5 rounded-xl space-y-1 text-slate-600">
                          <p><strong>Khách:</strong> {order.customer.name} ({order.customer.phone})</p>
                          {order.orderType === 'delivery' && <p><strong>Địa chỉ:</strong> {order.customer.address}</p>}
                        </div>

                        <div className="space-y-1.5">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span><strong>{item.qty}x</strong> {item.name} ({item.size})</span>
                              <span className="font-semibold">{formatMoney(item.price * item.qty)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <button 
                            onClick={() => handleShareZalo(order)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center space-x-1.5"
                          >
                            <Send size={14} /> <span>Gửi đơn qua Zalo</span>
                          </button>
                          <div className="text-right">
                            <span className="text-[11px] text-slate-400 block">Tổng thanh toán</span>
                            <span className="text-base font-black text-amber-700">{formatMoney(order.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. TAB QUẢN LÝ QUÁN (ADMIN) */}
          {activeTab === 'admin' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              <div className="p-4 bg-white border-b border-slate-200">
                <h2 className="text-lg font-black text-slate-800 flex items-center mb-3">
                  <Settings className="mr-2 text-amber-600" size={20} /> Quản Lý Cửa Hàng
                </h2>
                <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setAdminSubTab('dishes')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${adminSubTab === 'dishes' ? 'bg-white shadow text-amber-700' : 'text-slate-500'}`}>Món & Ảnh</button>
                  <button onClick={() => setAdminSubTab('promos')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${adminSubTab === 'promos' ? 'bg-white shadow text-amber-700' : 'text-slate-500'}`}>Mã Khuyến Mãi</button>
                  <button onClick={() => setAdminSubTab('settings')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${adminSubTab === 'settings' ? 'bg-white shadow text-amber-700' : 'text-slate-500'}`}>Ship & Nhận Đơn</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Sub-tab 1: Quản lý Món & Ảnh */}
                {adminSubTab === 'dishes' && (
                  <>
                    <form onSubmit={handleSaveDish} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                      <h3 className="font-bold text-sm text-slate-800">{editingDishId ? '✏️ Chỉnh sửa món' : '➕ Thêm món mới'}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input type="text" placeholder="Tên món *" required className="px-3 py-2 border border-slate-200 rounded-xl text-sm" value={newDish.name} onChange={e => setNewDish({...newDish, name: e.target.value})} />
                        <input type="text" placeholder="Viết tắt (VD: tstt)" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" value={newDish.acronym} onChange={e => setNewDish({...newDish, acronym: e.target.value})} />
                      </div>
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input type="url" placeholder="Dán link ảnh minh họa món (URL)..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm" value={newDish.image} onChange={e => setNewDish({...newDish, image: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] text-slate-500 font-semibold">Giá Size M (VNĐ)</label>
                          <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold" value={newDish.priceM} onChange={e => setNewDish({...newDish, priceM: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 font-semibold">Giá Size L (VNĐ)</label>
                          <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold" value={newDish.priceL} onChange={e => setNewDish({...newDish, priceL: e.target.value})} />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button type="submit" className="flex-1 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-sm">
                          {editingDishId ? 'Cập Nhật Món' : 'Thêm Vào Menu'}
                        </button>
                        {editingDishId && (
                          <button type="button" onClick={() => { setEditingDishId(null); setNewDish({ name: '', acronym: '', image: '', priceM: 25000, priceL: 30000 }); }} className="px-4 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-sm">Hủy</button>
                        )}
                      </div>
                    </form>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-2.5">
                      <h3 className="font-bold text-sm text-slate-800">Danh sách thực đơn ({menuData.length} món)</h3>
                      {menuData.map(dish => (
                        <div key={dish.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center space-x-3">
                            <img src={dish.image} alt="" className="w-11 h-11 rounded-lg object-cover bg-amber-100" />
                            <div>
                              <p className="font-bold text-sm text-slate-800">{dish.name}</p>
                              <p className="text-xs text-amber-700 font-semibold">
                                {Object.entries(dish.sizes).map(([s, p]) => `${s}: ${p/1000}k`).join(' • ')}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <button onClick={() => startEditDish(dish)} className="px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">Sửa</button>
                            <button onClick={() => setMenuData(menuData.filter(d => d.id !== dish.id))} className="p-1.5 bg-red-50 text-red-500 rounded-lg"><Trash2 size={15}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Sub-tab 2: Quản lý Mã Khuyến Mãi */}
                {adminSubTab === 'promos' && (
                  <>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!newPromo.code) return;
                      const c = newPromo.code.trim().toUpperCase();
                      setPromos({ ...promos, [c]: { type: newPromo.type, value: Number(newPromo.value), desc: newPromo.desc || `Ưu đãi mã ${c}` } });
                      setNewPromo({ code: '', type: 'percent', value: 10, desc: '' });
                      showToast(`Đã tạo mã ${c}`);
                    }} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                      <h3 className="font-bold text-sm text-slate-800">🎟️ Tạo mã khuyến mãi mới</h3>
                      <input type="text" placeholder="Tên mã (VD: GIAM15, FREESHIP2)" required className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm uppercase font-bold" value={newPromo.code} onChange={e => setNewPromo({...newPromo, code: e.target.value})} />
                      <div className="grid grid-cols-2 gap-2">
                        <select className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white" value={newPromo.type} onChange={e => setNewPromo({...newPromo, type: e.target.value})}>
                          <option value="percent">Giảm theo %</option>
                          <option value="fixed">Giảm tiền mặt (VNĐ)</option>
                          <option value="freeship">Miễn phí vận chuyển</option>
                        </select>
                        {newPromo.type !== 'freeship' && (
                          <input type="number" placeholder="Giá trị (10 hoặc 20000)" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" value={newPromo.value} onChange={e => setNewPromo({...newPromo, value: e.target.value})} />
                        )}
                      </div>
                      <input type="text" placeholder="Mô tả ngắn (VD: Giảm 15% cho khách mới)" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" value={newPromo.desc} onChange={e => setNewPromo({...newPromo, desc: e.target.value})} />
                      <button type="submit" className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm">Lưu Mã Khuyến Mãi</button>
                    </form>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-2">
                      <h3 className="font-bold text-sm text-slate-800">Danh sách mã đang chạy</h3>
                      {Object.entries(promos).map(([code, info]) => (
                        <div key={code} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <div>
                            <span className="font-black text-emerald-700 text-sm">{code}</span>
                            <p className="text-xs text-slate-500">{info.desc}</p>
                          </div>
                          <button onClick={() => { const copy = {...promos}; delete copy[code]; setPromos(copy); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Sub-tab 3: Cấu hình Ship & Nhận thông báo đơn hàng */}
                {adminSubTab === 'settings' && (
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 mb-2 flex items-center"><Bike size={16} className="mr-1.5 text-amber-600"/> Cấu hình Quán & Phí Ship</h3>
                      <div className="space-y-2.5 text-sm">
                        <div>
                          <label className="text-xs text-slate-500">Tên quán của bạn</label>
                          <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl" value={storeConfig.storeName} onChange={e => setStoreConfig({...storeConfig, storeName: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">Địa chỉ quán (Làm mốc đo km)</label>
                          <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl" value={storeConfig.storeAddress} onChange={e => setStoreConfig({...storeConfig, storeAddress: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-500">Ship 2km đầu</label>
                            <input type="number" className="w-full px-2.5 py-2 border border-slate-200 rounded-xl font-bold" value={storeConfig.baseShipFee} onChange={e => setStoreConfig({...storeConfig, baseShipFee: Number(e.target.value)})} />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-500">Mỗi km tiếp</label>
                            <input type="number" className="w-full px-2.5 py-2 border border-slate-200 rounded-xl font-bold" value={storeConfig.perKmFee} onChange={e => setStoreConfig({...storeConfig, perKmFee: Number(e.target.value)})} />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-500">Đơn Freeship</label>
                            <input type="number" className="w-full px-2.5 py-2 border border-slate-200 rounded-xl font-bold text-emerald-700" value={storeConfig.freeShipThreshold} onChange={e => setStoreConfig({...storeConfig, freeShipThreshold: Number(e.target.value)})} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <h3 className="font-bold text-sm text-slate-800 mb-1 flex items-center"><Bell size={16} className="mr-1.5 text-blue-600"/> Nhận thông báo đơn tự động qua Telegram</h3>
                      <p className="text-xs text-slate-500 mb-3">Mỗi khi khách bấm đặt hàng, hệ thống sẽ tự động bắn tin nhắn chi tiết đơn về điện thoại của bạn.</p>
                      <div className="space-y-2.5 text-sm">
                        <input type="text" placeholder="Dán Telegram Bot Token tại đây..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" value={storeConfig.telegramBotToken} onChange={e => setStoreConfig({...storeConfig, telegramBotToken: e.target.value})} />
                        <input type="text" placeholder="Dán Telegram Chat ID của bạn tại đây..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" value={storeConfig.telegramChatId} onChange={e => setStoreConfig({...storeConfig, telegramChatId: e.target.value})} />
                      </div>
                    </div>

                    <button onClick={() => showToast('Đã lưu toàn bộ cấu hình cửa hàng!')} className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl text-sm">
                      Lưu Cài Đặt
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

        {/* === BOTTOM NAVIGATION (TRÊN ĐIỆN THOẠI) === */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 px-1 z-30">
          <button onClick={() => setActiveTab('menu')} className={`flex flex-col items-center flex-1 py-1 rounded-xl ${activeTab === 'menu' ? 'text-amber-600' : 'text-slate-400'}`}>
            <Search size={20} /> <span className="text-[10px] font-bold mt-0.5">Thực đơn</span>
          </button>
          <button onClick={() => setActiveTab('cart')} className={`flex flex-col items-center flex-1 py-1 rounded-xl relative ${activeTab === 'cart' ? 'text-amber-600' : 'text-slate-400'}`}>
            <div className="relative">
              <ShoppingBag size={20} />
              {totalItems > 0 && <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{totalItems}</span>}
            </div>
            <span className="text-[10px] font-bold mt-0.5">Giỏ hàng</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center flex-1 py-1 rounded-xl ${activeTab === 'history' ? 'text-amber-600' : 'text-slate-400'}`}>
            <Clock size={20} /> <span className="text-[10px] font-bold mt-0.5">Đơn hàng</span>
          </button>
          <button onClick={() => setActiveTab('admin')} className={`flex flex-col items-center flex-1 py-1 rounded-xl ${activeTab === 'admin' ? 'text-amber-600' : 'text-slate-400'}`}>
            <Settings size={20} /> <span className="text-[10px] font-bold mt-0.5">Quản lý</span>
          </button>
        </div>

        {/* === MODAL TÙY CHỈNH MÓN === */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white w-full max-w-md max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
              <div className="relative h-40 bg-amber-100 shrink-0">
                <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                <button onClick={() => setSelectedItem(null)} className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black">
                  <X size={18} />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-white">
                  <h3 className="text-lg font-black">{selectedItem.name}</h3>
                  <p className="text-sm text-amber-300 font-bold">{formatMoney(selectedItem.sizes[modalData.size] || 0)}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase mb-2">Chọn Size</h4>
                  <div className="flex gap-2">
                    {Object.entries(selectedItem.sizes).map(([size, price]) => (
                      <button
                        key={size}
                        onClick={() => setModalData({...modalData, size})}
                        className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${modalData.size === size ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-100 text-slate-500'}`}
                      >
                        Size {size} <span className="block text-[11px] font-normal">{formatMoney(price)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase mb-2">Mức Đá</h4>
                    <div className="space-y-1.5">
                      {ICE_LEVELS.map(level => (
                        <button key={level} onClick={() => setModalData({...modalData, ice: level})} className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-left border ${modalData.ice === level ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-600'}`}>
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase mb-2">Mức Đường</h4>
                    <div className="space-y-1.5">
                      {SUGAR_LEVELS.map(level => (
                        <button key={level} onClick={() => setModalData({...modalData, sugar: level})} className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-left border ${modalData.sugar === level ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 text-slate-600'}`}>
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase mb-2">Thêm Topping</h4>
                  <div className="space-y-2">
                    {TOPPINGS.map(t => {
                      const active = modalData.toppings.some(x => x.id === t.id);
                      return (
                        <div key={t.id} onClick={() => toggleTopping(t)} className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer ${active ? 'border-amber-500 bg-amber-50' : 'border-slate-100'}`}>
                          <span className="text-sm font-medium">{t.name}</span>
                          <span className="text-xs font-bold text-amber-700">+{formatMoney(t.price)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase mb-2">Ghi chú cho quán</h4>
                  <input type="text" placeholder="VD: Ít trân châu, để đá riêng..." className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" value={modalData.note} onChange={e => setModalData({...modalData, note: e.target.value})} />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-white flex items-center space-x-3 shrink-0">
                <div className="flex items-center border border-slate-200 rounded-xl">
                  <button onClick={() => setModalData({...modalData, qty: Math.max(1, modalData.qty - 1)})} className="p-3 text-slate-600"><Minus size={16}/></button>
                  <span className="w-8 text-center font-black">{modalData.qty}</span>
                  <button onClick={() => setModalData({...modalData, qty: modalData.qty + 1})} className="p-3 text-slate-600"><Plus size={16}/></button>
                </div>
                <button onClick={handleAddToCart} className="flex-1 py-3.5 bg-amber-600 text-white font-black rounded-xl text-sm shadow-lg shadow-amber-600/30">
                  Thêm • {formatMoney(((selectedItem.sizes[modalData.size] || 0) + modalData.toppings.reduce((s, t) => s + t.price, 0)) * modalData.qty)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === MODAL XÁC NHẬN THANH TOÁN === */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-4 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                <h3 className="font-black text-slate-800">Xác nhận đặt đơn</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-400 hover:text-red-500"><X size={20}/></button>
              </div>
              <div className="p-4 space-y-3">
                <button onClick={() => setPaymentMethod('cash')} className={`w-full p-3.5 rounded-xl border-2 flex items-center justify-between font-bold text-sm ${paymentMethod === 'cash' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-slate-100 text-slate-600'}`}>
                  <span>💵 Thanh toán khi nhận hàng (Tiền mặt)</span>
                  {paymentMethod === 'cash' && <CheckCircle2 size={18} className="text-amber-600"/>}
                </button>
                <button onClick={() => setPaymentMethod('qr')} className={`w-full p-3.5 rounded-xl border-2 flex items-center justify-between font-bold text-sm ${paymentMethod === 'qr' ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-slate-100 text-slate-600'}`}>
                  <span>📱 Chuyển khoản ngân hàng (QR)</span>
                  {paymentMethod === 'qr' && <CheckCircle2 size={18} className="text-blue-600"/>}
                </button>

                {paymentMethod === 'qr' && (
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-center space-y-2">
                    <p className="text-xs font-bold text-blue-800">Quét mã QR để thanh toán trước</p>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=MAYCHA_${cartTotal}`} 
                      alt="QR Thanh Toán" 
                      className="w-36 h-36 mx-auto rounded-xl border-4 border-white shadow"
                    />
                    <p className="text-base font-black text-blue-950">{formatMoney(cartTotal)}</p>
                  </div>
                )}
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={handleCheckoutConfirm} 
                  disabled={isSendingOrder}
                  className="w-full py-3.5 bg-slate-900 text-white font-black rounded-xl text-sm hover:bg-black"
                >
                  {isSendingOrder ? 'ĐANG GỬI ĐƠN...' : 'HOÀN TẤT ĐẶT HÀNG'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}