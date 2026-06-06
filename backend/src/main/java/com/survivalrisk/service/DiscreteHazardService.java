package com.survivalrisk.service;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class DiscreteHazardService {

    @Autowired
    private ArtifactLoader artifacts;

    private static final int MAX_T = 60;

    public double[] predict(double[] rawFeatures) throws OrtException {
        int n = artifacts.featureCols.size();

        // All 34 features are scaled by the discrete hazard scaler
        double[] scaledFeatures = new double[n];
        for (int i = 0; i < n; i++) {
            scaledFeatures[i] = (rawFeatures[i] - artifacts.discreteMean[i]) / artifacts.discreteStd[i];
        }

        // Build (60, 35) input: [scaled_features | scaled_t] for each t
        float[][] input = new float[MAX_T][n + 1];
        for (int t = 1; t <= MAX_T; t++) {
            for (int j = 0; j < n; j++) input[t - 1][j] = (float) scaledFeatures[j];
            input[t - 1][n] = (float) ((t - artifacts.discreteTimeMean) / artifacts.discreteTimeStd);
        }

        try (OnnxTensor tensor = OnnxTensor.createTensor(artifacts.ortEnv, input);
             OrtSession.Result result = artifacts.discreteSession.run(Map.of("float_input", tensor))) {

            float[][] probs = (float[][]) ((OnnxTensor) result.get("probabilities").get()).getValue();

            double[] survival = new double[MAX_T];
            double s = 1.0;
            for (int i = 0; i < MAX_T; i++) {
                s *= (1.0 - probs[i][1]);
                survival[i] = s;
            }
            return survival;
        }
    }
}
