"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function CheckoutPage() {
  const { t, isArabic } = useLanguage();
  const router = useRouter();
  const {
    cartItems,
    subtotal,
    deliveryFee,
    discountAmount,
    grandTotal,
    selectedZone,
    setSelectedZone,
    deliveryZones,
    FREE_DELIVERY_THRESHOLD,
    promoCode: appliedPromo,
    clearCart,
  } = useCart();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    building: "",
    floor: "",
    apartment: "",
    city: "",
    notes: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [orderError, setOrderError] = useState("");
  const [stockCheckLoading, setStockCheckLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <>
        <Navbar />
        <main className="page-content">
          <div className="container py-20 flex justify-center">
            <div className="w-10 h-10 rounded-full border-4 border-amber-100 border-t-amber-600 animate-spin" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (cartItems.length === 0) {
    return (
      <>
        <Navbar />
        <main className="page-content">
          <div className="container py-20">
            <div className="empty-state">
              <div className="text-8xl">🛒</div>
              <div>
                <h2 className="text-2xl font-black text-stone-800 mb-2">
                  {isArabic ? "سلة التسوق فارغة" : "Your Cart is Empty"}
                </h2>
                <p className="text-stone-400">
                  {isArabic ? "أضف بعض المنتجات أولاً" : "Add some products first"}
                </p>
              </div>
              <Link href="/shop" className="btn btn-primary btn-lg">
                {isArabic ? "تسوق الآن" : "Shop Now"}
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = isArabic ? "الاسم الأول مطلوب" : "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = isArabic ? "اسم العائلة مطلوب" : "Last name is required";
    if (!formData.phone.trim()) newErrors.phone = isArabic ? "رقم الهاتف مطلوب" : "Phone number is required";
    else if (!/^[0-9+\s-]{8,15}$/.test(formData.phone)) newErrors.phone = isArabic ? "رقم هاتف غير صحيح" : "Invalid phone number";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = isArabic ? "بريد إلكتروني غير صحيح" : "Invalid email";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.address.trim()) newErrors.address = isArabic ? "العنوان مطلوب" : "Address is required";
    if (!formData.city.trim()) newErrors.city = isArabic ? "المدينة مطلوبة" : "City is required";
    if (!selectedZone) {
      newErrors.deliveryZone = isArabic
        ? "يجب اختيار منطقة التوصيل أولاً"
        : "You must select a delivery zone first";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      window.scrollTo(0, 0);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
      window.scrollTo(0, 0);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedZone) {
      setErrors((prev) => ({
        ...prev,
        deliveryZone: isArabic
          ? "يجب اختيار منطقة التوصيل أولاً"
          : "You must select a delivery zone first",
      }));
      setCurrentStep(2);
      window.scrollTo(0, 0);
      return;
    }

    setLoading(true);
    setOrderError("");

    // ── Stock re-validation before submit ──────────────────
    try {
      setStockCheckLoading(true);
      const outOfStock = [];
      for (const item of cartItems) {
        if (!item.slug) continue;
        const res = await fetch(`/api/products/${item.slug}`);
        const data = await res.json();
        if (!data.success || !data.data) continue;
        const p = data.data;
        if (p.soldOut || Number(p.currentStockPcs) < item.quantity) {
          outOfStock.push(isArabic ? item.nameAr : item.nameEn);
        }
      }
      setStockCheckLoading(false);
      if (outOfStock.length > 0) {
        setOrderError(
          isArabic
            ? `المخزون غير كافٍ: ${outOfStock.join("، ")}`
            : `Out of stock: ${outOfStock.join(", ")}`
        );
        setLoading(false);
        return;
      }
    } catch {
      setStockCheckLoading(false);
      // Non-fatal — continue to submit; server will re-validate
    }

    try {
      const orderData = {
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email || null,
          address: formData.address,
          building: formData.building || null,
          floor: formData.floor || null,
          apartment: formData.apartment || null,
          city: formData.city,
          notes: formData.notes || null,
        },
        items: cartItems.map((item) => ({
          stockId: item.stockId,
          nameEn: item.nameEn,
          nameAr: item.nameAr,
          price: item.price,
          quantity: item.quantity,
          weight: item.weight || null,
          type: item.type || "single",
        })),
        subtotal,
        deliveryFee,
        discountAmount,
        grandTotal,
        paymentMethod,
        deliveryZone: selectedZone
          ? isArabic ? selectedZone.nameAr : selectedZone.nameEn
          : null,
        promoCode: appliedPromo?.code || null,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (data.success) {
        const order = {
          orderNumber: data.data.orderNumber,
          items: cartItems,
          customer: formData,
          paymentMethod,
          subtotal,
          deliveryFee,
          discountAmount,
          grandTotal,
          deliveryZone: selectedZone,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(`order_${data.data.orderNumber}`, JSON.stringify(order));
        localStorage.setItem("lastOrder", JSON.stringify(order));
        clearCart();
        router.push(`/order-confirmation?order=${data.data.orderNumber}`);
      } else {
        setOrderError(isArabic ? `فشل إنشاء الطلب: ${data.message}` : `Failed: ${data.message}`);
        setLoading(false);
      }
    } catch (error) {
      console.error("Place order error:", error);
      setOrderError(isArabic ? "حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى." : "A connection error occurred. Please try again.");
      setLoading(false);
    }
  };

  const paymentMethods = [
    { id: "cash", icon: "💵", titleEn: "Cash on Delivery", titleAr: "الدفع عند الاستلام", descEn: "Pay when your order arrives", descAr: "ادفع عند وصول طلبك" },
    { id: "card", icon: "💳", titleEn: "Credit / Debit Card", titleAr: "بطاقة ائتمان / خصم", descEn: "Coming soon", descAr: "قريباً", disabled: true },
  ];

  const steps = [
    { number: 1, titleEn: "Personal Info", titleAr: "المعلومات الشخصية" },
    { number: 2, titleEn: "Delivery Address", titleAr: "عنوان التوصيل" },
    { number: 3, titleEn: "Payment", titleAr: "الدفع" },
  ];

  return (
    <>
      <Navbar />
      <main className="page-content">

        {/* Header */}
        <div className="bg-stone-900 py-8">
          <div className="container">
            <div className="breadcrumb mb-4">
              <Link href="/" className="text-stone-400 hover:text-amber-400">{t.nav.home}</Link>
              <span className="breadcrumb-separator text-stone-600">›</span>
              <span className="text-stone-300">{isArabic ? "إتمام الطلب" : "Checkout"}</span>
            </div>
            <h1 className="text-2xl font-black text-white">
              {isArabic ? "إتمام الطلب" : "Checkout"}
            </h1>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white border-b border-stone-200">
          <div className="container py-4">
            <div className="flex items-center justify-center gap-0">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${currentStep > step.number ? "bg-green-500 text-white" : currentStep === step.number ? "bg-amber-700 text-white" : "bg-stone-200 text-stone-500"}`}>
                      {currentStep > step.number ? "✓" : step.number}
                    </div>
                    <span className={`text-xs mt-1 font-medium hidden sm:block ${currentStep === step.number ? "text-amber-700" : "text-stone-400"}`}>
                      {isArabic ? step.titleAr : step.titleEn}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 w-16 sm:w-24 mx-2 transition-all ${currentStep > step.number ? "bg-green-500" : "bg-stone-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Form */}
            <div className="lg:col-span-2">

              {/* Step 1 */}
              {currentStep === 1 && (
                <div className="checkout-step">
                  <div className="checkout-step-title">
                    <div className="checkout-step-number">1</div>
                    <h2>{isArabic ? "المعلومات الشخصية" : "Personal Information"}</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                        {isArabic ? "الاسم الأول" : "First Name"} <span className="text-red-500">*</span>
                      </label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={`input ${errors.firstName ? "input-error" : ""}`} placeholder={isArabic ? "أدخل اسمك الأول" : "Enter first name"} />
                      {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                        {isArabic ? "اسم العائلة" : "Last Name"} <span className="text-red-500">*</span>
                      </label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={`input ${errors.lastName ? "input-error" : ""}`} placeholder={isArabic ? "أدخل اسم العائلة" : "Enter last name"} />
                      {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                        {isArabic ? "رقم الهاتف" : "Phone Number"} <span className="text-red-500">*</span>
                      </label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`input ${errors.phone ? "input-error" : ""}`} placeholder="+974 XXXX XXXX" dir="ltr" />
                      {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                        {isArabic ? "البريد الإلكتروني" : "Email"} <span className="text-stone-400 text-xs">({isArabic ? "اختياري" : "Optional"})</span>
                      </label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className={`input ${errors.email ? "input-error" : ""}`} placeholder="example@email.com" dir="ltr" />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button onClick={handleNextStep} className="btn btn-primary btn-lg">
                      {isArabic ? "التالي" : "Next"}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {currentStep === 2 && (
                <div className="checkout-step">
                  <div className="checkout-step-title">
                    <div className="checkout-step-number">2</div>
                    <h2>{isArabic ? "عنوان التوصيل" : "Delivery Address"}</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                        {isArabic ? "عنوان الشارع" : "Street Address"} <span className="text-red-500">*</span>
                      </label>
                      <input type="text" name="address" value={formData.address} onChange={handleChange} className={`input ${errors.address ? "input-error" : ""}`} placeholder={isArabic ? "رقم الشارع واسمه" : "Street number and name"} />
                      {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-1.5">{isArabic ? "المبنى" : "Building"}</label>
                        <input type="text" name="building" value={formData.building} onChange={handleChange} className="input" placeholder={isArabic ? "رقم" : "No."} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-1.5">{isArabic ? "الطابق" : "Floor"}</label>
                        <input type="text" name="floor" value={formData.floor} onChange={handleChange} className="input" placeholder={isArabic ? "رقم" : "No."} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-1.5">{isArabic ? "الشقة" : "Apartment"}</label>
                        <input type="text" name="apartment" value={formData.apartment} onChange={handleChange} className="input" placeholder={isArabic ? "رقم" : "No."} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                        {isArabic ? "المدينة / المنطقة" : "City / Area"} <span className="text-red-500">*</span>
                      </label>
                      <select name="city" value={formData.city} onChange={handleChange} className={`input ${errors.city ? "input-error" : ""}`}>
                        <option value="">{isArabic ? "اختر المنطقة" : "Select area"}</option>
                        {[
                          { en: "Doha Center", ar: "وسط الدوحة" },
                          { en: "Al Rayyan", ar: "الريان" },
                          { en: "Lusail", ar: "لوسيل" },
                          { en: "Al Wakra", ar: "الوكرة" },
                          { en: "Al Khor", ar: "الخور" },
                          { en: "Al Daayen", ar: "الضعاين" },
                          { en: "Umm Salal", ar: "أم صلال" },
                          { en: "Al Shamal", ar: "الشمال" },
                          { en: "Other", ar: "أخرى" },
                        ].map((city) => (
                          <option key={city.en} value={city.en}>
                            {isArabic ? city.ar : city.en}
                          </option>
                        ))}
                      </select>
                      {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                        {isArabic ? "ملاحظات إضافية" : "Additional Notes"} <span className="text-stone-400 text-xs">({isArabic ? "اختياري" : "Optional"})</span>
                      </label>
                      <textarea name="notes" value={formData.notes} onChange={handleChange} className="input resize-none" rows={3} placeholder={isArabic ? "أي تعليمات خاصة..." : "Any special instructions..."} />
                    </div>
                  </div>
                  {/* ── Delivery Zone ── */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      {isArabic ? "منطقة التوصيل" : "Delivery Zone"} <span className="text-red-500">*</span>
                    </label>
                    {deliveryZones.length === 0 ? (
                      <p className="text-xs text-stone-400">{isArabic ? "جاري تحميل المناطق..." : "Loading zones..."}</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {deliveryZones.map((zone) => (
                          <button
                            key={zone.id}
                            type="button"
                            onClick={() => {
                              setSelectedZone(zone);
                              if (errors.deliveryZone) setErrors((prev) => ({ ...prev, deliveryZone: "" }));
                            }}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                              selectedZone?.id === zone.id
                                ? "border-amber-700 bg-amber-50"
                                : "border-stone-200 hover:border-amber-300"
                            }`}
                          >
                            <p className="font-bold text-stone-800 text-sm">{isArabic ? zone.nameAr : zone.nameEn}</p>
                            <p className="text-xs text-stone-400 mt-0.5">{isArabic ? zone.estimatedTimeAr : zone.estimatedTime}</p>
                            <p className="text-sm font-black text-amber-700 mt-1">
                              {subtotal >= FREE_DELIVERY_THRESHOLD
                                ? isArabic ? "مجاني 🎉" : "Free 🎉"
                                : `${zone.price} ${t.general.qar}`}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    {errors.deliveryZone && <p className="text-xs text-red-500 mt-1">{errors.deliveryZone}</p>}
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button onClick={() => setCurrentStep(1)} className="btn btn-outline btn-lg">
                      {isArabic ? "السابق" : "Back"}
                    </button>
                    <button onClick={handleNextStep} className="btn btn-primary btn-lg">
                      {isArabic ? "التالي" : "Next"}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {currentStep === 3 && (
                <div className="checkout-step">
                  <div className="checkout-step-title">
                    <div className="checkout-step-number">3</div>
                    <h2>{isArabic ? "طريقة الدفع" : "Payment Method"}</h2>
                  </div>
                  <div className="flex flex-col gap-3 mb-6">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        onClick={() => !method.disabled && setPaymentMethod(method.id)}
                        className={`payment-option ${paymentMethod === method.id ? "selected" : ""} ${method.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div className="payment-radio">
                          {paymentMethod === method.id && <div className="payment-radio-dot" />}
                        </div>
                        <span className="text-2xl">{method.icon}</span>
                        <div className="flex-1">
                          <p className="font-bold text-stone-800 text-sm">{isArabic ? method.titleAr : method.titleEn}</p>
                          <p className="text-xs text-stone-400">{isArabic ? method.descAr : method.descEn}</p>
                        </div>
                        {method.disabled && (
                          <span className="text-[10px] font-bold bg-stone-200 text-stone-500 px-2 py-0.5 rounded-full">
                            {isArabic ? "قريباً" : "Soon"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Order Review */}
                  <div className="bg-stone-50 rounded-xl p-4 mb-6">
                    <h3 className="font-bold text-stone-800 mb-3 text-sm">
                      {isArabic ? "مراجعة الطلب" : "Order Review"}
                    </h3>
                    <div className="flex flex-col gap-2">
                      {cartItems.map((item) => (
                        <div key={item.cartItemId} className="flex items-center justify-between text-sm">
                          <span className="text-stone-600">
                            {isArabic ? item.nameAr : item.nameEn}
                            {item.weight && <span className="text-stone-400 ml-1">({item.weight})</span>}
                            <span className="text-stone-400 ml-1">x{item.quantity}</span>
                          </span>
                          <span className="font-semibold text-stone-800">
                            {(item.price * item.quantity).toFixed(2)} {t.general.qar}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {orderError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                      <p className="text-red-700 text-sm font-semibold">{orderError}</p>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <button onClick={() => setCurrentStep(2)} className="btn btn-outline btn-lg">
                      {isArabic ? "السابق" : "Back"}
                    </button>
                    <button onClick={handlePlaceOrder} disabled={loading || stockCheckLoading} className="btn btn-primary btn-lg">
                      {stockCheckLoading
                        ? (isArabic ? "جاري التحقق من المخزون..." : "Checking stock...")
                        : loading
                        ? (isArabic ? "جاري تأكيد الطلب..." : "Placing Order...")
                        : (isArabic ? "تأكيد الطلب" : "Place Order")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="sticky-summary">
              <div className="bg-white rounded-2xl border border-stone-200 p-5">
                <h3 className="font-bold text-stone-800 text-lg mb-5">
                  {isArabic ? "ملخص الطلب" : "Order Summary"}
                </h3>
                <div className="flex flex-col gap-3 mb-4">
                  {cartItems.map((item) => (
                    <div key={item.cartItemId} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">🌶️</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-800 truncate">
                          {isArabic ? item.nameAr : item.nameEn}
                        </p>
                        {item.weight && <p className="text-xs text-stone-400">{item.weight} × {item.quantity}</p>}
                      </div>
                      <p className="text-sm font-bold text-stone-800 flex-shrink-0">
                        {(item.price * item.quantity).toFixed(2)} {t.general.qar}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="divider" />
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-600">{isArabic ? "منطقة التوصيل" : "Delivery Zone"}</span>
                    <span className={`font-semibold ${selectedZone ? "text-stone-800" : "text-red-600"}`}>
                      {selectedZone
                        ? (isArabic ? selectedZone.nameAr : selectedZone.nameEn)
                        : (isArabic ? "غير محددة" : "Not selected")}
                    </span>
                  </div>
                  {errors.deliveryZone && (
                    <p className="text-xs text-red-500 -mt-1">{errors.deliveryZone}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-600">{isArabic ? "المجموع الفرعي" : "Subtotal"}</span>
                    <span className="font-semibold text-stone-800">{subtotal.toFixed(2)} {t.general.qar}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-stone-600">{isArabic ? "رسوم التوصيل" : "Delivery Fee"}</span>
                    <span className={`font-semibold ${deliveryFee === 0 ? "text-green-600" : "text-stone-800"}`}>
                      {deliveryFee === 0 ? (isArabic ? "مجاني 🎉" : "Free 🎉") : `${deliveryFee} ${t.general.qar}`}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-600">{isArabic ? "الخصم" : "Discount"}</span>
                      <span className="font-semibold text-green-600">-{discountAmount.toFixed(2)} {t.general.qar}</span>
                    </div>
                  )}
                </div>
                <div className="divider" />
                <div className="flex items-center justify-between mb-4">
                  <span className="font-black text-stone-900 text-lg">{isArabic ? "الإجمالي" : "Total"}</span>
                  <span className="font-black text-stone-900 text-2xl">
                    {grandTotal.toFixed(2)} <span className="text-sm font-semibold text-stone-500">{t.general.qar}</span>
                  </span>
                </div>
                <p className="text-xs text-stone-400 text-center mt-4">
                  {isArabic ? "دفع آمن ومشفر 100%" : "100% Secure & Encrypted"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── MOBILE STICKY TOTAL ─── shown on mobile so users can see total while filling the form */}
      <div className="lg:hidden fixed left-0 right-0 z-40 px-4"
        style={{ bottom: "calc(var(--mobile-nav-height) + 0.5rem)" }}>
        <div className="bg-stone-900 text-white rounded-2xl px-5 py-3 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2 text-sm text-stone-300">
            <span>{cartCount} {isArabic ? "منتج" : "items"}</span>
            {deliveryFee === 0 && (
              <span className="text-green-400 text-xs font-semibold">· {isArabic ? "توصيل مجاني" : "Free delivery"}</span>
            )}
          </div>
          <span className="font-black text-lg">
            {grandTotal.toFixed(2)} <span className="text-sm font-semibold text-stone-400">{t.general.qar}</span>
          </span>
        </div>
      </div>

      <Footer />
    </>
  );
}