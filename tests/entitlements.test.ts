import { describe, it, expect } from "vitest";
import {
  applyStreakProtection,
  dailyCoinMultiplier,
  entitlementStatus,
  extendExpiry,
  isPremiumActive,
  monthlyAllowance,
  rollAllowance,
  PREMIUM_FREEZES_PER_MONTH,
  PREMIUM_REPAIRS_PER_MONTH,
} from "@/lib/entitlements";
import { GRACE_DAYS, PLANS, PRICE_PKR, YEARLY_MONTHLY_EQUIV, YEARLY_SAVING_PCT, FEATURES, planAmount } from "@/lib/plans";
import { verificationCode, isValidCodeFormat, canIssueCertificate } from "@/lib/certificate";

const TODAY = "2026-09-08";

describe("entitlement status", () => {
  it("no document → not premium", () => {
    expect(isPremiumActive(null, TODAY)).toBe(false);
    expect(isPremiumActive({ isPremium: false, premiumExpiry: null }, TODAY)).toBe(false);
  });

  it("active subscription with a future expiry is premium", () => {
    const s = entitlementStatus({ isPremium: true, premiumExpiry: "2026-10-08" }, TODAY);
    expect(s.active).toBe(true);
    expect(s.inGrace).toBe(false);
    expect(s.daysLeft).toBe(30);
  });

  it("expiry today is still active (the last paid day counts)", () => {
    expect(isPremiumActive({ isPremium: true, premiumExpiry: TODAY }, TODAY)).toBe(true);
  });

  it(`stays active for ${GRACE_DAYS} days of grace, then downgrades`, () => {
    const expiry = "2026-09-06"; // 2 days ago
    const inGrace = entitlementStatus({ isPremium: true, premiumExpiry: expiry }, TODAY);
    expect(inGrace.active).toBe(true);
    expect(inGrace.inGrace).toBe(true);

    const lapsed = entitlementStatus({ isPremium: true, premiumExpiry: "2026-09-01" }, TODAY);
    expect(lapsed.active).toBe(false);
  });

  it("isPremium:false overrides any expiry (explicit cancellation)", () => {
    expect(isPremiumActive({ isPremium: false, premiumExpiry: "2027-01-01" }, TODAY)).toBe(false);
  });

  it("no expiry + isPremium → lifetime/comped access", () => {
    expect(isPremiumActive({ isPremium: true, premiumExpiry: null }, TODAY)).toBe(true);
  });

  it("trial is reported while it runs", () => {
    const s = entitlementStatus({ isPremium: true, premiumExpiry: "2026-09-15", trialEnd: "2026-09-15" }, TODAY);
    expect(s.trialing).toBe(true);
  });
});

describe("expiry maths", () => {
  it("a first payment starts from today", () => {
    expect(extendExpiry(null, 1, TODAY)).toBe("2026-10-08");
    expect(extendExpiry(null, 12, TODAY)).toBe("2027-09-08");
  });

  it("a renewal stacks on remaining time instead of losing it", () => {
    expect(extendExpiry("2026-09-20", 1, TODAY)).toBe("2026-10-20");
  });

  it("an expired subscription restarts from today", () => {
    expect(extendExpiry("2026-01-01", 1, TODAY)).toBe("2026-10-08");
  });
});

describe("streak protection (premium)", () => {
  const base = { streak: 7, best: 7, lastDay: "2026-09-06", freezes: 0 }; // 1 missed day

  it("free users get no protection", () => {
    const r = applyStreakProtection(base, null, false, TODAY);
    expect(r.used).toBe("none");
    expect(r.next.lastDay).toBe("2026-09-06");
  });

  it("premium: a 1-day gap silently eats a freeze", () => {
    const r = applyStreakProtection(base, null, true, TODAY);
    expect(r.used).toBe("freeze");
    expect(r.next.lastDay).toBe("2026-09-07"); // streak preserved
    expect(r.allowance.freezesUsed).toBe(1);
  });

  it(`only ${PREMIUM_FREEZES_PER_MONTH} freezes per month`, () => {
    const used = { cycle: "2026-09", freezesUsed: PREMIUM_FREEZES_PER_MONTH, repairsUsed: 0 };
    const r = applyStreakProtection(base, used, true, TODAY);
    expect(r.used).toBe("none");
  });

  it("a longer gap uses the monthly repair", () => {
    const gap = { streak: 10, best: 10, lastDay: "2026-09-03", freezes: 0 };
    const r = applyStreakProtection(gap, null, true, TODAY);
    expect(r.used).toBe("repair");
    expect(r.allowance.repairsUsed).toBe(PREMIUM_REPAIRS_PER_MONTH);
  });

  it("counters reset when the PKT month changes", () => {
    const lastMonth = { cycle: "2026-08", freezesUsed: 2, repairsUsed: 1 };
    const rolled = rollAllowance(lastMonth, TODAY);
    expect(rolled.cycle).toBe("2026-09");
    expect(rolled.freezesUsed).toBe(0);
    const a = monthlyAllowance(lastMonth, true, TODAY);
    expect(a.freezesLeft).toBe(PREMIUM_FREEZES_PER_MONTH);
    expect(a.repairsLeft).toBe(PREMIUM_REPAIRS_PER_MONTH);
  });

  it("no protection is wasted when nothing was missed", () => {
    const fine = { streak: 3, best: 3, lastDay: "2026-09-07", freezes: 0 };
    expect(applyStreakProtection(fine, null, true, TODAY).used).toBe("none");
  });
});

describe("coins", () => {
  it("premium doubles daily reward coins, free stays 1x", () => {
    expect(dailyCoinMultiplier(false)).toBe(1);
    expect(dailyCoinMultiplier(true)).toBe(2);
  });
});

describe("plans", () => {
  it("prices are Rs. 299 monthly and Rs. 999 yearly", () => {
    expect(PRICE_PKR.monthly).toBe(299);
    expect(PRICE_PKR.yearly).toBe(999);
    expect(planAmount("premium-monthly")).toBe(299);
    expect(planAmount("premium-yearly")).toBe(999);
  });

  it("yearly is advertised as Rs. 83/mah with 72% bachat", () => {
    expect(YEARLY_MONTHLY_EQUIV).toBe(83);
    expect(YEARLY_SAVING_PCT).toBe(72);
    expect(PLANS["premium-yearly"].note).toBe("Rs. 83/mah · 72% bachat");
    expect(PLANS["premium-yearly"].badge).toBe("Sab se popular");
  });

  it("yearly has a 7-day trial, monthly has none", () => {
    expect(PLANS["premium-yearly"].trialDays).toBe(7);
    expect(PLANS["premium-monthly"].trialDays).toBe(0);
  });

  it("family plan stays behind a feature flag", () => {
    expect(FEATURES.familyPlan).toBe(false);
  });
});

describe("certificates", () => {
  it("codes are deterministic and well-formed", () => {
    const a = verificationCode({ uid: "u1", language: "English", level: 10 });
    const b = verificationCode({ uid: "u1", language: "English", level: 10 });
    expect(a).toBe(b);
    expect(isValidCodeFormat(a)).toBe(true);
  });

  it("different learners get different codes", () => {
    const a = verificationCode({ uid: "u1", language: "English", level: 10 });
    const c = verificationCode({ uid: "u2", language: "English", level: 10 });
    expect(a).not.toBe(c);
  });

  it("issuance requires premium and a minimum level", () => {
    expect(canIssueCertificate(10, false).ok).toBe(false);
    expect(canIssueCertificate(2, true).ok).toBe(false);
    expect(canIssueCertificate(10, true).ok).toBe(true);
  });
});
