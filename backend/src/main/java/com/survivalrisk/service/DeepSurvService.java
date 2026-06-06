package com.survivalrisk.service;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Map;

@Service
public class DeepSurvService {

    @Autowired
    private ArtifactLoader artifacts;

    private static final int MAX_T = 60;

    public double[] predict(double[] rawFeatures) throws OrtException {
        int n = artifacts.featureCols.size();
        Map<String, Integer> numericIndex = CoxPhService.buildNumericIndex(artifacts.deepSurvNumericCols);

        float[][] input = new float[1][n];
        for (int i = 0; i < n; i++) {
            String col = artifacts.featureCols.get(i);
            Integer idx = numericIndex.get(col);
            input[0][i] = (float) ((idx != null)
                    ? (rawFeatures[i] - artifacts.deepSurvMean[idx]) / artifacts.deepSurvStd[idx]
                    : rawFeatures[i]);
        }

        try (OnnxTensor tensor = OnnxTensor.createTensor(artifacts.ortEnv, input);
             OrtSession.Result result = artifacts.deepSurvSession.run(Map.of("features", tensor))) {

            float[] logRiskArr = (float[]) ((OnnxTensor) result.get("log_risk").get()).getValue();
            double expLogRisk = Math.exp(logRiskArr[0]);

            double[] survival = new double[MAX_T];
            for (int t = 1; t <= MAX_T; t++) {
                survival[t - 1] = Math.exp(-lookupH0(t) * expLogRisk);
            }
            return survival;
        }
    }

    private double lookupH0(double t) {
        double[] times = artifacts.h0Times;
        int idx = Arrays.binarySearch(times, t);
        if (idx >= 0) return artifacts.h0Values[idx];
        // insertionPoint = first index where times[i] > t
        int insertPt = -(idx + 1);
        if (insertPt == 0) return 0.0;
        return artifacts.h0Values[insertPt - 1];
    }
}
