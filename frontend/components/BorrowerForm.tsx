"use client";

import { useState } from "react";

export interface FormValues {
  loan_amnt: string;
  term: string;
  int_rate: string;
  installment: string;
  purpose: string;
  grade: string;
  sub_grade: string;
  emp_length: string;
  annual_inc: string;
  dti: string;
  fico_range_low: string;
  fico_range_high: string;
  open_acc: string;
  pub_rec: string;
  revol_bal: string;
  revol_util: string;
  total_acc: string;
  delinq_2yrs: string;
  home_ownership: string;
  verification_status: string;
}

const GRADE_MAP: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7,
};

const SUB_GRADE_MAP: Record<string, number> = Object.fromEntries(
  ["A", "B", "C", "D", "E", "F", "G"].flatMap((g, gi) =>
    [1, 2, 3, 4, 5].map((n, ni) => [`${g}${n}`, gi * 5 + ni + 1])
  )
);

const PURPOSES = [
  "car", "credit_card", "debt_consolidation", "educational",
  "home_improvement", "house", "major_purchase", "medical",
  "moving", "other", "renewable_energy", "small_business",
  "vacation", "wedding",
];

const HOME_OWNERSHIPS = ["MORTGAGE", "OTHER", "OWN", "RENT"];
const VERIFICATION_STATUSES = ["Not Verified", "Source Verified", "Verified"];

const DEFAULTS: FormValues = {
  loan_amnt: "10000", term: "36", int_rate: "12.5", installment: "333",
  purpose: "debt_consolidation", grade: "C", sub_grade: "C3",
  emp_length: "5", annual_inc: "65000", dti: "18",
  fico_range_low: "680", fico_range_high: "684",
  open_acc: "10", pub_rec: "0", revol_bal: "8000",
  revol_util: "40", total_acc: "20", delinq_2yrs: "0",
  home_ownership: "RENT", verification_status: "Source Verified",
};

const PRESETS: { name: string; detail: string; values: FormValues }[] = [
  {
    name: "Prime",
    detail: "Lower leverage, cleaner bureau profile.",
    values: {
      loan_amnt: "8000",
      term: "36",
      int_rate: "8.7",
      installment: "253",
      purpose: "home_improvement",
      grade: "A",
      sub_grade: "A3",
      emp_length: "9",
      annual_inc: "110000",
      dti: "11",
      fico_range_low: "760",
      fico_range_high: "764",
      open_acc: "12",
      pub_rec: "0",
      revol_bal: "6200",
      revol_util: "19",
      total_acc: "31",
      delinq_2yrs: "0",
      home_ownership: "MORTGAGE",
      verification_status: "Verified",
    },
  },
  {
    name: "Balanced",
    detail: "Mid-tier credit with stable repayment capacity.",
    values: DEFAULTS,
  },
  {
    name: "Stressed",
    detail: "Higher pricing, thinner cash flow, weaker history.",
    values: {
      loan_amnt: "22000",
      term: "60",
      int_rate: "23.4",
      installment: "607",
      purpose: "debt_consolidation",
      grade: "E",
      sub_grade: "E4",
      emp_length: "2",
      annual_inc: "42000",
      dti: "29",
      fico_range_low: "620",
      fico_range_high: "624",
      open_acc: "7",
      pub_rec: "1",
      revol_bal: "15400",
      revol_util: "82",
      total_acc: "14",
      delinq_2yrs: "2",
      home_ownership: "RENT",
      verification_status: "Source Verified",
    },
  },
];

interface Props {
  featureCols: string[];
  onSubmit: (features: Record<string, number>) => void;
  loading: boolean;
}

