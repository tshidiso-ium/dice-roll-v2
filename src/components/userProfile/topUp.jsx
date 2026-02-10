import { useState, useEffect } from "react";

const DAILY_LIMIT = 5000;     // R5,000
const MONTHLY_LIMIT = 20000; // R20,000
const PAYMENT_TIMEOUT = 15000; // 15 seconds

export default function TopUpModal({
  open,
  onClose,
  wallet,
  onRedirectToPayment,
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setError("");
      setLoading(false);
      if (timeoutId) clearTimeout(timeoutId);
    }
  }, [open]);

  const validateLimits = (value) => {
    if (value < 10) return "Minimum deposit is R10";

    if (wallet.todayDeposited + value > DAILY_LIMIT) {
      return `Daily deposit limit exceeded (R${DAILY_LIMIT})`;
    }

    if (wallet.monthDeposited + value > MONTHLY_LIMIT) {
      return `Monthly deposit limit exceeded (R${MONTHLY_LIMIT})`;
    }

    return null;
  };

  const handleProceed = async () => {
    const value = Number(amount);
    const limitError = validateLimits(value);

    if (limitError) {
      setError(limitError);
      return;
    }

    try {
      setLoading(true);

      // Timeout safety
      const id = setTimeout(() => {
        setError("Payment service took too long. Please try again.");
        setLoading(false);
      }, PAYMENT_TIMEOUT);

      setTimeoutId(id);

      await onRedirectToPayment(value);
    } catch {
      setError("Unable to initiate payment.");
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-gradient-to-br from-[#1a0000] to-[#0a0000]
        border border-yellow-500/30 rounded-2xl shadow-2xl p-6 text-white">

        <h3 className="text-center text-2xl font-extrabold text-yellow-400 mb-2">
          💳 Top Up Wallet
        </h3>

        <p className="text-xs text-gray-400 text-center mb-3">
          Deposit limits: R{DAILY_LIMIT}/day · R{MONTHLY_LIMIT}/month
        </p>

        {/* Responsible Gambling */}
        <div className="text-xs text-yellow-400/80 bg-black/40 p-2 rounded-lg mb-4">
          ⚠️ Gamble responsibly. Only deposit what you can afford to lose.
        </div>

        {/* Quick amounts */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[50, 100, 200].map(v => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className="py-2 rounded-lg border border-yellow-500/30 text-yellow-400 hover:bg-yellow-400 hover:text-black transition text-sm font-bold"
            >
              R{v}
            </button>
          ))}
        </div>

        <input
          type="number"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError("");
          }}
          placeholder="Custom amount"
          className="w-full px-4 py-3 rounded-xl bg-black/60 border border-yellow-500/30
            text-white focus:outline-none focus:border-yellow-400 mb-3"
        />

        {error && (
          <p className="text-red-400 text-sm text-center mb-3">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            disabled={loading}
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-500 text-gray-300 hover:bg-gray-700 transition"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={handleProceed}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-green-400 to-emerald-600
              text-black font-extrabold hover:brightness-110 transition"
          >
            {loading ? "Redirecting…" : "Proceed to Pay"}
          </button>
        </div>
      </div>
    </div>
  );
}