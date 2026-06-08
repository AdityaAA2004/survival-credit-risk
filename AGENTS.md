# Project: survival-credit-risk

## What this project is

A survival analysis pipeline for credit default prediction using LendingClub's public loan dataset (2007–2018). The goal is to model time-to-default, not just binary default classification. Three models are built in sequence, each relaxing a different assumption from the previous one.

The notebook pipeline lives in `model_development/`. A full-stack serving application (Spring Boot backend + Next.js frontend) is built and running alongside it.

---

## The problem being solved

Standard classification asks: will this borrower default? Survival analysis asks: when will this borrower default, and what is the probability they survive past month N?

Survival analysis is necessary here because many loans are *censored* — the borrower is still active when the dataset snapshot ends. They haven't defaulted, but they haven't finished paying either. Dropping them biases the model. Survival models use them correctly by treating them as right-censored observations.

**event = 1**: loan charged off or defaulted  
**event = 0**: loan fully paid, current, late, or in grace period (censored)  
**duration**: months from issue date to last payment date, clipped to minimum 1

---

## Dataset

LendingClub accepted loans, downloaded via Kaggle API:
- Dataset slug: `wordsforthewise/lending-club`
- File: `accepted_2007_to_2018Q4.csv` (~2.5M rows, ~150 columns)
- Stored at `data/` locally, gitignored, never committed

Processed splits saved as parquet at `data/processed/`:
- `train.parquet` — loans issued before 2015
- `val.parquet` — loans issued in 2015
- `test.parquet` — loans issued after 2015

Split is **temporal**, not random. This avoids data leakage and reflects real deployment conditions.

---

## Notebooks

### data_pipeline.ipynb
- Downloads data via `kaggle.api`
- Filters to usable loan statuses
- Constructs `duration` and `event` columns
- Selects origination-time features only (no post-issuance leakage)
- Cleans `term`, `int_rate`, `revol_util`, `emp_length`
- Imputes: median for numeric, mode for categorical
- Encodes: ordinal for `grade`/`sub_grade`, one-hot for `home_ownership`/`purpose`/`verification_status`
- Temporal train/val/test split
- Saves to parquet
- Runs leakage assertion and duration sanity checks

### cox_prop_hazard.ipynb (complete)
Cox Proportional Hazards model. Interpretable baseline. Implemented using `lifelines`. Averages fico_range_low and fico_range_high into fico_score. Scales numeric features with StandardScaler. penalizer=0.1 for L2 regularization. Schoenfeld residual test run on a 10k sample (not full train — too slow). Evaluated with C-statistic and Brier Score at t=12,24,36 months.
Results: val C-stat=0.6848, test C-stat=0.6931. Brier scores well below 0.25 across all horizons. This is the baseline target for the remaining two models to beat.

### discrete_hazard.ipynb (complete)
Discrete-time hazard model. Person-period expansion converts each borrower into T monthly rows. LogisticRegression trained on expanded set (~12.5M rows). Survival curve is the product of per-interval survival probabilities. No proportional hazards assumption. Exported to ONNX for serving.
Results: val C-stat=0.6850, test C-stat=0.6921. Val Brier: 0.0549/0.1092/0.1340 at t=12/24/36.

### deepsurv.ipynb (complete)
DeepSurv neural network. Feedforward network trained with Cox partial likelihood loss. Implemented in PyTorch. Same evaluation harness as Cox. Exported to ONNX for serving.
Results: val C-stat=0.6916, test C-stat=0.7015. Val Brier: 0.0549/0.1083/0.1341 at t=12/24/36. Best test C-statistic of the three models.

---

## Feature columns (origination-time only)

```
loan_amnt, int_rate, installment, grade, sub_grade, emp_length,
home_ownership, annual_inc, verification_status, purpose, dti,
delinq_2yrs, fico_score, open_acc, pub_rec,
revol_bal, revol_util, total_acc, term
```

`fico_score` is the average of `fico_range_low` and `fico_range_high`, computed during pipeline.

Leakage columns (never include): recoveries, total_pymnt, out_prncp, collection_*, last_pymnt_*

---

## Encoding decisions

- `grade`: ordinal A=1 to G=7 (natural risk ordering)
- `sub_grade`: ordinal A1=1 to G5=35 (same reasoning)
- `home_ownership`, `purpose`, `verification_status`: one-hot with drop_first=True (no natural ordering)
- `emp_length`: mapped to integer years (0-10), NaN imputed with median

---

## Evaluation metrics (same across all three models)

- C-statistic (concordance index): measures ranking ability, analogous to AUC for survival models
- Brier Score: measures calibration of survival probability estimates over time
- Calibration curves: visual check of predicted vs actual survival probabilities

---

## Code style

These rules are non-negotiable and apply to every file in this project:

- No emojis anywhere — not in print statements, comments, or docstrings
- No artificial formatting in print/log statements. Write `print(df.shape)` not `print(f"Shape of dataframe: {df.shape} rows 🎉")`
- No excessive file generation — do not create markdown docs, READMEs, or helper scripts unless explicitly asked
- No closing markdown cells in notebooks
- Notebook markdown cells contain section headings only — no descriptions, no explanations, no prose
- Plain cell output — let the data speak, do not dress up print statements
- When fixing a bug: explain the cause, recommend the fix in chat, let the developer apply it
- When adding a feature: look through existing notebooks for code style patterns and match them exactly
- Libraries: pandas + numpy for data, matplotlib for plots, lifelines for Cox PH, scikit-learn for discrete-time, PyTorch for DeepSurv

---

## Backend (Spring Boot)

Spring Boot 4.0.6, Java 26. Package: `com.survivalrisk`. Runs on port 8080.

Artifacts loaded at startup from `../artifacts/`:
- `cox_ph_coef.json`, `cox_ph_baseline.json`, `cox_scaler.json` — Cox PH (analytical inference)
- `discrete_hazard.onnx`, `discrete_scaler.json` — discrete hazard (ONNX)
- `deepsurv.onnx`, `deepsurv_H0.json`, `deepsurv_scaler.json` — DeepSurv (ONNX)
- `feature_cols.json` — canonical column order

REST API:
- `GET /api/features` — returns feature column list in model order
- `POST /api/predict` — accepts `BorrowerInput` JSON, returns survival curves from all three models concurrently via `StructuredTaskScope`

Run: `cd backend && mvn spring-boot:run`

---

## Frontend (Next.js)

Next.js 16.2.7, React 19.2.4, TypeScript. Runs on port 3000.

API base: `http://localhost:8080/api` (configurable via `NEXT_PUBLIC_API_BASE_URL`).

Components:
- `RiskWorkbench` — main layout: header stats, model stack, form + results
- `BorrowerForm` — dynamically renders fields in the order returned by `GET /api/features`
- `ResultsPanel` — displays per-horizon default probabilities and cross-model comparison
- `SurvivalChart` — survival curve chart across all three models

Run: `cd frontend && npm run dev`

---

## Current status

data_pipeline.ipynb — complete
cox_prop_hazard.ipynb — complete (val C-stat 0.6848, test C-stat 0.6931, test Brier 0.0865 at t=36)
discrete_hazard.ipynb — complete (val C-stat 0.6850, test C-stat 0.6921, test Brier 0.0868 at t=36)
deepsurv.ipynb — complete (val C-stat 0.6916, test C-stat 0.7015, test Brier 0.0875 at t=36)
backend — complete (Spring Boot 4.0.6, ONNX serving, concurrent inference)
frontend — complete (Next.js 16.2.7, borrower input form, survival curve visualization)
