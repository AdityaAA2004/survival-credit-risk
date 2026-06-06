package com.survivalrisk.service;

import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtSession;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@Component
public class ArtifactLoader {

    @Value("${artifacts.path}")
    private String artifactsPath;

    public List<String> featureCols;

    List<String> coxNumericCols;
    double[] coxMean;
    double[] coxStd;
    Map<String, Double> coxCoef;
    double[] coxBaseTimes;
    double[] coxBaseSurv;

    double[] discreteMean;
    double[] discreteStd;
    double discreteTimeMean;
    double discreteTimeStd;

    List<String> deepSurvNumericCols;
    double[] deepSurvMean;
    double[] deepSurvStd;
    double[] h0Times;
    double[] h0Values;

    OrtEnvironment ortEnv;
    OrtSession discreteSession;
    OrtSession deepSurvSession;

    @PostConstruct
    public void load() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        Path base = Paths.get(artifactsPath).toAbsolutePath().normalize();

        featureCols = mapper.readValue(base.resolve("feature_cols.json").toFile(),
                new TypeReference<>() {});

        JsonNode coxScaler = mapper.readTree(base.resolve("cox_scaler.json").toFile());
        coxNumericCols = mapper.convertValue(coxScaler.get("numeric_cols"), new TypeReference<>() {});
        coxMean = toDoubleArray(coxScaler.get("mean"));
        coxStd  = toDoubleArray(coxScaler.get("std"));

        coxCoef = mapper.readValue(base.resolve("cox_ph_coef.json").toFile(),
                new TypeReference<>() {});

        JsonNode coxBaseline = mapper.readTree(base.resolve("cox_ph_baseline.json").toFile());
        coxBaseTimes = toDoubleArray(coxBaseline.get("times"));
        coxBaseSurv  = toDoubleArray(coxBaseline.get("survival"));

        JsonNode discScaler = mapper.readTree(base.resolve("discrete_scaler.json").toFile());
        discreteMean     = toDoubleArray(discScaler.get("mean"));
        discreteStd      = toDoubleArray(discScaler.get("std"));
        discreteTimeMean = discScaler.get("time_mean").asDouble();
        discreteTimeStd  = discScaler.get("time_std").asDouble();

        JsonNode deepScaler = mapper.readTree(base.resolve("deepsurv_scaler.json").toFile());
        deepSurvNumericCols = mapper.convertValue(deepScaler.get("numeric_cols"), new TypeReference<>() {});
        deepSurvMean = toDoubleArray(deepScaler.get("mean"));
        deepSurvStd  = toDoubleArray(deepScaler.get("std"));

        JsonNode h0Node = mapper.readTree(base.resolve("deepsurv_H0.json").toFile());
        h0Times  = toDoubleArray(h0Node.get("time_points"));
        h0Values = toDoubleArray(h0Node.get("H0"));

        ortEnv = OrtEnvironment.getEnvironment();
        discreteSession = ortEnv.createSession(
                base.resolve("discrete_hazard.onnx").toString(),
                new OrtSession.SessionOptions());
        deepSurvSession = ortEnv.createSession(
                base.resolve("deepsurv.onnx").toString(),
                new OrtSession.SessionOptions());

        System.out.println("artifacts loaded: " + featureCols.size() + " features");
    }

    private double[] toDoubleArray(JsonNode node) {
        double[] arr = new double[node.size()];
        for (int i = 0; i < node.size(); i++) arr[i] = node.get(i).asDouble();
        return arr;
    }
}
