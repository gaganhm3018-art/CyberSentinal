const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
const dateTime = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Kolkata",
})

export function formatINR(value: number) {
  return inr.format(value)
}

export function formatDateTime(iso: string) {
  return `${dateTime.format(new Date(iso))} IST`
}

export function formatPoints(value: number) {
  return value.toFixed(1)
}
