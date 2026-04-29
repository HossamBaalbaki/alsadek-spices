"use client";

import { useLanguage } from "@/context/LanguageContext";

// ─── MAIN BUTTON COMPONENT ───────────────────────────
export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
  icon = null,
  iconPosition = "left",
}) {
  const { isArabic } = useLanguage();

  // ─── VARIANT STYLES ───────────────────────────
  const variants = {
    primary: "btn btn-primary",
    secondary: "btn btn-secondary",
    outline: "btn btn-outline",
    ghost: "btn btn-ghost",
    disabled: "btn btn-disabled",
    danger:
      "btn bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700",
    success:
      "btn bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700",
    whatsapp:
      "btn bg-[#25d366] text-white border-[#25d366] hover:bg-[#20b858] hover:border-[#20b858]",
  };

  // ─── SIZE STYLES ───────────────────────────
  const sizes = {
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
  };

  // ─── BUILD CLASS NAME ───────────────────────────
  const classes = [
    variants[disabled ? "disabled" : variant],
    sizes[size],
    fullWidth ? "btn-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // ─── LOADING SPINNER ───────────────────────────
  const LoadingSpinner = () => (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8z"
      />
    </svg>
  );

  // ─── ICON POSITION ───────────────────────────
  // Flip icon position for Arabic RTL
  const effectiveIconPosition =
    isArabic && iconPosition === "left" ? "right" : iconPosition;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
    >
      {/* Loading spinner */}
      {loading && <LoadingSpinner />}

      {/* Icon on left */}
      {!loading && icon && effectiveIconPosition === "left" && (
        <span className="flex-shrink-0">{icon}</span>
      )}

      {/* Button text */}
      {children}

      {/* Icon on right */}
      {!loading && icon && effectiveIconPosition === "right" && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </button>
  );
}

// ─── ADD TO CART BUTTON ───────────────────────────
export function AddToCartButton({
  isSoldOut,
  onClick,
  loading = false,
  size = "md",
  fullWidth = false,
}) {
  const { t } = useLanguage();

  if (isSoldOut) {
    return (
      <Button
        variant="disabled"
        size={size}
        fullWidth={fullWidth}
        disabled={true}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        }
      >
        {t.product.soldOut}
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size={size}
      fullWidth={fullWidth}
      loading={loading}
      onClick={onClick}
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      }
    >
      {t.product.addToCart}
    </Button>
  );
}

// ─── NOTIFY ME BUTTON ───────────────────────────
export function NotifyMeButton({ onClick }) {
  const { t } = useLanguage();

  return (
    <Button
      variant="outline"
      fullWidth={true}
      onClick={onClick}
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      }
    >
      {t.product.notifyMe}
    </Button>
  );
}

// ─── WHATSAPP BUTTON ───────────────────────────
export function WhatsAppButton({ phone, message, children }) {
  const handleClick = () => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <Button
      variant="whatsapp"
      onClick={handleClick}
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      }
    >
      {children}
    </Button>
  );
}

// ─── QUANTITY SELECTOR COMPONENT ───────────────────────────
export function QuantitySelector({ quantity, onIncrease, onDecrease, min = 1, max = 99 }) {
  return (
    <div className="quantity-selector">
      {/* Decrease button */}
      <button
        className="quantity-btn"
        onClick={onDecrease}
        disabled={quantity <= min}
        aria-label="Decrease quantity"
      >
        −
      </button>

      {/* Quantity value */}
      <span className="quantity-value">{quantity}</span>

      {/* Increase button */}
      <button
        className="quantity-btn"
        onClick={onIncrease}
        disabled={quantity >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}