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

  const field = (label: string, key: keyof FormValues, type = "number") => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type={type}
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-sm w-full"
      />
    </div>
  );

  const select = (label: string, key: keyof FormValues, options: string[]) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      <select
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-sm w-full bg-white"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Loan</h3>
        <div className="grid grid-cols-2 gap-3">
          {field("Amount ($)", "loan_amnt")}
          {select("Term (months)", "term", ["36", "60"])}
          {field("Interest rate (%)", "int_rate")}
          {field("Installment ($)", "installment")}
          {select("Purpose", "purpose", PURPOSES)}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Borrower</h3>
        <div className="grid grid-cols-2 gap-3">
          {select("Grade", "grade", Object.keys(GRADE_MAP))}
          {select("Sub-grade", "sub_grade", Object.keys(SUB_GRADE_MAP))}
          {field("Employment length (years)", "emp_length")}
          {field("Annual income ($)", "annual_inc")}
          {field("DTI", "dti")}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Credit history</h3>
        <div className="grid grid-cols-2 gap-3">
          {field("FICO low", "fico_range_low")}
          {field("FICO high", "fico_range_high")}
          {field("Open accounts", "open_acc")}
          {field("Public records", "pub_rec")}
          {field("Revolving balance ($)", "revol_bal")}
          {field("Revolving utilization (%)", "revol_util")}
          {field("Total accounts", "total_acc")}
          {field("Delinquencies (2yr)", "delinq_2yrs")}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Housing & verification</h3>
        <div className="grid grid-cols-2 gap-3">
          {select("Home ownership", "home_ownership", HOME_OWNERSHIPS)}
          {select("Verification status", "verification_status", VERIFICATION_STATUSES)}
        </div>
      </section>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-900 text-white rounded py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Predicting..." : "Predict survival"}
      </button>
    </form>
  );
}