export default function BorrowerForm({ featureCols, onSubmit, loading }: Props) {
  const [values, setValues] = useState<FormValues>(DEFAULTS);

  function set(k: keyof FormValues, v: string) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Build raw feature map from form values
    const raw: Record<string, number> = {
      loan_amnt: +values.loan_amnt,
      int_rate: +values.int_rate,
      installment: +values.installment,
      grade: GRADE_MAP[values.grade] ?? 3,
      sub_grade: SUB_GRADE_MAP[values.sub_grade] ?? 13,
      emp_length: Math.min(10, Math.max(0, +values.emp_length)),
      annual_inc: +values.annual_inc,
      dti: +values.dti,
      delinq_2yrs: +values.delinq_2yrs,
      open_acc: +values.open_acc,
      pub_rec: +values.pub_rec,
      revol_bal: +values.revol_bal,
      revol_util: +values.revol_util,
      total_acc: +values.total_acc,
      term: +values.term,
      fico_score: (+values.fico_range_low + +values.fico_range_high) / 2,
      // home_ownership one-hot (drop_first → MORTGAGE is baseline)
      home_ownership_OTHER: values.home_ownership === "OTHER" ? 1 : 0,
      home_ownership_OWN: values.home_ownership === "OWN" ? 1 : 0,
      home_ownership_RENT: values.home_ownership === "RENT" ? 1 : 0,
      // purpose one-hot (drop_first → car is baseline)
      purpose_credit_card: values.purpose === "credit_card" ? 1 : 0,
      purpose_debt_consolidation: values.purpose === "debt_consolidation" ? 1 : 0,
      purpose_educational: values.purpose === "educational" ? 1 : 0,
      purpose_home_improvement: values.purpose === "home_improvement" ? 1 : 0,
      purpose_house: values.purpose === "house" ? 1 : 0,
      purpose_major_purchase: values.purpose === "major_purchase" ? 1 : 0,
      purpose_medical: values.purpose === "medical" ? 1 : 0,
      purpose_moving: values.purpose === "moving" ? 1 : 0,
      purpose_other: values.purpose === "other" ? 1 : 0,
      purpose_renewable_energy: values.purpose === "renewable_energy" ? 1 : 0,
      purpose_small_business: values.purpose === "small_business" ? 1 : 0,
      purpose_vacation: values.purpose === "vacation" ? 1 : 0,
      purpose_wedding: values.purpose === "wedding" ? 1 : 0,
      // verification_status one-hot (drop_first → Not Verified is baseline)
      "verification_status_Source Verified": values.verification_status === "Source Verified" ? 1 : 0,
      verification_status_Verified: values.verification_status === "Verified" ? 1 : 0,
    };

    // Submit in featureCols order
    const ordered = Object.fromEntries(featureCols.map((col) => [col, raw[col] ?? 0]));
    onSubmit(ordered);
  }

  const ficoMidpoint = Math.round((+values.fico_range_low + +values.fico_range_high) / 2);
  const incomeToLoanRatio = (+values.annual_inc / Math.max(+values.loan_amnt, 1)).toFixed(1);

  const field = (label: string, key: keyof FormValues, options?: { min?: number; step?: string }) => (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium tracking-[0.02em] text-[var(--muted-strong)]">{label}</label>
      <input
        type="number"
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
        min={options?.min}
        step={options?.step ?? "any"}
        className="form-field text-sm"
      />
    </div>
  );

  const select = (label: string, key: keyof FormValues, options: string[]) => (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium tracking-[0.02em] text-[var(--muted-strong)]">{label}</label>
      <select
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
        className="form-field text-sm"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="editorial-kicker text-[10px]">Scenario presets</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              Start with a plausible borrower profile, then tune the details.
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => setValues(preset.values)}
              className="rounded-[0.85rem] border border-[var(--surface-border)] bg-[#f8fafc] p-4 text-left transition-colors duration-150 hover:bg-[#f1f5f9]"
            >
              <p className="text-sm font-semibold tracking-[-0.02em] text-[var(--foreground)]">{preset.name}</p>
              <p className="mt-2 text-sm leading-5 text-[var(--ink-soft)]">{preset.detail}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="stat-pill rounded-[0.85rem] p-4">
          <p className="soft-caption text-[10px]">FICO midpoint</p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.03em]">{ficoMidpoint}</p>
        </div>
        <div className="stat-pill rounded-[0.85rem] p-4">
          <p className="soft-caption text-[10px]">Debt-to-income</p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.03em]">{values.dti}%</p>
        </div>
        <div className="stat-pill rounded-[0.85rem] p-4">
          <p className="soft-caption text-[10px]">Revolving use</p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.03em]">{values.revol_util}%</p>
        </div>
        <div className="stat-pill rounded-[0.85rem] p-4">
          <p className="soft-caption text-[10px]">Income / loan</p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.03em]">{incomeToLoanRatio}x</p>
        </div>
      </section>

      <section>
        <div className="mb-3">
          <p className="editorial-kicker text-[10px]">Loan structure</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {field("Amount ($)", "loan_amnt", { min: 0 })}
          {select("Term (months)", "term", ["36", "60"])}
          {field("Interest rate (%)", "int_rate", { min: 0 })}
          {field("Installment ($)", "installment", { min: 0 })}
          {select("Purpose", "purpose", PURPOSES)}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <p className="editorial-kicker text-[10px]">Borrower profile</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {select("Grade", "grade", Object.keys(GRADE_MAP))}
          {select("Sub-grade", "sub_grade", Object.keys(SUB_GRADE_MAP))}
          {field("Employment length (years)", "emp_length", { min: 0, step: "1" })}
          {field("Annual income ($)", "annual_inc", { min: 0 })}
          {field("DTI", "dti", { min: 0 })}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <p className="editorial-kicker text-[10px]">Credit history</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {field("FICO low", "fico_range_low", { min: 0, step: "1" })}
          {field("FICO high", "fico_range_high", { min: 0, step: "1" })}
          {field("Open accounts", "open_acc", { min: 0, step: "1" })}
          {field("Public records", "pub_rec", { min: 0, step: "1" })}
          {field("Revolving balance ($)", "revol_bal", { min: 0 })}
          {field("Revolving utilization (%)", "revol_util", { min: 0 })}
          {field("Total accounts", "total_acc", { min: 0, step: "1" })}
          {field("Delinquencies (2yr)", "delinq_2yrs", { min: 0, step: "1" })}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <p className="editorial-kicker text-[10px]">Verification context</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {select("Home ownership", "home_ownership", HOME_OWNERSHIPS)}
          {select("Verification status", "verification_status", VERIFICATION_STATUSES)}
        </div>
      </section>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-[0.85rem] bg-[var(--accent)] px-4 py-3.5 text-sm font-semibold tracking-[0.02em] text-white transition-colors duration-150 hover:bg-[#1c4f8e] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Scoring borrower..." : "Run survival forecast"}
      </button>
    </form>
  );
}
