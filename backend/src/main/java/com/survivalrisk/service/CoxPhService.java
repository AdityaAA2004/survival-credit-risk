package com.survivalrisk.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class CoxPhService {

    @Autowired
    private ArtifactLoader artifacts;

    private static final int MAX_T = 60;

    public double[] predict(double[] rawFeatures) {
        Map<String, Integer> numericIndex = buildNumericIndex(artifacts.coxNumericCols);

        double[] scaled = new double[artifacts.featureCols.size()];
        for (int i = 0; i < artifacts.featureCols.size(); i++) {
            String col = artifacts.featureCols.get(i);
            Integer idx = numericIndex.get(col);
            scaled[i] = (idx != null)
                    ? (rawFeatures[i] - artifacts.coxMean[idx]) / artifacts.coxStd[idx]
                    : rawFeatures[i];
        }

        double riskScore = 0.0;
        for (int i = 0; i < artifacts.featureCols.size(); i++) {
            Double coef = artifacts.coxCoef.get(artifacts.featureCols.get(i));
            if (coef != null) riskScore += coef * scaled[i];
        }
        double expRisk = Math.exp(riskScore);

        double[] survival = new double[MAX_T];
        for (int t = 1; t <= MAX_T; t++) {
            survival[t - 1] = Math.pow(interpolateBaseline(t), expRisk);
        }
        return survival;
    }

    private double interpolateBaseline(double t) {
        double[] times = artifacts.coxBaseTimes;
        double[] surv  = artifacts.coxBaseSurv;
        if (t <= times[0]) return surv[0];
        if (t >= times[times.length - 1]) return surv[surv.length - 1];
        int lo = 0, hi = times.length - 1;
        while (lo < hi - 1) {
            int mid = (lo + hi) / 2;
            if (times[mid] <= t) lo = mid; else hi = mid;
        }
        double frac = (t - times[lo]) / (times[hi] - times[lo]);
        return surv[lo] + frac * (surv[hi] - surv[lo]);
    }

    static Map<String, Integer> buildNumericIndex(java.util.List<String> numericCols) {
        Map<String, Integer> map = new HashMap<>();
        for (int i = 0; i < numericCols.size(); i++) map.put(numericCols.get(i), i);
        return map;
    }
}
